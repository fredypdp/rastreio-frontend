"use client";
import { useCallback, useEffect, useState } from "react";
import { academiaService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserCookie } from "@/hooks/useUserCookie";
import type { MetodoPagamentoServico, ModoPrazoServico, ModoPrecoServico, RotaTransporte, TransporteConfig } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { PageDescription, PageHeading, Section, SectionDescription, SectionTitle } from "@/components/ui/typography/Typography";
import { LoadingState } from "@/components/paineis/financeiroShared";
import { MetodosPagamentoCheckboxes, useMetodosDoProvedor } from "@/components/paineis/financeiroNivelShared";
import {
  DisponibilidadeServico, EscolhaUnica, MesesSelector, ProblemasConfiguracao, formatarKz, horaCompleta, lerValor, mesesTexto,
} from "@/components/paineis/ServicosShared";

const OPCOES_PRECO: Array<{ value: ModoPrecoServico; label: string }> = [
  { value: "nenhum", label: "Não definido (cada rota define)" },
  { value: "gratuito", label: "Gratuito" },
  { value: "valor", label: "Com preço" },
];
const OPCOES_PRAZO: Array<{ value: ModoPrazoServico; label: string }> = [
  { value: "nenhum", label: "Não definido (cada rota define)" },
  { value: "gratuito", label: "Gratuito (nenhum mês é cobrado)" },
  { value: "meses", label: "Meses cobrados" },
];

interface FormGeral {
  precoModo: ModoPrecoServico; preco: string; prazoModo: ModoPrazoServico; prazoMeses: number[];
  taxa: boolean; valorTaxa: string; metodosTaxa: MetodoPagamentoServico[]; metodos: MetodoPagamentoServico[];
  anos: string[]; cursos: string[]; ativo: boolean;
}

const paraForm = (t: TransporteConfig): FormGeral => ({
  precoModo: t.preco_geral_modo, preco: t.preco_geral_modo === "valor" ? String(t.preco_geral) : "",
  prazoModo: t.prazo_geral_modo, prazoMeses: t.prazo_geral_meses,
  taxa: t.tem_taxa_inscricao, valorTaxa: t.tem_taxa_inscricao ? String(t.valor_taxa_inscricao) : "",
  metodosTaxa: t.metodos_pagamento_taxa_inscricao, metodos: t.metodos_pagamento,
  anos: t.anos_academicos_disponiveis, cursos: t.cursos_disponiveis, ativo: t.ativo,
});

const alternar = <T,>(lista: T[], item: T) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]);

interface FormRota { id?: string; nome: string; horario: string; precoModo: ModoPrecoServico; preco: string; meses: number[]; }
const rotaVazia: FormRota = { nome: "", horario: "", precoModo: "nenhum", preco: "", meses: [] };

/** /servicos-extras/transporte (Parte 7) — configuração do Transporte da academia: geral, rotas e veículos. */
export default function TransportePainel() {
  const { user } = useUserCookie();
  const { metodosSuportados, provedorAtivoNome } = useMetodosDoProvedor(user?.academia?.codigo_academia);
  const [dados, setDados] = useState<TransporteConfig | null>(null);
  const [form, setForm] = useState<FormGeral | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [rota, setRota] = useState<FormRota | null>(null);
  const [novoVeiculo, setNovoVeiculo] = useState<Record<string, string>>({});

  const aplicar = (t: TransporteConfig) => { setDados(t); setForm(paraForm(t)); };
  const carregar = useCallback(() => {
    academiaService.getTransporte()
      .then((r) => aplicar(r.data))
      .catch((e) => setErro(formatApiError(e, "Não foi possível carregar o Transporte.")));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  if (!dados || !form) return erro ? <Alert variant="error" title="Transporte" message={erro} /> : <LoadingState label="Carregando Transporte..." />;

  const set = (p: Partial<FormGeral>) => setForm({ ...form, ...p });
  const geralDefinePreco = dados.preco_geral_modo !== "nenhum";
  const geralDefinePrazo = dados.prazo_geral_modo !== "nenhum";

  // Executa uma ação que devolve o transporte inteiro e mostra o resultado.
  const executar = async (fn: () => Promise<{ data: TransporteConfig }>, msg: string) => {
    setErro(null); setOk(null);
    try { aplicar((await fn()).data); setOk(msg); return true; }
    catch (e) { setErro(formatApiError(e, "Não foi possível concluir a ação.")); return false; }
  };

  const salvarGeral = async () => {
    setErro(null); setOk(null);
    let preco: number | undefined;
    if (form.precoModo === "valor") {
      const r = lerValor(form.preco, "Preço geral");
      if (r.erro !== undefined) return setErro(r.erro);
      preco = r.valor;
    }
    let taxa = 0;
    if (form.taxa) {
      const r = lerValor(form.valorTaxa, "Taxa de inscrição");
      if (r.erro !== undefined) return setErro(r.erro);
      taxa = r.valor;
    }
    if (form.prazoModo === "meses" && form.prazoMeses.length === 0) return setErro("Marque ao menos um mês no prazo geral.");
    setSalvando(true);
    await executar(() => academiaService.atualizarTransporte({
      preco_geral_modo: form.precoModo, preco_geral: preco,
      prazo_geral_modo: form.prazoModo, prazo_geral_meses: form.prazoModo === "meses" ? form.prazoMeses : [],
      valor_taxa_inscricao: taxa, metodos_pagamento: form.metodos, metodos_pagamento_taxa_inscricao: form.taxa ? form.metodosTaxa : [],
      anos_academicos_disponiveis: form.anos, cursos_disponiveis: form.cursos, ativo: form.ativo,
    }), "Configuração do Transporte salva.");
    setSalvando(false);
  };

  const salvarRota = async () => {
    if (!rota) return;
    setErro(null);
    let preco: number | undefined;
    if (rota.precoModo === "valor") {
      const r = lerValor(rota.preco, "Preço da rota");
      if (r.erro !== undefined) return setErro(r.erro);
      preco = r.valor;
    }
    const payload = { nome: rota.nome.trim(), horario_embarque: horaCompleta(rota.horario), preco_modo: rota.precoModo, preco, prazo_meses: rota.meses };
    if (!payload.nome) return setErro("Informe o nome da rota.");
    if (!payload.horario_embarque) return setErro("Informe o horário de embarque.");
    const feito = await executar(() => (rota.id ? academiaService.atualizarRotaTransporte(rota.id, payload) : academiaService.criarRotaTransporte(payload)),
      rota.id ? "Rota atualizada." : "Rota criada.");
    if (feito) setRota(null);
  };

  const editarRota = (r: RotaTransporte) => setRota({
    id: r.id, nome: r.nome, horario: r.horario_embarque, precoModo: r.preco_modo,
    preco: r.preco_modo === "valor" ? String(r.preco) : "", meses: r.prazo_meses,
  });

  const textoPreco = (r: RotaTransporte) => (r.gratuito_efetivo ? "Gratuito" : r.preco_efetivo > 0 ? `${formatarKz(r.preco_efetivo)} por mês` : "Preço não definido");

  return (
    <div className="space-y-5">
      <div>
        <PageHeading>Transporte</PageHeading>
        <PageDescription>Configure o preço, o prazo, as rotas e os veículos do transporte da sua academia.</PageDescription>
      </div>
      {erro && <Alert variant="error" title="Transporte" message={erro} />}
      {ok && <Alert variant="success" title="Transporte" message={ok} />}

      <Section>
        <SectionTitle>Preço e prazo gerais</SectionTitle>
        <SectionDescription>
          Se definidos aqui, valem para <b>todas</b> as rotas e nenhuma rota pode ter o seu. Para definir o geral, limpe antes o preço (ou o prazo) próprio das rotas.
        </SectionDescription>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preço mensal geral</p>
          <EscolhaUnica value={form.precoModo} options={OPCOES_PRECO} onChange={(v) => set({ precoModo: v })} />
          {form.precoModo === "valor" && <Input value={form.preco} onChange={(e) => set({ preco: e.target.value })} placeholder="Valor por mês (Kz)" inputMode="decimal" />}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Prazo geral (meses do ano em que é cobrado)</p>
          <EscolhaUnica value={form.prazoModo} options={OPCOES_PRAZO} onChange={(v) => set({ prazoModo: v })} />
          {form.prazoModo === "meses" && <MesesSelector value={form.prazoMeses} onChange={(prazoMeses) => set({ prazoMeses })} />}
        </div>
      </Section>

      <Section>
        <SectionTitle>Pagamento</SectionTitle>
        <SectionDescription>Métodos aceites para as mensalidades (necessários quando há cobrança) e taxa de inscrição, cobrada uma vez quando a inscrição é aprovada.</SectionDescription>
        <MetodosPagamentoCheckboxes kind="servico" selected={form.metodos} onToggle={(m) => set({ metodos: alternar(form.metodos, m) })} suportados={metodosSuportados} provedorNome={provedorAtivoNome} />
        <Checkbox label="Tem taxa de inscrição" checked={form.taxa} onChange={(taxa) => set({ taxa })} />
        {form.taxa && (
          <>
            <Input value={form.valorTaxa} onChange={(e) => set({ valorTaxa: e.target.value })} placeholder="Valor da taxa (Kz)" inputMode="decimal" />
            <MetodosPagamentoCheckboxes kind="taxa_inscricao" selected={form.metodosTaxa} onToggle={(m) => set({ metodosTaxa: alternar(form.metodosTaxa, m) })} suportados={metodosSuportados} provedorNome={provedorAtivoNome} />
          </>
        )}
      </Section>

      <Section>
        <DisponibilidadeServico anos={form.anos} cursos={form.cursos} onChange={({ anos, cursos }) => set({ anos, cursos })} />
      </Section>

      <Section>
        <Checkbox label="Transporte ativo (visível para os estudantes)" checked={form.ativo} onChange={(ativo) => set({ ativo })} />
        <Button onClick={salvarGeral} disabled={salvando}>{salvando ? "Salvando..." : "Salvar configuração"}</Button>
      </Section>

      <Section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Rotas</SectionTitle>
          <Button size="sm" onClick={() => setRota({ ...rotaVazia })}>Nova rota</Button>
        </div>
        <SectionDescription>O estudante escolhe uma rota e ao menos um veículo dela. A rota só aparece para ele com preço, prazo, métodos de pagamento (se for paga) e um veículo ativo.</SectionDescription>
        {dados.rotas.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma rota cadastrada.</p>}
        <div className="space-y-3">
          {dados.rotas.map((r) => (
            <article key={r.id} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">{r.nome}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Embarque às {r.horario_embarque} · {textoPreco(r)} · {mesesTexto(r.gratuito_efetivo && r.meses_efetivos.length === 0 ? [] : r.meses_efetivos)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="sm" color={r.ativo ? "success" : "light"}>{r.ativo ? "Ativa" : "Desativada"}</Badge>
                  {r.ativo && <Badge size="sm" color={r.configurado ? "primary" : "warning"}>{r.configurado ? "Disponível" : "Incompleta"}</Badge>}
                </div>
              </div>
              {r.ativo && <ProblemasConfiguracao problemas={r.problemas} />}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Veículos</p>
                {r.veiculos.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum veículo.</p>}
                <ul className="space-y-1">
                  {r.veiculos.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className={v.ativo ? "" : "line-through opacity-60"}>{v.nome}</span>
                      <span className="flex gap-3 text-xs">
                        <button type="button" className="text-brand-600 dark:text-brand-400" onClick={() => executar(() => academiaService.atualizarVeiculoTransporte(v.id, { ativo: !v.ativo }), v.ativo ? "Veículo desativado." : "Veículo reativado.")}>{v.ativo ? "Desativar" : "Reativar"}</button>
                        <button type="button" className="text-error-600 dark:text-error-400" onClick={() => { if (window.confirm(`Apagar o veículo "${v.nome}"? Só é possível se nenhuma inscrição o usou.`)) executar(() => academiaService.excluirVeiculoTransporte(v.id), "Veículo apagado."); }}>Apagar</button>
                      </span>
                    </li>
                  ))}
                </ul>
                <form className="flex max-w-sm gap-2" onSubmit={async (e) => { e.preventDefault(); const nome = (novoVeiculo[r.id] ?? "").trim(); if (!nome) return; if (await executar(() => academiaService.criarVeiculoTransporte(r.id, nome), "Veículo adicionado.")) setNovoVeiculo((p) => ({ ...p, [r.id]: "" })); }}>
                  <Input value={novoVeiculo[r.id] ?? ""} onChange={(e) => setNovoVeiculo((p) => ({ ...p, [r.id]: e.target.value }))} placeholder="Novo veículo (ex.: Autocarro 1)" />
                  <Button size="sm" variant="outline" type="submit">Adicionar</Button>
                </form>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => editarRota(r)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => executar(() => (r.ativo ? academiaService.desativarRotaTransporte(r.id) : academiaService.reativarRotaTransporte(r.id)), r.ativo ? "Rota desativada." : "Rota reativada.")}>{r.ativo ? "Desativar" : "Reativar"}</Button>
                <Button size="sm" variant="outline" onClick={() => { if (window.confirm(`Apagar a rota "${r.nome}"? Só é possível se nenhuma inscrição a usou; senão, desative.`)) executar(() => academiaService.excluirRotaTransporte(r.id), "Rota apagada."); }}>Apagar</Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Modal isOpen={!!rota} onClose={() => setRota(null)} className="max-w-xl p-6">
        {rota && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">{rota.id ? "Editar rota" : "Nova rota"}</h2>
            <Input value={rota.nome} onChange={(e) => setRota({ ...rota, nome: e.target.value })} placeholder='Nome (ex.: "Rota 1", "Talatona - Kilamba")' />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Horário de embarque</p>
              <Input type="time" value={rota.horario} onChange={(e) => setRota({ ...rota, horario: e.target.value })} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preço mensal da rota</p>
              {geralDefinePreco ? (
                <SectionDescription>O preço geral do transporte está definido: a rota usa o geral.</SectionDescription>
              ) : (
                <>
                  <EscolhaUnica value={rota.precoModo} options={OPCOES_PRECO.map((o) => (o.value === "nenhum" ? { ...o, label: "Não definido" } : o))} onChange={(precoModo) => setRota({ ...rota, precoModo })} />
                  {rota.precoModo === "valor" && <Input value={rota.preco} onChange={(e) => setRota({ ...rota, preco: e.target.value })} placeholder="Valor por mês (Kz)" inputMode="decimal" />}
                </>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Meses cobrados da rota</p>
              {geralDefinePrazo ? (
                <SectionDescription>O prazo geral do transporte está definido: a rota usa o geral.</SectionDescription>
              ) : (
                <MesesSelector value={rota.meses} onChange={(meses) => setRota({ ...rota, meses })} />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRota(null)}>Cancelar</Button>
              <Button onClick={salvarRota}>Salvar rota</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

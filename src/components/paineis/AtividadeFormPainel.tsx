"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { academiaService } from "@/lib/api";
import { ApiError, formatApiError } from "@/lib/api/client";
import { useUserCookie } from "@/hooks/useUserCookie";
import type { AtividadePayload, AtividadeServico, HorarioAtividade, MembroTurmaAtividade, MetodoPagamentoServico } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import SearchableSelect from "@/components/form/SearchableSelect";
import { Modal } from "@/components/ui/modal";
import { PageHeading, Section, SectionDescription, SectionTitle } from "@/components/ui/typography/Typography";
import { LoadingState } from "@/components/paineis/financeiroShared";
import { MetodosPagamentoCheckboxes, useMetodosDoProvedor } from "@/components/paineis/financeiroNivelShared";
import { DIAS_SEMANA, DisponibilidadeServico, MesesSelector, ProblemasConfiguracao, horaCompleta, lerValor } from "@/components/paineis/ServicosShared";

interface FormAtividade {
  nome: string; instrutor: string; coletiva: boolean; gratuito: boolean; preco: string; meses: number[];
  taxa: boolean; valorTaxa: string; metodosTaxa: MetodoPagamentoServico[]; metodos: MetodoPagamentoServico[];
  anos: string[]; cursos: string[]; horarios: HorarioAtividade[];
}
const vazio: FormAtividade = {
  nome: "", instrutor: "", coletiva: false, gratuito: false, preco: "", meses: [], taxa: false, valorTaxa: "",
  metodosTaxa: [], metodos: [], anos: [], cursos: [], horarios: [],
};
const paraForm = (a: AtividadeServico): FormAtividade => ({
  nome: a.nome, instrutor: a.instrutor, coletiva: a.coletiva, gratuito: a.gratuito,
  preco: a.gratuito ? "" : String(a.preco), meses: a.prazo_meses, taxa: a.tem_taxa_inscricao,
  valorTaxa: a.tem_taxa_inscricao ? String(a.valor_taxa_inscricao) : "", metodosTaxa: a.metodos_pagamento_taxa_inscricao,
  metodos: a.metodos_pagamento, anos: a.anos_academicos_disponiveis, cursos: a.cursos_disponiveis,
  horarios: a.horarios,
});
const alternar = <T,>(lista: T[], item: T) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]);
const opcoesDia = DIAS_SEMANA.map((nome, i) => ({ value: String(i + 1), label: nome }));

/** Criar e editar uma Atividade extracurricular (Parte 7), com horários e, se coletiva, turmas da atividade. */
export default function AtividadeFormPainel({ atividadeId }: { atividadeId?: string }) {
  const router = useRouter();
  const { user } = useUserCookie();
  const { metodosSuportados, provedorAtivoNome } = useMetodosDoProvedor(user?.academia?.codigo_academia);
  const [form, setForm] = useState<FormAtividade>(vazio);
  const [atividade, setAtividade] = useState<AtividadeServico | null>(null);
  const [carregando, setCarregando] = useState(!!atividadeId);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [novaTurma, setNovaTurma] = useState("");
  const [membros, setMembros] = useState<{ turma: string; lista: MembroTurmaAtividade[] } | null>(null);

  const aplicar = (a: AtividadeServico) => { setAtividade(a); setForm(paraForm(a)); };

  useEffect(() => {
    if (!atividadeId) return;
    academiaService.getAtividadeServico(atividadeId)
      .then((r) => aplicar(r.data))
      .catch((e) => (e instanceof ApiError && e.status === 404 ? setNaoEncontrada(true) : setErro(formatApiError(e, "Não foi possível carregar a atividade."))))
      .finally(() => setCarregando(false));
  }, [atividadeId]);

  if (carregando) return <LoadingState label="Carregando atividade..." />;
  if (naoEncontrada) return <Alert variant="error" title="Atividades" message="Atividade não encontrada." />;

  const set = (p: Partial<FormAtividade>) => setForm((f) => ({ ...f, ...p }));

  const montar = (): AtividadePayload | null => {
    if (!form.nome.trim() || !form.instrutor.trim()) { setErro("Informe o nome e o instrutor (ou responsável)."); return null; }
    let preco = 0;
    if (!form.gratuito) {
      const r = lerValor(form.preco, "Preço");
      if (r.erro !== undefined) { setErro(r.erro); return null; }
      preco = r.valor;
      if (form.meses.length === 0) { setErro("Marque ao menos um mês: são os meses cobrados."); return null; }
    }
    let taxa = 0;
    if (form.taxa) {
      const r = lerValor(form.valorTaxa, "Taxa de inscrição");
      if (r.erro !== undefined) { setErro(r.erro); return null; }
      taxa = r.valor;
    }
    for (const h of form.horarios) {
      if (!h.hora_inicio || !h.hora_fim) { setErro("Preencha o início e o fim de todos os horários."); return null; }
    }
    return {
      nome: form.nome.trim(), instrutor: form.instrutor.trim(), coletiva: form.coletiva, gratuito: form.gratuito,
      preco: form.gratuito ? undefined : preco, prazo_meses: form.gratuito ? [] : form.meses,
      valor_taxa_inscricao: taxa, metodos_pagamento: form.gratuito ? [] : form.metodos,
      metodos_pagamento_taxa_inscricao: form.taxa ? form.metodosTaxa : [],
      anos_academicos_disponiveis: form.anos, cursos_disponiveis: form.cursos,
      horarios: form.horarios.map((h) => ({ ...h, hora_inicio: horaCompleta(h.hora_inicio), hora_fim: horaCompleta(h.hora_fim) })),
    };
  };

  const salvar = async () => {
    setErro(null); setOk(null);
    const payload = montar();
    if (!payload) return;
    setSalvando(true);
    try {
      if (atividadeId) {
        aplicar((await academiaService.atualizarAtividadeServico(atividadeId, payload)).data);
        setOk("Atividade salva.");
      } else {
        const criada = (await academiaService.criarAtividadeServico(payload)).data;
        // Atividade coletiva precisa de ao menos uma turma: segue para a edição.
        router.push(criada.coletiva ? `/servicos-extras/atividades/editar/${criada.id}` : "/servicos-extras/atividades");
      }
    } catch (e) {
      setErro(formatApiError(e, "Não foi possível salvar a atividade."));
    } finally {
      setSalvando(false);
    }
  };

  // Ações sobre turmas: devolvem a atividade atualizada.
  const recarregar = async () => { if (atividadeId) aplicar((await academiaService.getAtividadeServico(atividadeId)).data); };
  const turmaAcao = async (fn: () => Promise<unknown>, msg: string) => {
    setErro(null); setOk(null);
    try { await fn(); await recarregar(); setOk(msg); } catch (e) { setErro(formatApiError(e, "Não foi possível concluir a ação.")); }
  };
  const verMembros = async (turmaId: string, nome: string) => {
    try { setMembros({ turma: nome, lista: (await academiaService.listarMembrosTurmaAtividade(turmaId)).membros }); }
    catch (e) { setErro(formatApiError(e, "Não foi possível listar os membros.")); }
  };

  const atualizarHorario = (i: number, p: Partial<HorarioAtividade>) => set({ horarios: form.horarios.map((h, n) => (n === i ? { ...h, ...p } : h)) });
  // Uma atividade com inscrições não troca entre individual e coletiva (o servidor recusa com 409).
  return (
    <div className="space-y-5">
      <PageHeading>{atividadeId ? "Editar atividade" : "Nova atividade extracurricular"}</PageHeading>
      {erro && <Alert variant="error" title="Atividades" message={erro} />}
      {ok && <Alert variant="success" title="Atividades" message={ok} />}
      {atividade && <ProblemasConfiguracao problemas={atividade.problemas} />}

      <div className="max-w-3xl space-y-5">
        <Section>
          <SectionTitle>Informações básicas</SectionTitle>
          <Input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder='Nome (ex.: "Dança", "Jiu Jitsu")' />
          <Input value={form.instrutor} onChange={(e) => set({ instrutor: e.target.value })} placeholder="Instrutor ou responsável" />
          <Checkbox label="Atividade coletiva (os estudantes entram numa turma da atividade)" checked={form.coletiva} onChange={(coletiva) => set({ coletiva })} />
          <SectionDescription>Individual: só o estudante vinculado. Coletiva: ao aprovar a inscrição, você escolhe a turma da atividade.</SectionDescription>
        </Section>

        <Section>
          <SectionTitle>Horários</SectionTitle>
          <SectionDescription>Dia da semana, hora de início e hora de fim. Horários do mesmo dia não podem se cruzar.</SectionDescription>
          {form.horarios.map((h, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <div className="w-44"><SearchableSelect value={String(h.dia_semana)} options={opcoesDia} onChange={(v) => atualizarHorario(i, { dia_semana: Number(v) || 1 })} isSearchable={false} isClearable={false} /></div>
              <div className="w-32"><Input type="time" value={h.hora_inicio} onChange={(e) => atualizarHorario(i, { hora_inicio: e.target.value })} /></div>
              <span className="text-sm text-gray-500">até</span>
              <div className="w-32"><Input type="time" value={h.hora_fim} onChange={(e) => atualizarHorario(i, { hora_fim: e.target.value })} /></div>
              <button type="button" className="text-sm text-error-600 dark:text-error-400" onClick={() => set({ horarios: form.horarios.filter((_, n) => n !== i) })}>Remover</button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => set({ horarios: [...form.horarios, { dia_semana: 1, hora_inicio: "", hora_fim: "" }] })}>Adicionar horário</Button>
        </Section>

        <Section>
          <SectionTitle>Preço e prazo</SectionTitle>
          <Checkbox label="Atividade gratuita (nenhum mês é cobrado)" checked={form.gratuito} onChange={(gratuito) => set({ gratuito })} />
          {!form.gratuito && (
            <>
              <Input value={form.preco} onChange={(e) => set({ preco: e.target.value })} placeholder="Preço por mês (Kz)" inputMode="decimal" />
              <SectionDescription>Meses do ano em que a atividade é cobrada. Esses são os meses que o estudante paga, um por vez.</SectionDescription>
              <MesesSelector value={form.meses} onChange={(meses) => set({ meses })} />
              <SectionDescription>Métodos de pagamento aceites para a mensalidade</SectionDescription>
              <MetodosPagamentoCheckboxes kind="servico" selected={form.metodos} onToggle={(m) => set({ metodos: alternar(form.metodos, m) })} suportados={metodosSuportados} provedorNome={provedorAtivoNome} />
            </>
          )}
        </Section>

        <Section>
          <Checkbox label="Tem taxa de inscrição" checked={form.taxa} onChange={(taxa) => set({ taxa })} />
          {form.taxa && (
            <>
              <Input value={form.valorTaxa} onChange={(e) => set({ valorTaxa: e.target.value })} placeholder="Valor da taxa (Kz)" inputMode="decimal" />
              <SectionDescription>Métodos de pagamento aceites para a taxa de inscrição</SectionDescription>
              <MetodosPagamentoCheckboxes kind="taxa_inscricao" selected={form.metodosTaxa} onToggle={(m) => set({ metodosTaxa: alternar(form.metodosTaxa, m) })} suportados={metodosSuportados} provedorNome={provedorAtivoNome} />
            </>
          )}
        </Section>

        <Section>
          <DisponibilidadeServico anos={form.anos} cursos={form.cursos} onChange={({ anos, cursos }) => set({ anos, cursos })} />
        </Section>

        <div className="flex gap-2">
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar atividade"}</Button>
          <Button variant="outline" onClick={() => router.push("/servicos-extras/atividades")}>Voltar</Button>
        </div>

        {atividade && atividade.coletiva && (
          <Section>
            <SectionTitle>Turmas da atividade</SectionTitle>
            <SectionDescription>Não são as turmas acadêmicas. A atividade coletiva só aparece para os estudantes quando tem ao menos uma turma ativa; ao aprovar uma inscrição, você escolhe a turma.</SectionDescription>
            {atividade.turmas.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma turma ainda.</p>}
            <ul className="space-y-2">
              {atividade.turmas.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <span className={`text-gray-800 dark:text-white/90 ${t.ativo ? "" : "line-through opacity-60"}`}>{t.nome} · {t.membros} {t.membros === 1 ? "membro" : "membros"}</span>
                  <span className="flex flex-wrap gap-3 text-xs">
                    <button type="button" className="text-brand-600 dark:text-brand-400" onClick={() => verMembros(t.id, t.nome)}>Ver membros</button>
                    <button type="button" className="text-brand-600 dark:text-brand-400" onClick={() => { const nome = window.prompt("Novo nome da turma:", t.nome); if (nome && nome.trim()) turmaAcao(() => academiaService.atualizarTurmaAtividade(t.id, { nome: nome.trim() }), "Turma renomeada."); }}>Renomear</button>
                    <button type="button" className="text-brand-600 dark:text-brand-400" onClick={() => turmaAcao(() => academiaService.atualizarTurmaAtividade(t.id, { ativo: !t.ativo }), t.ativo ? "Turma desativada." : "Turma reativada.")}>{t.ativo ? "Desativar" : "Reativar"}</button>
                    <button type="button" className="text-error-600 dark:text-error-400" onClick={() => { if (window.confirm(`Apagar a turma "${t.nome}"? Só é possível sem membros e sem inscrições que a usaram.`)) turmaAcao(() => academiaService.excluirTurmaAtividade(t.id), "Turma apagada."); }}>Apagar</button>
                  </span>
                </li>
              ))}
            </ul>
            <form className="flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); const nome = novaTurma.trim(); if (!nome) return; turmaAcao(() => academiaService.criarTurmaAtividade(atividade.id, nome), "Turma criada.").then(() => setNovaTurma("")); }}>
              <Input value={novaTurma} onChange={(e) => setNovaTurma(e.target.value)} placeholder="Nome da nova turma" />
              <Button size="sm" variant="outline" type="submit">Criar turma</Button>
            </form>
          </Section>
        )}
        {atividade && !atividade.coletiva && form.coletiva && (
          <SectionDescription>Salve a atividade como coletiva para poder criar as turmas.</SectionDescription>
        )}
      </div>

      <Modal isOpen={!!membros} onClose={() => setMembros(null)} className="max-w-md p-6">
        {membros && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Membros — {membros.turma}</h2>
            {membros.lista.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum membro.</p> : (
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {membros.lista.map((m) => <li key={m.solicitacao_id}>{m.codigo_estudante} · desde {new Date(m.desde).toLocaleDateString("pt-PT")}</li>)}
              </ul>
            )}
            <div className="flex justify-end"><Button variant="outline" onClick={() => setMembros(null)}>Fechar</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

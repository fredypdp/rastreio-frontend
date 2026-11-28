"use client";
import { useEffect, useState } from "react";
import { academiaService, financeiroService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import type { PendenciaServicoExtra, ServicosAcademiaResponse, SolicitacaoServicoExtra, StatusSolicitacaoServicoExtra } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import SearchableSelect from "@/components/form/SearchableSelect";
import { MESES, formatarKz } from "@/components/paineis/ServicosShared";

const options = [
  { value: "", label: "Todas" }, { value: "pendente", label: "Pendentes" },
  { value: "aprovada_pendente_pagamento_taxa_inscricao", label: "Aguardando Pagamento" },
  { value: "vinculada", label: "Vinculadas" }, { value: "reprovada", label: "Reprovadas" }, { value: "cancelada", label: "Canceladas" },
];
const labels: Record<StatusSolicitacaoServicoExtra, string> = {
  pendente: "Pendente", aprovada_pendente_pagamento_taxa_inscricao: "Aguardando pagamento", vinculada: "Vinculada",
  reprovada: "Reprovada", cancelada: "Cancelada", cancelada_antes_da_vinculacao: "Cancelada",
};

/** /servicos-extras/inscricoes — inscrições dos estudantes em Transporte e atividades (Parte 7). */
export default function ServicosExtrasSolicitacoesPainel() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<SolicitacaoServicoExtra[]>([]);
  const [servicos, setServicos] = useState<ServicosAcademiaResponse | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [turmas, setTurmas] = useState<Record<string, string>>({});
  const [pendencias, setPendencias] = useState<Record<string, PendenciaServicoExtra[]>>({});

  const carregar = async () => {
    setLoading(true); setErro("");
    try {
      const [l, s] = await Promise.all([academiaService.listarSolicitacoesServicoExtra(status || undefined), academiaService.listarServicosAcademia()]);
      setItems(await Promise.all(l.solicitacoes.map((x) => academiaService.getSolicitacaoServicoExtra(x.id).then((r) => r.data))));
      setServicos(s);
    } catch (e) {
      setErro(formatApiError(e, "Não foi possível carregar as solicitações."));
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void carregar(); }, [status]);

  const agir = async (fn: () => Promise<unknown>) => {
    try { await fn(); await carregar(); } catch (e) { setErro(formatApiError(e, "Não foi possível concluir a ação.")); }
  };
  const documento = async (id: string) => {
    try {
      const url = URL.createObjectURL(await academiaService.downloadDocumentoSolicitacaoServicoExtraAcademia(id));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setErro(formatApiError(e, "Não foi possível abrir o documento.")); }
  };
  const verPendencias = (id: string) => agir(async () => { const r = await academiaService.pendenciasServicoExtraAcademia(id); setPendencias((p) => ({ ...p, [id]: r.pendencias })); });

  const atividadeDe = (x: SolicitacaoServicoExtra) => servicos?.atividades.find((a) => a.id === x.servico_extra_id);
  const descricao = (x: SolicitacaoServicoExtra) => {
    if (x.tipo_servico === "transporte") {
      const rota = servicos?.transporte.rotas.find((r) => r.id === x.rota_id);
      const veic = rota?.veiculos.filter((v) => x.veiculo_ids.includes(v.id)).map((v) => v.nome).join(", ");
      return { nome: `Transporte${rota ? ` — ${rota.nome}` : ""}`, detalhe: [rota ? `Embarque às ${rota.horario_embarque}` : "", veic ? `Veículos: ${veic}` : ""].filter(Boolean).join(" · ") };
    }
    const a = atividadeDe(x);
    const turma = a?.turmas.find((t) => t.id === x.turma_id)?.nome;
    return { nome: a?.nome ?? "Atividade não encontrada", detalhe: [a ? `${a.coletiva ? "Coletiva" : "Individual"}` : "", turma ? `Turma: ${turma}` : ""].filter(Boolean).join(" · ") };
  };

  const aprovar = (x: SolicitacaoServicoExtra) => {
    const a = atividadeDe(x);
    if (a?.coletiva && !turmas[x.id]) return setErro("Escolha a turma da atividade antes de aprovar.");
    void agir(() => academiaService.aprovarSolicitacaoServicoExtra(x.id, a?.coletiva ? turmas[x.id] : undefined));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Inscrições em Serviços</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Revise inscrições e mensalidades dos estudantes no transporte e nas atividades.</p>
      </div>
      {erro && <Alert variant="error" title="Solicitações" message={erro} />}
      <div className="max-w-sm"><SearchableSelect value={status} options={options} onChange={setStatus} isSearchable={false} /></div>
      {loading ? <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p> : items.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-6 text-gray-500 dark:border-gray-700 dark:text-gray-400">Nenhuma solicitação encontrada.</p>
      ) : items.map((x) => {
        const d = descricao(x);
        const a = atividadeDe(x);
        const ps = pendencias[x.id];
        return (
          <article key={x.id} className="space-y-3 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white/90">{d.nome}</h2>
                {d.detalhe && <p className="text-sm text-gray-600 dark:text-gray-300">{d.detalhe}</p>}
                <p className="text-sm text-gray-500 dark:text-gray-400">Estudante: {x.codigo_estudante}</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{labels[x.status]}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Solicitada em {new Date(x.created_at).toLocaleString("pt-PT")}</p>
            {x.documento_path && <Button size="sm" variant="outline" onClick={() => documento(x.id)}>Ver documento anexado</Button>}
            {x.status === "pendente" && (
              <div className="space-y-2">
                {a?.coletiva && (
                  <div className="max-w-sm space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Turma da atividade</p>
                    <SearchableSelect value={turmas[x.id] ?? ""} onChange={(v) => setTurmas((p) => ({ ...p, [x.id]: v }))} isSearchable={false} isClearable={false}
                      options={[{ value: "", label: "Escolha a turma" }, ...a.turmas.filter((t) => t.ativo).map((t) => ({ value: t.id, label: t.nome }))]} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => aprovar(x)}>Aprovar</Button>
                  <Input value={motivos[x.id] ?? ""} onChange={(e) => setMotivos((p) => ({ ...p, [x.id]: e.target.value }))} placeholder="Motivo da reprovação" />
                  <Button size="sm" variant="outline" onClick={() => { if (!motivos[x.id]?.trim()) return setErro("Informe o motivo da reprovação."); void agir(() => academiaService.reprovarSolicitacaoServicoExtra(x.id, motivos[x.id])); }}>Reprovar</Button>
                </div>
              </div>
            )}
            {x.status === "aprovada_pendente_pagamento_taxa_inscricao" && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">Taxa pendente: {formatarKz(x.valor_taxa_inscricao)}</span>
                <Button size="sm" variant="outline" onClick={() => agir(() => academiaService.cancelarInscricaoServicoExtraAcademia(x.id, undefined))}>Cancelar solicitação</Button>
              </div>
            )}
            {x.status === "vinculada" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => agir(() => academiaService.cancelarInscricaoServicoExtraAcademia(x.id, undefined))}>Cancelar inscrição</Button>
                  <Button size="sm" variant="outline" onClick={() => verPendencias(x.id)}>Ver mensalidades</Button>
                </div>
                {ps && ps.length === 0 && <p className="text-sm text-gray-600 dark:text-gray-300">Nenhuma mensalidade a pagar por enquanto.</p>}
                {ps && ps.length > 0 && (
                  <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    {ps.map((p, i) => (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm" key={i}>
                        <span className="text-gray-700 dark:text-gray-300">Mensalidade de {p.mes ? MESES[p.mes - 1] : ""}{p.ano ? ` de ${p.ano}` : ""} · {formatarKz(p.valor)} · {p.estado}</span>
                        {p.estado === "pendente" && <Button size="sm" variant="outline" onClick={() => agir(() => financeiroService.anularObrigacaoServicoExtra({ solicitacao_id: x.id, tipo_lancamento: p.tipo_lancamento, ano: p.ano, mes: p.mes }))}>Anular</Button>}
                        {p.estado === "anulada" && <Button size="sm" variant="outline" onClick={() => agir(() => financeiroService.reativarObrigacaoServicoExtra({ solicitacao_id: x.id, tipo_lancamento: p.tipo_lancamento, ano: p.ano, mes: p.mes }))}>Reativar</Button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {["reprovada", "cancelada", "cancelada_antes_da_vinculacao"].includes(x.status) && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Motivo: {x.motivo_reprovacao || x.motivo_cancelamento || "Não informado"}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

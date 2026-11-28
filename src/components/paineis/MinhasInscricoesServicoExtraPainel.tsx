"use client";
import { useEffect, useState } from "react";
import { estudanteService, financeiroService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserCookie } from "@/hooks/useUserCookie";
import type { CatalogoServicos, MetodoPagamentoServico, PendenciaServicoExtra, SolicitacaoServicoExtra } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ServicoExtraPagamento from "@/components/paineis/ServicoExtraPagamento";
import { MESES, formatarKz } from "@/components/paineis/ServicosShared";

const STATUS: Record<string, string> = {
  pendente: "Aguardando aprovação", aprovada_pendente_pagamento_taxa_inscricao: "Aguardando pagamento da taxa", vinculada: "Inscrição ativa",
  reprovada: "Reprovada", cancelada: "Cancelada", cancelada_antes_da_vinculacao: "Cancelada",
};

/** /servicos-extras/minhas-inscricoes — inscrições do estudante em Transporte e atividades (Parte 7). */
export default function MinhasInscricoesServicoExtraPainel() {
  const { loading } = useUserCookie();
  const [items, setItems] = useState<SolicitacaoServicoExtra[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoServicos | null>(null);
  const [pend, setPend] = useState<Record<string, PendenciaServicoExtra[]>>({});
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setItems((await estudanteService.listarMinhasInscricoesServicoExtra()).inscricoes);
      // Só dá os nomes e os métodos de pagamento: se falhar, a lista continua útil.
      estudanteService.listarCatalogoServicosExtras().then(setCatalogo).catch(() => setCatalogo(null));
    } catch (e) {
      setErro(formatApiError(e, "Não foi possível carregar suas inscrições."));
    }
  };
  useEffect(() => { if (!loading) void Promise.resolve().then(carregar); }, [loading]);

  const cancelar = (id: string) => {
    if (window.confirm("Deseja cancelar esta inscrição?")) estudanteService.cancelarMinhaInscricaoServicoExtra(id, undefined).then(carregar).catch((e) => setErro(formatApiError(e, "Não foi possível cancelar.")));
  };
  const doc = async (id: string) => {
    try { window.open(URL.createObjectURL(await estudanteService.downloadMeuDocumentoServicoExtra(id)), "_blank", "noopener"); }
    catch (e) { setErro(formatApiError(e, "Não foi possível abrir o documento.")); }
  };

  const titulo = (i: SolicitacaoServicoExtra) => {
    if (i.tipo_servico === "transporte") {
      const rota = catalogo?.transporte?.rotas.find((r) => r.id === i.rota_id);
      const veiculos = rota?.veiculos.filter((v) => i.veiculo_ids.includes(v.id)).map((v) => v.nome);
      return { nome: rota ? `Transporte — ${rota.nome}` : "Transporte", detalhe: veiculos?.length ? `Veículos: ${veiculos.join(", ")}` : undefined };
    }
    return { nome: catalogo?.atividades.find((a) => a.id === i.servico_extra_id)?.nome ?? "Atividade extracurricular", detalhe: undefined };
  };
  // Métodos já filtrados pelo provedor ativo; vêm do catálogo do serviço.
  const metodosDaMensalidade = (i: SolicitacaoServicoExtra): { metodos: MetodoPagamentoServico[]; aviso?: Parameters<typeof ServicoExtraPagamento>[0]["aviso"] } => {
    const s = i.tipo_servico === "transporte" ? catalogo?.transporte : catalogo?.atividades.find((a) => a.id === i.servico_extra_id);
    return { metodos: s?.metodos_pagamento ?? [], aviso: s?.metodos_pagamento_aviso };
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Minhas Inscrições em Serviços</h1>
      {erro && <Alert title="Inscrições" variant="error" message={erro} />}
      <div className="space-y-4">
        {items.map((i) => {
          const t = titulo(i);
          const m = metodosDaMensalidade(i);
          return (
            <article key={i.id} className="space-y-3 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white/90">{t.nome}</h2>
                {t.detalhe && <p className="text-sm text-gray-600 dark:text-gray-300">{t.detalhe}</p>}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Situação: <b>{STATUS[i.status] ?? i.status}</b></p>
              {i.documento_path && <Button size="sm" variant="outline" onClick={() => doc(i.id)}>Ver documento enviado</Button>}
              {i.status === "pendente" && (
                <Button size="sm" variant="outline" onClick={() => cancelar(i.id)}>Cancelar solicitação</Button>
              )}
              {i.status === "aprovada_pendente_pagamento_taxa_inscricao" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">Taxa de inscrição: {formatarKz(i.valor_taxa_inscricao)}</p>
                  <ServicoExtraPagamento metodos={i.metodos_pagamento_taxa_inscricao} aviso={i.metodos_pagamento_taxa_inscricao_aviso} onPagar={(metodo, telefone) => financeiroService.iniciarPagamentoTaxaInscricaoServicoExtra({ solicitacao_id: i.id, metodo_pagamento: metodo, telefone })} />
                  <Button size="sm" variant="outline" onClick={() => cancelar(i.id)}>Cancelar solicitação</Button>
                </div>
              )}
              {i.status === "vinculada" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={async () => { try { const r = await estudanteService.minhasPendenciasServicoExtra(i.id); setPend((p) => ({ ...p, [i.id]: r.pendencias })); } catch (e) { setErro(formatApiError(e, "Não foi possível carregar as pendências.")); } }}>Ver mensalidades</Button>
                    <Button size="sm" variant="outline" onClick={() => cancelar(i.id)}>Cancelar minha inscrição</Button>
                  </div>
                  {pend[i.id] && pend[i.id].length === 0 && <p className="text-sm text-gray-600 dark:text-gray-300">Nenhuma mensalidade a pagar por enquanto.</p>}
                  {pend[i.id]?.map((p, n) => (
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800" key={n}>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Mensalidade de {p.mes ? MESES[p.mes - 1] : ""}{p.ano ? ` de ${p.ano}` : ""} · {formatarKz(p.valor)} · {p.estado}</p>
                      {p.estado === "pendente" && (
                        <ServicoExtraPagamento metodos={m.metodos} aviso={m.aviso} onPagar={(metodo, telefone) => financeiroService.iniciarPagamentoObrigacaoServicoExtra({ solicitacao_id: i.id, tipo_lancamento: p.tipo_lancamento, ano: p.ano, mes: p.mes, metodo_pagamento: metodo, telefone })} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {i.status === "reprovada" && <p className="text-sm text-gray-600 dark:text-gray-300">Motivo: {i.motivo_reprovacao}</p>}
              {["cancelada", "cancelada_antes_da_vinculacao"].includes(i.status) && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Motivo: {i.motivo_cancelamento || "Não informado"}. Cancelada por: {i.cancelada_por || "Não informado"}.</p>
              )}
            </article>
          );
        })}
        {!items.length && <p className="rounded-xl border border-gray-200 p-6 text-gray-500 dark:border-gray-700 dark:text-gray-400">Nenhuma inscrição encontrada.</p>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { academiaService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import Alert from "@/components/ui/alert/Alert";
import { EmptyState, LoadingState, SubtelaPanel, SubtelasMenu, formatAnoLetivo } from "@/components/paineis/financeiroShared";
import {
  AvisoCredenciaisPagamentos, PagamentosAcessoGuard, PagamentosCobrancasSubtela,
  mesesDoAnoLetivo, usePagamentosAcesso,
} from "@/components/paineis/PagamentosShared";
import type { MesDoAnoLetivo } from "@/components/paineis/PagamentosShared";

type Tela = "ano" | "mes" | "lista";

/**
 * /financas/pagamentos/mensalidades (Tarefa 13) — antes era o card
 * "Mensalidade / Propina" de /financas/pagamentos, que abria este mesmo
 * fluxo (ano letivo → mês → lista) como uma subtela dentro daquele
 * componente. O fluxo em si (drill-down por ano letivo e mês antes da
 * listagem — sem um mês selecionado o backend não computa pendências, para
 * evitar varrer a academia inteira sem limite) não mudou nada; só passou a
 * viver na sua própria rota.
 */
export default function PagamentosMensalidadesPainel() {
  const { loading, isAcademia, isFpp, codigoAcademia, bloqueado } = usePagamentosAcesso();
  const [tela, setTela] = useState<Tela>("ano");
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState<string | null>(null);
  const [tipoAnoLetivoSelecionado, setTipoAnoLetivoSelecionado] = useState<"escolar" | "superior" | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<MesDoAnoLetivo | null>(null);

  const [anosLetivos, setAnosLetivos] = useState<{ ano_letivo: string; tipo: "escolar" | "superior" }[]>([]);
  // Começa true (em vez de setado via effect) para nunca piscar "sem anos
  // letivos" por um instante antes do efeito abaixo rodar.
  const [anosLetivosCarregando, setAnosLetivosCarregando] = useState(true);
  const [anosLetivosErro, setAnosLetivosErro] = useState<string | null>(null);

  // Anos letivos que a academia já teve — mesma fonte já usada em
  // /financas/configuracoes/mensalidade/inicio-cobranca.
  useEffect(() => {
    if (!codigoAcademia) return;
    academiaService
      .listarAnosLetivosLista({ codigo_academia: codigoAcademia })
      .then((r) => {
        const lista = (r?.anos_letivos_lista ?? [])
          .map((a) => ({ ano_letivo: a.ano_letivo, tipo: (a.tipo ?? a.type) as "escolar" | "superior" | undefined }))
          .filter((a): a is { ano_letivo: string; tipo: "escolar" | "superior" } => !!a.ano_letivo && (a.tipo === "escolar" || a.tipo === "superior"))
          .sort((a, b) => b.ano_letivo.localeCompare(a.ano_letivo));
        setAnosLetivos(lista);
        setAnosLetivosErro(null);
      })
      .catch((e) => setAnosLetivosErro(formatApiError(e, "Não foi possível carregar os anos letivos.")))
      .finally(() => setAnosLetivosCarregando(false));
  }, [codigoAcademia]);

  const selecionarAnoLetivo = (anoLetivo: string, tipo: "escolar" | "superior") => {
    setAnoLetivoSelecionado(anoLetivo);
    setTipoAnoLetivoSelecionado(tipo);
    setTela("mes");
  };

  const selecionarMes = (m: MesDoAnoLetivo) => {
    setMesSelecionado(m);
    setTela("lista");
  };

  return (
    <PagamentosAcessoGuard loading={loading} isAcademia={isAcademia} isFpp={isFpp}>
      {bloqueado ? (
        <SubtelaPanel title="Mensalidades" icon="mdi:calendar-month-outline" onVoltar="/financas/pagamentos">
          <AvisoCredenciaisPagamentos />
        </SubtelaPanel>
      ) : tela === "ano" ? (
        <SubtelaPanel title="Mensalidades — selecione o ano letivo" icon="mdi:calendar-month-outline" onVoltar="/financas/pagamentos">
          {anosLetivosCarregando ? (
            <LoadingState label="Carregando anos letivos..." />
          ) : anosLetivosErro ? (
            <Alert variant="error" title="Finanças" message={anosLetivosErro} />
          ) : anosLetivos.length === 0 ? (
            <EmptyState title="Nenhum ano letivo encontrado." description="Esta academia ainda não teve nenhum ano letivo definido." />
          ) : (
            <SubtelasMenu
              opcoes={anosLetivos.map((a) => ({
                id: a.ano_letivo,
                icon: "mdi:calendar-blank-outline",
                label: formatAnoLetivo(a.ano_letivo),
                descricao: a.tipo === "superior" ? "Ano letivo de ensino superior" : "Ano letivo escolar",
                onClick: () => selecionarAnoLetivo(a.ano_letivo, a.tipo),
              }))}
            />
          )}
        </SubtelaPanel>
      ) : tela === "mes" && anoLetivoSelecionado && tipoAnoLetivoSelecionado ? (
        <SubtelaPanel title={`Mensalidades — ${formatAnoLetivo(anoLetivoSelecionado)} — selecione o mês`} icon="mdi:calendar-month-outline" onVoltar={() => setTela("ano")}>
          <SubtelasMenu
            opcoes={mesesDoAnoLetivo(anoLetivoSelecionado, tipoAnoLetivoSelecionado).map((m) => ({
              id: `${m.ano}-${m.mes}`,
              icon: "mdi:calendar-today-outline",
              label: m.label,
              descricao: "Ver cobranças e pendências deste mês.",
              onClick: () => selecionarMes(m),
            }))}
          />
        </SubtelaPanel>
      ) : anoLetivoSelecionado && mesSelecionado ? (
        <PagamentosCobrancasSubtela
          origem="mensalidade"
          titulo={`Mensalidades — ${mesSelecionado.label}`}
          icon="mdi:calendar-month-outline"
          onVoltar={() => setTela("mes")}
          codigoAcademia={codigoAcademia}
          anoLetivo={anoLetivoSelecionado}
          mes={mesSelecionado.mes}
        />
      ) : null}
    </PagamentosAcessoGuard>
  );
}

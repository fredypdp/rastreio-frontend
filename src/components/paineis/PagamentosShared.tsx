"use client";

/**
 * Peças compartilhadas pelas duas páginas de /financas/pagamentos
 * (Tarefa 13 — antes eram dois cards que abriam subtelas dentro de
 * FinanceiroPagamentosPainel; agora `/financas/pagamentos/mensalidades` e
 * `/financas/pagamentos/taxas-matricula` são páginas próprias, mesmo padrão
 * de navegação por rota já usado em /financas/configuracoes desde a
 * Tarefa 9). O visual de cada peça abaixo é idêntico ao que já existia em
 * FinanceiroPagamentosPainel.tsx antes desta tarefa — só a divisão em
 * arquivos/rotas mudou.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserType } from "@/hooks/useRoutePermission";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import Alert from "@/components/ui/alert/Alert";
import Icon from "@/components/ui/Icon";
import SearchableSelect from "@/components/form/SearchableSelect";
import {
  CobrancasTable, EmptyState, ESTADO_PAGAMENTO_OPCOES, LoadingState, NOME_MES,
  PaginacaoSetas, SubtelaDetalheCobranca, SubtelaPanel, capitalizar,
} from "@/components/paineis/financeiroShared";
import type { FinanceiroOrigemCobranca, PagamentoResumo } from "@/types/api";

export const PAGE_SIZE = 30;
export const ESTADO_OPCOES = [{ value: "", label: "Todos os estados" }, ...ESTADO_PAGAMENTO_OPCOES];

export type MesDoAnoLetivo = { mes: number; ano: number; label: string };

/**
 * Meses fixos do sistema de um ano letivo, dado o tipo da academia
 * (escolar ou superior) — mesma regra de mesesAnoLetivo() no backend
 * (internal/finance/mensalidade.go) e de periodoLetivoEscolar/
 * periodoLetivoSuperior (internal/handlers/ano_letivo_helpers.go):
 * escolar começa em setembro, superior em outubro; os dois terminam em
 * julho.
 */
export function mesesDoAnoLetivo(anoLetivo: string, tipo: "escolar" | "superior"): MesDoAnoLetivo[] {
  const anoInicio = Number(anoLetivo.slice(0, 4));
  const anoFim = anoInicio + 1;
  const mesInicio = tipo === "superior" ? 10 : 9;
  const meses: MesDoAnoLetivo[] = [];
  for (let m = mesInicio; m <= 12; m++) meses.push({ mes: m, ano: anoInicio, label: `${capitalizar(NOME_MES[m - 1])} de ${anoInicio}` });
  for (let m = 1; m <= 7; m++) meses.push({ mes: m, ano: anoFim, label: `${capitalizar(NOME_MES[m - 1])} de ${anoFim}` });
  return meses;
}

/**
 * A listagem final ("lista", no antigo estado local de
 * FinanceiroPagamentosPainel) — filtro de estado, tabela (ou vazio/
 * carregando), paginação, e a subtela de detalhe quando um pagamento é
 * aberto. Reaproveitada por PagamentosMensalidadesPainel (com `anoLetivo` +
 * `mes`) e por PagamentosTaxasMatriculaPainel (sem os dois, matrícula não
 * tem o conceito de "mês do ano letivo").
 */
export function PagamentosCobrancasSubtela({
  origem, titulo, icon, onVoltar, codigoAcademia, anoLetivo, mes,
}: {
  origem: FinanceiroOrigemCobranca;
  titulo: string;
  icon: string;
  onVoltar: string | (() => void);
  codigoAcademia: string;
  anoLetivo?: string;
  mes?: number;
}) {
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [alert, setAlert] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<PagamentoResumo | null>(null);
  const list = useApi(financeiroService.listarCobrancas);
  const cancelApi = useApi(financeiroService.cancelarCobranca);

  const parametros = useMemo(
    () => ({
      contexto_tipo: "academia" as const,
      codigo_academia: codigoAcademia || undefined,
      limit: PAGE_SIZE,
      offset: (pagina - 1) * PAGE_SIZE,
      tipo: [origem],
      estado: estado ? [estado] : undefined,
      ano_letivo: anoLetivo,
      mes,
    }),
    [codigoAcademia, origem, estado, pagina, anoLetivo, mes]
  );

  const carregar = useCallback(() => {
    if (!codigoAcademia) return Promise.resolve();
    return list.execute(parametros).catch((e) => setAlert(formatApiError(e, "Não foi possível carregar as cobranças.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoAcademia, parametros]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (selecionada) {
    return <SubtelaDetalheCobranca cobranca={selecionada} onVoltar={() => setSelecionada(null)} mostrarDadosEstudante />;
  }

  const totalGeral = list.data?.total_geral ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalGeral / PAGE_SIZE));
  const pagamentos = list.data?.pagamentos ?? [];

  return (
    <SubtelaPanel title={titulo} icon={icon} onVoltar={onVoltar}>
      {alert && <Alert variant="error" title="Finanças" message={alert} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <SearchableSelect
          value={estado}
          options={ESTADO_OPCOES}
          onChange={(v) => {
            setEstado(v);
            setPagina(1);
          }}
          placeholder="Estado do pagamento"
          isSearchable={false}
          isClearable={false}
          inputId="pagamentos-estado"
          name="pagamentos-estado"
        />
      </div>

      <div className="mt-4">
        {list.loading ? (
          <LoadingState label="Carregando pagamentos..." />
        ) : pagamentos.length > 0 ? (
          <CobrancasTable
            rows={pagamentos}
            onOpen={setSelecionada}
            onCancelar={async (pagamento, motivo) => {
              await cancelApi.execute(pagamento.id, motivo);
              await carregar();
            }}
          />
        ) : (
          <EmptyState title="Nenhum pagamento encontrado." description="Ajuste os filtros ou aguarde novas cobranças serem criadas." />
        )}
      </div>

      <div className="mt-4">
        <PaginacaoSetas paginaAtual={pagina} totalPaginas={totalPaginas} total={totalGeral} porPagina={PAGE_SIZE} onChange={setPagina} />
      </div>
    </SubtelaPanel>
  );
}

/**
 * Estado de acesso compartilhado pelas 3 páginas de /financas/pagamentos
 * (menu + as duas listagens): quem está logado, se é academia/admin FPP, o
 * código da academia, e se o Gateway de Pagamento Online já foi
 * configurado (bloqueia a navegação enquanto não estiver).
 */
export function usePagamentosAcesso() {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";
  const [codigoAcademia, setCodigoAcademia] = useState(user?.academia?.codigo_academia ?? "");
  const credenciaisApi = useApi(financeiroService.listarCredenciais);

  useEffect(() => {
    if (user?.academia?.codigo_academia) setCodigoAcademia(user.academia.codigo_academia);
  }, [user?.academia?.codigo_academia]);

  useEffect(() => {
    if (!isAcademia || !codigoAcademia) return;
    void credenciaisApi.execute({ contexto_tipo: "academia", codigo_academia: codigoAcademia });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAcademia, codigoAcademia]);

  const temCredenciais = (credenciaisApi.data?.length ?? 0) > 0;
  const bloqueado = credenciaisApi.loading || !temCredenciais;

  return { user, isAdmin, isAcademia, isFpp, loading, codigoAcademia, bloqueado };
}

/** Aviso + atalho para aderir ao Gateway de Pagamento Online — mesmo texto/visual que já existia embutido em FinanceiroPagamentosPainel antes da Tarefa 13. */
export function AvisoCredenciaisPagamentos() {
  return (
    <div className="space-y-3">
      <Alert variant="warning" title="Adesão ao Gateway de Pagamento Online" message="A sua instituição precisa aderir ao Gateway de Pagamento Online." />
      <Link href="/financas/credenciais" className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600">
        Siga as instruções aqui <Icon icon="mdi:arrow-right" width={16} />
      </Link>
    </div>
  );
}

/** Guarda de acesso comum às 3 páginas de /financas/pagamentos — mesmas 3 checagens (carregando → sem permissão → FPP indisponível) que já existiam dentro de FinanceiroPagamentosPainel antes da Tarefa 13. */
export function PagamentosAcessoGuard({ loading, isAcademia, isFpp, children }: { loading: boolean; isAcademia: boolean; isFpp: boolean; children: React.ReactNode }) {
  if (loading) return <LoadingState label="Carregando pagamentos..." />;
  if (!isAcademia && !isFpp) {
    return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} message="O módulo financeiro é exclusivo de administradores com papel FPP e de academias." />;
  }
  if (isFpp) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:credit-card-multiple-outline" width={24} className="text-gray-800 dark:text-white/90" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Pagamentos</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ainda não existe um tipo de cobrança específico para o Spuri — indisponível no momento.
            </p>
          </div>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}

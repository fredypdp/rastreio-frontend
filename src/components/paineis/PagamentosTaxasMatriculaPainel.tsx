"use client";

import { SubtelaPanel } from "@/components/paineis/financeiroShared";
import { AvisoCredenciaisPagamentos, PagamentosAcessoGuard, PagamentosCobrancasSubtela, usePagamentosAcesso } from "@/components/paineis/PagamentosShared";

/**
 * /financas/pagamentos/taxas-matricula (Tarefa 13) — antes era o card
 * "Taxa de matrícula" de /financas/pagamentos. Diferente de mensalidade,
 * vai direto para a listagem — uma cobrança de matrícula não tem o
 * conceito de "mês do ano letivo", então não há nenhum drill-down antes.
 */
export default function PagamentosTaxasMatriculaPainel() {
  const { loading, isAcademia, isFpp, codigoAcademia, bloqueado } = usePagamentosAcesso();

  return (
    <PagamentosAcessoGuard loading={loading} isAcademia={isAcademia} isFpp={isFpp}>
      {bloqueado ? (
        <SubtelaPanel title="Taxas de matrícula" icon="mdi:school-outline" onVoltar="/financas/pagamentos">
          <AvisoCredenciaisPagamentos />
        </SubtelaPanel>
      ) : (
        <PagamentosCobrancasSubtela
          origem="matricula"
          titulo="Taxas de matrícula"
          icon="mdi:school-outline"
          onVoltar="/financas/pagamentos"
          codigoAcademia={codigoAcademia}
        />
      )}
    </PagamentosAcessoGuard>
  );
}

"use client";

import Icon from "@/components/ui/Icon";
import { SubtelasMenu } from "@/components/paineis/financeiroShared";
import { AvisoCredenciaisPagamentos, PagamentosAcessoGuard, usePagamentosAcesso } from "@/components/paineis/PagamentosShared";

/**
 * /financas/pagamentos (Tarefa 13). Antes os cards abriam subtelas dentro
 * deste mesmo componente, com um estado local (`tela`) controlando o
 * drill-down. Agora o card de mensalidades navega para a página própria
 * /financas/pagamentos/mensalidades (a taxa de matrícula foi removida
 * na Parte 1 do plano de atualizações) — mesmo padrão de
 * navegação por rota já usado em /financas/configuracoes desde a
 * Tarefa 9; o visual não mudou em nada, só a navegação passou de estado
 * local para rota de verdade.
 *
 * O card "Outros" (cobranças avulsas) já não existia antes desta tarefa —
 * avulsa não é mais um tipo consultável por aqui.
 */
export default function FinanceiroPagamentosPainel() {
  const { loading, isAcademia, isFpp, bloqueado } = usePagamentosAcesso();

  return (
    <PagamentosAcessoGuard loading={loading} isAcademia={isAcademia} isFpp={isFpp}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="mb-4 flex items-start gap-3">
            <Icon icon="mdi:credit-card-multiple-outline" width={24} className="text-gray-800 dark:text-white/90" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Pagamentos</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Escolha o tipo de cobrança para consultar.</p>
            </div>
          </div>
          <SubtelasMenu
            opcoes={[
              { id: "mensalidade", icon: "mdi:calendar-month-outline", label: "Mensalidades", descricao: "Consultar por ano letivo e mês.", href: "/financas/pagamentos/mensalidades", disabled: bloqueado },
            ]}
          />
          {bloqueado && <AvisoCredenciaisPagamentos />}
        </section>
      </div>
    </PagamentosAcessoGuard>
  );
}

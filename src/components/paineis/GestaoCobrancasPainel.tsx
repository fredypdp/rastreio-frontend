"use client";

import { useUserType } from "@/hooks/useRoutePermission";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import { LoadingState, SubtelasMenu } from "@/components/paineis/financeiroShared";
import { ManualDeFuncionamento } from "@/components/paineis/financeiroNivelShared";

/**
 * /financas/gestao-cobrancas (Tarefa 11). Antes tinha um único card ("Anular
 * ou reativar obrigações") que abria uma subtela com as duas ações juntas.
 * Agora são 3 cards, cada um navegando para a sua própria página (mesmo
 * padrão já usado em /financas/configuracoes desde a Tarefa 9) — nenhuma
 * dessas páginas aparece na barra lateral, só são alcançáveis por aqui.
 */
export default function GestaoCobrancasPainel() {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";

  if (loading) return <LoadingState label="Carregando gestão de cobranças..." />;
  if (!isAcademia && !isFpp) return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} message="A gestão de cobranças é exclusiva de administradores FPP e academias." />;
  if (isFpp) return <UnauthorizedAccess requiredTypes={["Academia"]} message="A gestão de cobranças pertence a cada academia — indisponível para o administrador FPP." />;

  return (
    <div className="space-y-6">
      <ManualDeFuncionamento>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
          <li>Aqui você atua sobre <b>cobranças pontuais</b> de um estudante específico — diferente das configurações de valor em Finanças &gt; Configurações, que valem para todos.</li>
          <li><b>Anular obrigação</b> torna uma mensalidade sem efeito (ex.: bolsa concedida, erro de lançamento) — o estudante deixa de precisar pagá-la, mesmo que nenhuma cobrança real tenha sido gerada ainda.</li>
          <li><b>Reativar obrigação</b> volta uma obrigação anulada a valer novamente.</li>
          <li><b>Cancelar cobrança</b> cancela uma cobrança já gerada/tentada junto à AppyPay (referência, QR code, etc.) — use quando já existe uma tentativa de pagamento em aberto que não deve mais valer.</li>
        </ul>
      </ManualDeFuncionamento>
      <SubtelasMenu
        opcoes={[
          { id: "anular-mensalidade", icon: "mdi:close-circle-outline", label: "Anular obrigação", descricao: "Anular uma mensalidade pontual de um estudante específico.", href: "/financas/gestao-cobrancas/anular-mensalidade" },
          { id: "reativar-mensalidade", icon: "mdi:reload", label: "Reativar obrigação", descricao: "Reativar uma obrigação de mensalidade anulada anteriormente.", href: "/financas/gestao-cobrancas/reativar-mensalidade" },
          { id: "cancelar-cobranca", icon: "mdi:receipt-text-remove-outline", label: "Cancelar cobrança", descricao: "Cancelar uma cobrança já gerada de um estudante específico.", href: "/financas/gestao-cobrancas/cancelar-cobranca" },
        ]}
      />
    </div>
  );
}

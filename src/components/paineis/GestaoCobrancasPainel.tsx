"use client";

import { useState } from "react";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import { useUserType } from "@/hooks/useRoutePermission";
import AnularReativarObrigacoesForm from "@/components/paineis/AnularReativarObrigacoesForm";
import { LoadingState, SubtelaPanel, SubtelasMenu } from "@/components/paineis/financeiroShared";
import { ManualDeFuncionamento } from "@/components/paineis/financeiroNivelShared";

/**
 * /financas/gestao-cobrancas (Tarefa 11). Página nova — "Anular ou reativar
 * obrigações" saiu de dentro de /financas/configuracoes e passou a ser uma
 * subtela desta página, separada das configurações de valores (propina e
 * taxa de matrícula são "quanto cobrar"; isto aqui é "o que fazer com uma
 * cobrança pontual já gerada").
 */
export default function GestaoCobrancasPainel() {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";
  const codigoAcademia = user?.academia?.codigo_academia ?? "";
  const [subtela, setSubtela] = useState<"menu" | "anular-reativar">("menu");

  if (loading) return <LoadingState label="Carregando gestão de cobranças..." />;
  if (!isAcademia && !isFpp) return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} message="A gestão de cobranças é exclusiva de administradores FPP e academias." />;
  if (isFpp) return <UnauthorizedAccess requiredTypes={["Academia"]} message="A gestão de cobranças pertence a cada academia — indisponível para o administrador FPP." />;

  if (subtela === "anular-reativar") {
    return (
      <SubtelaPanel title="Anular ou reativar obrigações" icon="mdi:receipt-text-remove-outline" onVoltar={() => setSubtela("menu")}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Anule ou reative mensalidades pontuais de um estudante específico (ex.: bolsa concedida, erro de lançamento).</p>
        <div className="mt-4">
          <AnularReativarObrigacoesForm codigoAcademia={codigoAcademia} />
        </div>
      </SubtelaPanel>
    );
  }

  return (
    <div className="space-y-6">
      <ManualDeFuncionamento>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
          <li>Aqui você atua sobre <b>cobranças pontuais já geradas</b> de um estudante específico — diferente das configurações de valor em Finanças &gt; Configurações, que valem para todos.</li>
          <li><b>Anular</b> uma obrigação a torna sem efeito (ex.: bolsa concedida, erro de lançamento) — o estudante deixa de precisar pagá-la.</li>
          <li><b>Reativar</b> volta uma obrigação anulada a valer novamente.</li>
        </ul>
      </ManualDeFuncionamento>
      <SubtelasMenu
        opcoes={[
          { id: "anular-reativar", icon: "mdi:receipt-text-remove-outline", label: "Anular ou reativar obrigações", descricao: "Anular ou reativar mensalidades pontuais de um estudante específico.", onClick: () => setSubtela("anular-reativar") },
        ]}
      />
    </div>
  );
}

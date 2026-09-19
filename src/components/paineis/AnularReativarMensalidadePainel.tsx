"use client";

import { useUserType } from "@/hooks/useRoutePermission";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import { LoadingState, SubtelaPanel } from "@/components/paineis/financeiroShared";
import AnularReativarObrigacoesForm from "@/components/paineis/AnularReativarObrigacoesForm";

const TITULO: Record<"anular" | "reativar", string> = {
  anular: "Anular obrigação",
  reativar: "Reativar obrigação",
};
const DESCRICAO: Record<"anular" | "reativar", string> = {
  anular: "Anule uma mensalidade pontual de um estudante específico (ex.: bolsa concedida, erro de lançamento) — o estudante deixa de precisar pagá-la.",
  reativar: "Reative uma obrigação de mensalidade anulada anteriormente, voltando a exigir o pagamento normalmente.",
};

/**
 * /financas/gestao-cobrancas/anular-mensalidade e .../reativar-mensalidade
 * (Tarefa 11) — antes as duas ações viviam juntas numa única subtela
 * ("Anular ou reativar obrigações"). Agora cada uma é a sua própria página,
 * alcançável só pelo card correspondente em /financas/gestao-cobrancas —
 * este componente é reaproveitado pelas duas, parametrizado por `acao`.
 */
export default function AnularReativarMensalidadePainel({ acao }: { acao: "anular" | "reativar" }) {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";
  const codigoAcademia = user?.academia?.codigo_academia ?? "";

  if (loading) return <LoadingState label="Carregando..." />;
  if (!isAcademia && !isFpp) return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} message="A gestão de cobranças é exclusiva de administradores FPP e academias." />;
  if (isFpp) return <UnauthorizedAccess requiredTypes={["Academia"]} message="A gestão de cobranças pertence a cada academia — indisponível para o administrador FPP." />;

  return (
    <SubtelaPanel title={TITULO[acao]} icon={acao === "anular" ? "mdi:close-circle-outline" : "mdi:reload"} onVoltar="/financas/gestao-cobrancas">
      <p className="text-sm text-gray-500 dark:text-gray-400">{DESCRICAO[acao]}</p>
      <div className="mt-4">
        <AnularReativarObrigacoesForm acao={acao} codigoAcademia={codigoAcademia} />
      </div>
    </SubtelaPanel>
  );
}

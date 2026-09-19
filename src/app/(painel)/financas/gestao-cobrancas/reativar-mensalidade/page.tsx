import type { Metadata } from "next";
import AnularReativarMensalidadePainel from "@/components/paineis/AnularReativarMensalidadePainel";

export const metadata: Metadata = {
  title: "Finanças - Reativar Obrigação",
  description: "Reativar uma obrigação de mensalidade anulada anteriormente no Spuri.",
};

export default function ReativarMensalidadePage() {
  return <AnularReativarMensalidadePainel acao="reativar" />;
}

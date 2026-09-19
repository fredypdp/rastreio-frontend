import type { Metadata } from "next";
import AnularReativarMensalidadePainel from "@/components/paineis/AnularReativarMensalidadePainel";

export const metadata: Metadata = {
  title: "Finanças - Anular Obrigação",
  description: "Anular uma mensalidade pontual de um estudante no Spuri.",
};

export default function AnularMensalidadePage() {
  return <AnularReativarMensalidadePainel acao="anular" />;
}

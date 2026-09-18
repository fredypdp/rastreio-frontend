import type { Metadata } from "next";
import MensalidadeListaPainel from "@/components/paineis/MensalidadeListaPainel";

export const metadata: Metadata = {
  title: "Finanças - Propina / Mensalidade",
  description: "Configurações de propina e mensalidade da academia no Spuri.",
};

export default function MensalidadePage() {
  return <MensalidadeListaPainel />;
}

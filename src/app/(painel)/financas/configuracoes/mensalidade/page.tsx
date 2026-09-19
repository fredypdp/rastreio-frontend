import type { Metadata } from "next";
import MensalidadeListaPainel from "@/components/paineis/MensalidadeListaPainel";

export const metadata: Metadata = {
  title: "Finanças - Mensalidade",
  description: "Configurações de mensalidade da academia no Spuri.",
};

export default function MensalidadePage() {
  return <MensalidadeListaPainel />;
}

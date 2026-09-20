import type { Metadata } from "next";
import MensalidadeCriarPainel from "@/components/paineis/MensalidadeCriarPainel";

export const metadata: Metadata = {
  title: "Finanças - Definir Nova Mensalidade",
  description: "Definir uma nova configuração de mensalidade no Spuri.",
};

export default function MensalidadeCriarPage() {
  return <MensalidadeCriarPainel />;
}

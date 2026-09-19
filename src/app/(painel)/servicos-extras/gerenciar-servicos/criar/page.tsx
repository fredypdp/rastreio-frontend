import type { Metadata } from "next";
import ServicoExtraFormPainel from "@/components/paineis/ServicoExtraFormPainel";

export const metadata: Metadata = { title: "Novo Serviço Extra" };

export default function Page() {
  return <ServicoExtraFormPainel />;
}

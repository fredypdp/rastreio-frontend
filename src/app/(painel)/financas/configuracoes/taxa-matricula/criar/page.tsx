import type { Metadata } from "next";
import TaxaMatriculaCriarPainel from "@/components/paineis/TaxaMatriculaCriarPainel";

export const metadata: Metadata = {
  title: "Finanças - Definir Nova Taxa",
  description: "Definir uma nova configuração de taxa de matrícula no Spuri.",
};

export default function TaxaMatriculaCriarPage() {
  return <TaxaMatriculaCriarPainel />;
}

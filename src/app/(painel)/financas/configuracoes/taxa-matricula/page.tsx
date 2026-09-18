import type { Metadata } from "next";
import TaxaMatriculaListaPainel from "@/components/paineis/TaxaMatriculaListaPainel";

export const metadata: Metadata = {
  title: "Finanças - Taxa de Matrícula",
  description: "Configurações de taxa de matrícula da academia no Spuri.",
};

export default function TaxaMatriculaPage() {
  return <TaxaMatriculaListaPainel />;
}

import type { Metadata } from "next";
import { Suspense } from "react";
import TaxaMatriculaCriarPainel from "@/components/paineis/TaxaMatriculaCriarPainel";

export const metadata: Metadata = {
  title: "Finanças - Definir Nova Taxa de Matrícula",
  description: "Definir uma nova configuração de taxa de matrícula no Spuri.",
};

export default function TaxaMatriculaCriarPage() {
  return (
    <Suspense fallback={null}>
      <TaxaMatriculaCriarPainel />
    </Suspense>
  );
}

import type { Metadata } from "next";
import PagamentosTaxasMatriculaPainel from "@/components/paineis/PagamentosTaxasMatriculaPainel";

export const metadata: Metadata = {
  title: "Finanças - Pagamentos de Taxas de Matrícula",
  description: "Consulte cobranças de taxa de matrícula no Spuri.",
};

export default function PagamentosTaxasMatriculaPage() {
  return <PagamentosTaxasMatriculaPainel />;
}

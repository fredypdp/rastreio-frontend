import type { Metadata } from "next";
import FinanceiroConfiguracoesRootPainel from "@/components/paineis/FinanceiroConfiguracoesRootPainel";

export const metadata: Metadata = {
  title: "Finanças - Configurações",
  description: "Configure propina, mensalidade e taxa de matrícula da academia no Spuri.",
};

export default function FinanceiroConfiguracoesPage() {
  return <FinanceiroConfiguracoesRootPainel />;
}

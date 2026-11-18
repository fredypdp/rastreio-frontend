import type { Metadata } from "next";
import FinanceiroConfiguracoesRootPainel from "@/components/paineis/FinanceiroConfiguracoesRootPainel";

export const metadata: Metadata = {
  title: "Finanças - Configurações",
  description: "Configure o provedor de pagamento e a mensalidade da academia no Spuri.",
};

export default function FinanceiroConfiguracoesPage() {
  return <FinanceiroConfiguracoesRootPainel />;
}

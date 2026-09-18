import type { Metadata } from "next";
import GestaoCobrancasPainel from "@/components/paineis/GestaoCobrancasPainel";

export const metadata: Metadata = {
  title: "Finanças - Gestão de Cobranças",
  description: "Anular ou reativar obrigações financeiras pontuais de estudantes no Spuri.",
};

export default function GestaoCobrancasPage() {
  return <GestaoCobrancasPainel />;
}

import type { Metadata } from "next";
import CancelarCobrancaPainel from "@/components/paineis/CancelarCobrancaPainel";

export const metadata: Metadata = {
  title: "Finanças - Cancelar Cobrança",
  description: "Cancelar uma cobrança já gerada de um estudante no Spuri.",
};

export default function CancelarCobrancaPage() {
  return <CancelarCobrancaPainel />;
}

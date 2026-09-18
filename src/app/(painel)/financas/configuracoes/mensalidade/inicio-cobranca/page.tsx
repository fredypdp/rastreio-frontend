import type { Metadata } from "next";
import InicioCobrancaPainel from "@/components/paineis/InicioCobrancaPainel";

export const metadata: Metadata = {
  title: "Finanças - Início de Cobrança",
  description: "Ajustar o início de cobrança da mensalidade para o ano letivo atual no Spuri.",
};

export default function InicioCobrancaPage() {
  return <InicioCobrancaPainel />;
}

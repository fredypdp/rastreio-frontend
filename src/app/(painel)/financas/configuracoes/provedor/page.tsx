import type { Metadata } from "next";
import ProvedorPagamentoPainel from "@/components/paineis/ProvedorPagamentoPainel";

export const metadata: Metadata = {
  title: "Finanças - Provedor de pagamento",
  description: "Escolha o provedor de pagamento e configure as credenciais (e o segredo de webhook, quando o provedor o usa) para habilitar cobranças financeiras no Spuri.",
};

export default function ProvedorPagamentoPage() {
  return <ProvedorPagamentoPainel />;
}

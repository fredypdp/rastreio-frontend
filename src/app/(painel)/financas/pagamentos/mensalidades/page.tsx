import type { Metadata } from "next";
import PagamentosMensalidadesPainel from "@/components/paineis/PagamentosMensalidadesPainel";

export const metadata: Metadata = {
  title: "Finanças - Pagamentos de Mensalidades",
  description: "Consulte cobranças e pendências de mensalidade por ano letivo e mês no Spuri.",
};

export default function PagamentosMensalidadesPage() {
  return <PagamentosMensalidadesPainel />;
}

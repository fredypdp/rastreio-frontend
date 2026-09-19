import type { Metadata } from "next";
import ServicoExtraFormPainel from "@/components/paineis/ServicoExtraFormPainel";

export const metadata: Metadata = { title: "Editar Serviço Extra" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServicoExtraFormPainel servicoId={id} />;
}

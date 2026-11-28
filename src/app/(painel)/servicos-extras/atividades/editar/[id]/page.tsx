import type { Metadata } from "next";
import AtividadeFormPainel from "@/components/paineis/AtividadeFormPainel";

export const metadata: Metadata = { title: "Editar atividade" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AtividadeFormPainel atividadeId={id} />;
}

import type { Metadata } from "next";
import CategoriaServicoFormPainel from "@/components/paineis/CategoriaServicoFormPainel";

export const metadata: Metadata = { title: "Editar Categoria de Serviço" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoriaServicoFormPainel categoriaId={id} />;
}

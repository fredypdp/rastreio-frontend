import type { Metadata } from "next";
import CategoriaServicoFormPainel from "@/components/paineis/CategoriaServicoFormPainel";

export const metadata: Metadata = { title: "Nova Categoria de Serviço" };

export default function Page() {
  return <CategoriaServicoFormPainel />;
}

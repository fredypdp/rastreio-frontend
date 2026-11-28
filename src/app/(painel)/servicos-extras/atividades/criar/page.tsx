import type { Metadata } from "next";
import AtividadeFormPainel from "@/components/paineis/AtividadeFormPainel";
export const metadata: Metadata = { title: "Nova atividade" };
export default function Page() { return <AtividadeFormPainel />; }

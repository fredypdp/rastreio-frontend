import type { Metadata } from "next";
import { Suspense } from "react";
import MensalidadeEditarPainel from "@/components/paineis/MensalidadeEditarPainel";

export const metadata: Metadata = {
  title: "Finanças - Editar Mensalidade",
  description: "Editar uma configuração de mensalidade existente no Spuri.",
};

export default function MensalidadeEditarPage() {
  return (
    <Suspense fallback={null}>
      <MensalidadeEditarPainel />
    </Suspense>
  );
}

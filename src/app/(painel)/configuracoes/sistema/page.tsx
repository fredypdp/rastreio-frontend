import React from "react";
import { Metadata } from "next";
import PageContent from "../PageContent";

export const metadata: Metadata = { title: "Configurações do sistema" };

export default function SistemaPage() {
  return <PageContent section="sistema" />;
}

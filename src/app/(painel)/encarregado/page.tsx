import React from "react";
import { Metadata } from "next";
import PageContent from "./PageContent";

export const metadata: Metadata = { title: "Meus educandos" };

export default function EncarregadoPage() {
  return <PageContent />;
}

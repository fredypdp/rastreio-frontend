import type { Metadata } from "next";
import TransportePainel from "@/components/paineis/TransportePainel";
export const metadata: Metadata = { title: "Transporte" };
export default function Page() { return <TransportePainel />; }

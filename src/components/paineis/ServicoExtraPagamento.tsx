"use client";
import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { AvisoMetodosIndisponiveis, MetodoPagamentoSelector, Qr } from "@/components/paineis/financeiroShared";
import type { FinanceiroAvisoMetodos, MetodoPagamentoServico, QRCodeChargeResult } from "@/types/api";
export default function ServicoExtraPagamento({ metodos, aviso, onPagar }: { metodos: MetodoPagamentoServico[]; aviso?: FinanceiroAvisoMetodos | null; onPagar: (m: MetodoPagamentoServico, t?: string) => Promise<{ cobranca: QRCodeChargeResult }> }) {
 const [metodo,setMetodo]=useState<MetodoPagamentoServico>(metodos[0]||"GPO"); const [telefone,setTelefone]=useState(""); const [cobranca,setCobranca]=useState<QRCodeChargeResult|null>(null); const [loading,setLoading]=useState(false); const [erro,setErro]=useState("");
 const pagar=async()=>{if((metodo==="GPO"||metodo==="GPO_QR")&&!telefone){setErro("Informe o telefone para este método de pagamento.");return;}setLoading(true);try{setCobranca((await onPagar(metodo,telefone)).cobranca)}catch(e:any){setErro(e?.message||"Não foi possível iniciar o pagamento.")}finally{setLoading(false)}};
 if(cobranca) return <div className="space-y-2 rounded-lg border p-3"><p>Status: {cobranca.status}</p>{metodo==="GPO"&&<p className="text-sm">Você receberá uma notificação no telefone informado para confirmar o pagamento.</p>}{metodo==="REF"&&<pre className="rounded bg-gray-50 p-2 text-xs dark:bg-gray-800">{JSON.stringify(cobranca.response??{},null,2)}</pre>}{metodo==="GPO_QR"&&<Qr value={cobranca.qrCodeArr}/>}</div>;
 // Nenhum método utilizável (o backend já filtra pelo provedor ativo): explica o motivo em vez de mostrar botões inúteis.
 if((metodos??[]).length===0) return <AvisoMetodosIndisponiveis aviso={aviso}/>;
 return <div className="space-y-3"><MetodoPagamentoSelector value={metodo} disponiveis={metodos} onChange={setMetodo}/>{(metodo==="GPO"||metodo==="GPO_QR")&&<Input value={telefone} onChange={e=>setTelefone(e.target.value)} placeholder="Telefone"/>}{erro&&<p className="text-sm text-red-600">{erro}</p>}<Button size="sm" disabled={loading} onClick={pagar}>Confirmar pagamento</Button></div>;
}

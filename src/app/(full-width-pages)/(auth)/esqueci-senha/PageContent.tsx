"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import React, { useState } from "react";

import { RecuperarSenhaComFrontend } from "@/lib/utils/email"
import Alert from "@/components/ui/alert/Alert";
import Link from "next/link";

export default function EsqueciSenha() {
  const [identificador, setIdentificador] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [EnviandoEmailRecurepacao, setEnviandoEmailRecurepacao] = useState(false);
  const [EmailEnviado, setEmailEnviado] = useState(false);
  const [EmailErro, setEmailErro] = useState(false);
  const [MensagemErro, setMensagemErro] = useState<string>('');
  // SEC-06: a resposta do servidor é sempre a mesma, exista a conta ou não.
  const [MensagemSucesso, setMensagemSucesso] = useState<string>('');

  const validarFormulario = (): boolean => {
    const erros: string[] = [];
    if (!identificador.trim()) {
      erros.push('Usuário é obrigatório');
    }
    setValidationErrors(erros);
    return erros.length === 0;
  };

  return (
    <div className="flex w-full flex-1 flex-col px-4 sm:px-6 lg:w-1/2 lg:px-8">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Recuperar senha</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enviaremos um link para definir uma nova senha</p>
          </div>
          <div>
            <form onSubmit={e => e.preventDefault()}>
              <div className="space-y-6">
                <div>
                  <Label>Usuário</Label>
                  <Input 
                    disabled={EnviandoEmailRecurepacao} 
                    id="identificador" 
                    name="identificador" 
                    placeholder="Código ou e-mail" 
                    type="text"
                    onChange={(e) => setIdentificador(e.target.value)} 
                  />
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                      Corrija os seguintes erros:
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((erro, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-400">
                          {erro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button onClick={async () => {
                    setValidationErrors([]);
                    setMensagemErro('');
                    
                    if (!validarFormulario()) return;

                    setEnviandoEmailRecurepacao(true);
                    setEmailEnviado(false);
                    setEmailErro(false);

                    try {
                      const res = await RecuperarSenhaComFrontend(identificador.trim());
                      setMensagemSucesso(res.message);
                      setEmailEnviado(res.success);
                    } catch (error: unknown) {
                      // Só chegam aqui falhas do serviço (ex.: e-mail indisponível) ou de
                      // rede — nunca "usuário não encontrado" nem "e-mail não verificado".
                      setEmailErro(true);
                      setMensagemErro(error instanceof Error && error.message ? error.message : 'Erro ao processar solicitação');
                    } finally {
                      setEnviandoEmailRecurepacao(false);
                    }
                  }} disabled={EnviandoEmailRecurepacao} className="w-full capitalize" size="sm">
                    {EnviandoEmailRecurepacao ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando e-mail
                      </>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>
                  {EmailEnviado && (
                    <Alert title="Pedido recebido" message={MensagemSucesso || "Se existir uma conta elegível, enviámos as instruções para o e-mail cadastrado."} variant="success" />
                  )}
                  {EmailErro && (
                    <Alert 
                      title="Erro ao enviar e-mail!" 
                      message={MensagemErro || "Tente novamente mais tarde"} 
                      variant="error" 
                    />
                  )}
                </div>
              </div>
            </form>
            <div className="mt-5">
              <p className="text-start text-sm font-normal text-gray-700 dark:text-gray-400">
                <Link href="/login" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Fazer login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useApi, authService, tokenStorage } from "@/lib/api";
import type { AuthResponse } from "@/types/api";
import { exigeDoisFatores, TAMANHO_CODIGO_DOIS_FATORES } from "@/types/dois-fatores";
import type { DoisFatoresDesafio } from "@/types/dois-fatores";
import { useContagemRegressiva } from "@/hooks/useContagemRegressiva";
import CodigoVerificacaoInput from "@/components/auth/CodigoVerificacaoInput";
import { setCookieHours } from "@/lib/utils/cookies";
import { formatApiError, getLoginTokenCookieExpirationHours } from "@/lib/api/client";

export default function LoginForm() {
  const router = useRouter();
  const [showSenha, setShowSenha] = useState(false);
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Segunda etapa (verificação em duas etapas por e-mail)
  const [etapa, setEtapa] = useState<"credenciais" | "codigo">("credenciais");
  const [desafio, setDesafio] = useState<DoisFatoresDesafio | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);
  const [infoCodigo, setInfoCodigo] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const { segundos: segundosParaReenviar, iniciar: iniciarContagemReenvio } = useContagemRegressiva();

  const { loading, error: erroLogin, execute: executeLogin } = useApi(authService.login);

  const validarFormulario = (): boolean => {
    const erros: string[] = [];
    if (!identificador.trim()) erros.push("Usuário é obrigatório");
    if (!senha.trim()) erros.push("Senha é obrigatória");
    setValidationErrors(erros);
    return erros.length === 0;
  };

  // Guarda o token e entra no painel (mesmo caminho do login com e sem 2FA).
  const concluirLogin = (result: AuthResponse) => {
    tokenStorage.setWithType(result.token, result.type);
    if (tokenStorage.isRestrictedFinance()) {
      const userMinimo = {
        tipo: "estudante",
        estudante: {
          codigo_estudante: result.codigo,
          nome: result.nome,
          status: "inativo",
        },
      };
      setCookieHours("user", JSON.stringify(userMinimo), getLoginTokenCookieExpirationHours());
      router.push("/pagamentos");
      return;
    }
    router.push("/painel");
  };

  // Mostra a tela do código para um desafio novo (login ou reenvio).
  const abrirEtapaDoCodigo = (novo: DoisFatoresDesafio, aviso?: string | null) => {
    setDesafio(novo);
    setCodigo("");
    setErroCodigo(null);
    setInfoCodigo(aviso ?? novo.message ?? null);
    iniciarContagemReenvio(novo.reenvio_em_segundos);
    setEtapa("codigo");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!validarFormulario()) return;

    try {
      const result = await executeLogin({
        usuario: identificador.trim(),
        senha,
      });

      if (!result) return;

      // Conta com verificação em duas etapas: nenhum token ainda — pede o código.
      if (exigeDoisFatores(result)) {
        abrirEtapaDoCodigo(result);
        return;
      }

      concluirLogin(result);
    } catch {
      // Erro já tratado pelo useApi e exposto em erroLogin
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desafio || verificando) return;

    if (codigo.length !== TAMANHO_CODIGO_DOIS_FATORES) {
      setErroCodigo(`Digite o código de ${TAMANHO_CODIGO_DOIS_FATORES} dígitos.`);
      return;
    }

    setErroCodigo(null);
    setVerificando(true);
    try {
      const result = await authService.verificarDoisFatores({
        desafio_id: desafio.desafio_id,
        codigo,
      });
      concluirLogin(result);
    } catch (err) {
      setCodigo("");
      setErroCodigo(formatApiError(err, "Não foi possível verificar o código. Tente novamente."));
    } finally {
      setVerificando(false);
    }
  };

  const handleReenviarCodigo = async () => {
    if (!desafio || reenviando || verificando || segundosParaReenviar > 0) return;

    setErroCodigo(null);
    setReenviando(true);
    try {
      const novo = await authService.reenviarDoisFatores({ desafio_id: desafio.desafio_id });
      abrirEtapaDoCodigo(novo, "Enviámos um novo código. O código anterior deixou de valer.");
    } catch (err) {
      setErroCodigo(formatApiError(err, "Não foi possível reenviar o código. Tente novamente."));
    } finally {
      setReenviando(false);
    }
  };

  // Volta para usuário/senha. Limpa tudo: o desafio pendente não é reaproveitado.
  const handleVoltarParaCredenciais = () => {
    setEtapa("credenciais");
    setDesafio(null);
    setCodigo("");
    setErroCodigo(null);
    setInfoCodigo(null);
    setIdentificador("");
    setSenha("");
    setValidationErrors([]);
    iniciarContagemReenvio(0);
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    const target = event.target as HTMLInputElement;

    if (event.key !== "Enter" || target.name !== "identificador") return;

    if (identificador.trim() && senha.trim()) return;

    event.preventDefault();
    const passwordInput = event.currentTarget.elements.namedItem("senha");

    if (passwordInput instanceof HTMLInputElement) {
      passwordInput.focus();
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col px-4 sm:px-6 lg:w-1/2 lg:px-8">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {etapa === "codigo" ? "Verificação em duas etapas" : "Fazer login"}
            </h1>
            {etapa === "codigo" && desafio && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enviámos um código de {TAMANHO_CODIGO_DOIS_FATORES} dígitos para{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">{desafio.email_mascarado}</span>.
                Digite-o abaixo para concluir o acesso. O código vale por{" "}
                {Math.max(1, Math.round(desafio.expira_em_segundos / 60))} minutos.
              </p>
            )}
          </div>

          {etapa === "codigo" && desafio ? (
            <form onSubmit={handleVerificarCodigo} noValidate>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="codigo-dois-fatores">Código de verificação</Label>
                  <CodigoVerificacaoInput
                    id="codigo-dois-fatores"
                    value={codigo}
                    onChange={(valor) => {
                      setCodigo(valor);
                      if (erroCodigo) setErroCodigo(null);
                    }}
                    disabled={verificando}
                    invalido={Boolean(erroCodigo)}
                  />
                </div>

                {infoCodigo && !erroCodigo && (
                  <div className="p-4 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 rounded-lg">
                    <p className="text-sm text-brand-700 dark:text-brand-300">{infoCodigo}</p>
                  </div>
                )}

                {erroCodigo && (
                  <div
                    role="alert"
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <p className="first-letter:uppercase text-sm text-red-700 dark:text-red-400">{erroCodigo}</p>
                  </div>
                )}

                <div>
                  <Button
                    disabled={verificando || reenviando || codigo.length !== TAMANHO_CODIGO_DOIS_FATORES}
                    className="w-full"
                    size="sm"
                  >
                    {verificando ? "Verificando..." : "Verificar e entrar"}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={handleReenviarCodigo}
                    disabled={segundosParaReenviar > 0 || reenviando || verificando}
                    className="text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400 dark:disabled:text-gray-500"
                  >
                    {reenviando
                      ? "Reenviando..."
                      : segundosParaReenviar > 0
                        ? `Reenviar código em ${segundosParaReenviar}s`
                        : "Reenviar código"}
                  </button>
                  <button
                    type="button"
                    onClick={handleVoltarParaCredenciais}
                    disabled={verificando}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-60 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </form>
          ) : (
          <>
          <form onKeyDown={handleFormKeyDown} onSubmit={handleLogin}>
            <div className="space-y-6">
              <div>
                <Label>Usuário</Label>
                <Input
                  disabled={loading}
                  id="identificador"
                  name="identificador"
                  placeholder="Código, e-mail ou telefone"
                  type="text"
                  onChange={(e) => setIdentificador(e.target.value)}
                />
              </div>

              <div>
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    disabled={loading}
                    id="senha"
                    name="senha"
                    type={showSenha ? "text" : "password"}
                    placeholder="Digite a sua senha"
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <span
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showSenha ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((erro, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-400">
                        {erro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {erroLogin && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="first-letter:uppercase text-sm text-red-700 dark:text-red-400">
                    {erroLogin}
                  </p>
                </div>
              )}

              <div>
                <Button disabled={loading} className="w-full" size="sm">
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            <Link href="/matricula" className="inline-flex w-full items-center justify-center rounded-lg border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-500/10">
              Fazer matrícula
            </Link>
            <p className="text-start text-sm font-normal text-gray-700 dark:text-gray-400">
              Esqueceu a senha?{" "}
              <Link
                href="/esqueci-senha"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Clique aqui
              </Link>
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

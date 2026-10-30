"use client";

import React, { useCallback, useEffect, useState } from "react";
import { doisFatoresService } from "@/lib/api/services";
import { formatApiError } from "@/lib/api/client";
import { useContagemRegressiva } from "@/hooks/useContagemRegressiva";
import CodigoVerificacaoInput from "@/components/auth/CodigoVerificacaoInput";
import Icon from "@/components/ui/Icon";
import {
  TAMANHO_CODIGO_DOIS_FATORES,
  type DoisFatoresDesafio,
  type DoisFatoresEstado,
} from "@/types/dois-fatores";

/**
 * Verificação em duas etapas por e-mail (tarefa 32).
 *
 * Ativar: o e-mail precisa estar verificado → pedir código → digitar o código.
 * Desativar: senha atual → pedir código → digitar o código.
 * Com a verificação ativa, cada login pede um código enviado ao e-mail.
 */

type Fase = "inicial" | "ativacao-codigo" | "desativacao-senha" | "desativacao-codigo";

const CLASSE_INPUT =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

const CLASSE_BOTAO_PRIMARIO =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50";

const CLASSE_BOTAO_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

const CLASSE_BOTAO_PERIGO =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20";

function Aviso({ tipo, children }: { tipo: "erro" | "sucesso" | "info"; children: React.ReactNode }) {
  const estilos = {
    erro: {
      caixa: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
      texto: "text-red-600 dark:text-red-400",
      icone: "mdi:alert-circle-outline",
      corIcone: "text-red-500",
    },
    sucesso: {
      caixa: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
      texto: "text-green-700 dark:text-green-400",
      icone: "mdi:check-circle-outline",
      corIcone: "text-green-500",
    },
    info: {
      caixa: "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10",
      texto: "text-brand-700 dark:text-brand-300",
      icone: "mdi:email-outline",
      corIcone: "text-brand-500",
    },
  }[tipo];

  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 ${estilos.caixa}`}
    >
      <Icon icon={estilos.icone} width="18px" className={`mt-0.5 shrink-0 ${estilos.corIcone}`} />
      <p className={`text-sm ${estilos.texto}`}>{children}</p>
    </div>
  );
}

export default function DoisFatoresSettingsCard() {
  const [estado, setEstado] = useState<DoisFatoresEstado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  const [fase, setFase] = useState<Fase>("inicial");
  const [desafio, setDesafio] = useState<DoisFatoresDesafio | null>(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const { segundos: segundosParaReenviar, iniciar: iniciarContagem } = useContagemRegressiva();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregar(null);
    try {
      setEstado(await doisFatoresService.obter());
    } catch (err) {
      setErroCarregar(formatApiError(err, "Não foi possível carregar a verificação em duas etapas."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const reiniciarFluxo = useCallback(() => {
    setFase("inicial");
    setDesafio(null);
    setCodigo("");
    setSenha("");
    setErro(null);
    iniciarContagem(0);
  }, [iniciarContagem]);

  const receberDesafio = (novo: DoisFatoresDesafio, proximaFase: Fase) => {
    setDesafio(novo);
    setCodigo("");
    setErro(null);
    iniciarContagem(novo.reenvio_em_segundos);
    setFase(proximaFase);
  };

  // ── Ativação ──────────────────────────────────────────────────────────────

  const pedirCodigoAtivacao = async () => {
    setOcupado(true);
    setErro(null);
    setSucesso(null);
    try {
      receberDesafio(await doisFatoresService.solicitarAtivacao(), "ativacao-codigo");
    } catch (err) {
      setErro(formatApiError(err, "Não foi possível enviar o código. Tente novamente."));
    } finally {
      setOcupado(false);
    }
  };

  const confirmarAtivacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desafio || ocupado) return;
    if (codigo.length !== TAMANHO_CODIGO_DOIS_FATORES) {
      setErro(`Digite o código de ${TAMANHO_CODIGO_DOIS_FATORES} dígitos.`);
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      const resposta = await doisFatoresService.confirmarAtivacao({ desafio_id: desafio.desafio_id, codigo });
      setEstado((atual) => (atual ? { ...atual, ativo: resposta.dois_fatores_ativo, pode_ativar: false } : atual));
      reiniciarFluxo();
      setSucesso(resposta.message);
    } catch (err) {
      setCodigo("");
      setErro(formatApiError(err, "Não foi possível confirmar o código. Tente novamente."));
    } finally {
      setOcupado(false);
    }
  };

  // ── Desativação ───────────────────────────────────────────────────────────

  const pedirCodigoDesativacao = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (ocupado) return;
    if (!senha.trim()) {
      setErro("Informe a senha atual.");
      return;
    }
    setOcupado(true);
    setErro(null);
    setSucesso(null);
    try {
      receberDesafio(await doisFatoresService.solicitarDesativacao({ senha }), "desativacao-codigo");
    } catch (err) {
      setErro(formatApiError(err, "Não foi possível enviar o código. Tente novamente."));
    } finally {
      setOcupado(false);
    }
  };

  const confirmarDesativacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desafio || ocupado) return;
    if (codigo.length !== TAMANHO_CODIGO_DOIS_FATORES) {
      setErro(`Digite o código de ${TAMANHO_CODIGO_DOIS_FATORES} dígitos.`);
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      const resposta = await doisFatoresService.confirmarDesativacao({
        desafio_id: desafio.desafio_id,
        codigo,
        senha,
      });
      setEstado((atual) =>
        atual ? { ...atual, ativo: resposta.dois_fatores_ativo, pode_ativar: atual.email_verificado } : atual
      );
      reiniciarFluxo();
      setSucesso(resposta.message);
    } catch (err) {
      setCodigo("");
      setErro(formatApiError(err, "Não foi possível confirmar o código. Tente novamente."));
    } finally {
      setOcupado(false);
    }
  };

  const reenviarCodigo = async () => {
    if (segundosParaReenviar > 0 || ocupado) return;
    if (fase === "ativacao-codigo") await pedirCodigoAtivacao();
    else if (fase === "desativacao-codigo") await pedirCodigoDesativacao();
  };

  // ── Interface ─────────────────────────────────────────────────────────────

  const ativo = estado?.ativo === true;

  const cabecalhoStatus = estado && (
    <span
      className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ativo
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {ativo ? "Ativada" : "Desativada"}
    </span>
  );

  const blocoCodigo = (aoConfirmar: (e: React.FormEvent) => void, textoConfirmar: string, danger = false) => (
    <form onSubmit={aoConfirmar} className="space-y-4" noValidate>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enviámos um código de {TAMANHO_CODIGO_DOIS_FATORES} dígitos para{" "}
        <span className="font-medium text-gray-800 dark:text-gray-200">{desafio?.email_mascarado}</span>. O código vale
        por {Math.max(1, Math.round((desafio?.expira_em_segundos ?? 600) / 60))} minutos.
      </p>
      <div className="max-w-xs">
        <label htmlFor="codigo-dois-fatores-config" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Código de verificação
        </label>
        <CodigoVerificacaoInput
          id="codigo-dois-fatores-config"
          value={codigo}
          onChange={(valor) => {
            setCodigo(valor);
            if (erro) setErro(null);
          }}
          disabled={ocupado}
          invalido={Boolean(erro)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={ocupado || codigo.length !== TAMANHO_CODIGO_DOIS_FATORES}
          className={danger ? CLASSE_BOTAO_PERIGO : CLASSE_BOTAO_PRIMARIO}
        >
          {ocupado ? "Verificando..." : textoConfirmar}
        </button>
        <button
          type="button"
          onClick={reenviarCodigo}
          disabled={segundosParaReenviar > 0 || ocupado}
          className="text-sm text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400 dark:disabled:text-gray-500"
        >
          {segundosParaReenviar > 0 ? `Reenviar código em ${segundosParaReenviar}s` : "Reenviar código"}
        </button>
        <button type="button" onClick={reiniciarFluxo} disabled={ocupado} className={CLASSE_BOTAO_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon icon="mdi:shield-lock-outline" width="18px" className="text-gray-600 dark:text-gray-400" />
          </span>
          Verificação em duas etapas
          {cabecalhoStatus}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quando ativada, cada vez que entrar com a sua senha enviamos um código de {TAMANHO_CODIGO_DOIS_FATORES} dígitos
          para o seu e-mail. Sem o código, ninguém consegue entrar na sua conta.
        </p>
      </div>

      {carregando && <p className="text-sm text-gray-500 dark:text-gray-400">A carregar...</p>}

      {!carregando && erroCarregar && (
        <div className="space-y-3">
          <Aviso tipo="erro">{erroCarregar}</Aviso>
          <button type="button" onClick={() => void carregar()} className={CLASSE_BOTAO_SECUNDARIO}>
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && estado && (
        <div className="space-y-4">
          {sucesso && fase === "inicial" && <Aviso tipo="sucesso">{sucesso}</Aviso>}

          {fase === "inicial" && !ativo && (
            <>
              {estado.pode_ativar ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  O código será enviado para{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-200">{estado.email_mascarado}</span>.
                </p>
              ) : (
                <Aviso tipo="info">
                  Para ativar, o seu e-mail precisa estar cadastrado e verificado. Verifique o e-mail da sua conta e
                  volte aqui.
                </Aviso>
              )}
              {erro && <Aviso tipo="erro">{erro}</Aviso>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={pedirCodigoAtivacao}
                  disabled={!estado.pode_ativar || ocupado}
                  className={CLASSE_BOTAO_PRIMARIO}
                >
                  {ocupado ? "Enviando código..." : "Ativar verificação em duas etapas"}
                </button>
              </div>
            </>
          )}

          {fase === "inicial" && ativo && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Os códigos são enviados para{" "}
                <span className="font-medium text-gray-800 dark:text-gray-200">{estado.email_mascarado}</span>.
                Enquanto estiver ativada, o e-mail da conta não pode ser alterado; para trocá-lo, desative primeiro.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSucesso(null);
                    setErro(null);
                    setFase("desativacao-senha");
                  }}
                  className={CLASSE_BOTAO_PERIGO}
                >
                  Desativar
                </button>
              </div>
            </>
          )}

          {fase === "ativacao-codigo" && blocoCodigo(confirmarAtivacao, "Confirmar e ativar")}

          {fase === "desativacao-senha" && (
            <form onSubmit={pedirCodigoDesativacao} className="space-y-4" noValidate>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Para desativar, confirme a sua senha atual. Depois enviaremos um código para o seu e-mail.
              </p>
              <div className="max-w-sm">
                <label htmlFor="senha-dois-fatores-config" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha atual
                </label>
                <input
                  id="senha-dois-fatores-config"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={ocupado}
                  className={CLASSE_INPUT}
                  placeholder="Digite a senha atual"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={ocupado || !senha.trim()} className={CLASSE_BOTAO_PRIMARIO}>
                  {ocupado ? "Enviando código..." : "Enviar código"}
                </button>
                <button type="button" onClick={reiniciarFluxo} disabled={ocupado} className={CLASSE_BOTAO_SECUNDARIO}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {fase === "desativacao-codigo" && blocoCodigo(confirmarDesativacao, "Confirmar e desativar", true)}

          {erro && fase !== "inicial" && <Aviso tipo="erro">{erro}</Aviso>}
        </div>
      )}
    </div>
  );
}

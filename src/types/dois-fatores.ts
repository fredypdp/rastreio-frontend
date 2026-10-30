// src/types/dois-fatores.ts
//
// Verificação em duas etapas (2FA) por e-mail — tarefa 32.
// Contratos de POST /login (segunda etapa), /login/dois-fatores/* e /dois-fatores/*.

import type { AuthResponse } from '@/types/api';

/** Desafio criado quando o backend envia um código de 6 dígitos por e-mail. */
export interface DoisFatoresDesafio {
  desafio_id: string;
  metodo: 'email';
  email_mascarado: string;
  /** Validade do código (segundos). */
  expira_em_segundos: number;
  /** Tempo mínimo até poder pedir outro código (segundos). */
  reenvio_em_segundos: number;
  message?: string;
}

/** Resposta de POST /login quando a conta tem 2FA ativo: NÃO traz token. */
export interface LoginDoisFatoresPendente extends DoisFatoresDesafio {
  requer_dois_fatores: true;
  /** true quando o backend reaproveitou um código enviado há instantes. */
  reutilizado?: boolean;
}

/** POST /login devolve o token (sem 2FA) ou o pedido da segunda etapa. */
export type LoginResponse = AuthResponse | LoginDoisFatoresPendente;

/** Type guard: a resposta de login exige o código de 6 dígitos? */
export function exigeDoisFatores(resposta: LoginResponse): resposta is LoginDoisFatoresPendente {
  return 'requer_dois_fatores' in resposta && resposta.requer_dois_fatores === true;
}

export interface VerificarLoginDoisFatoresRequest {
  desafio_id: string;
  codigo: string;
}

export interface ReenviarLoginDoisFatoresRequest {
  desafio_id: string;
}

/** GET /dois-fatores */
export interface DoisFatoresEstado {
  ativo: boolean;
  metodo: 'email';
  email_verificado: boolean;
  /** 2FA inativo e e-mail verificado. */
  pode_ativar: boolean;
  /** null quando a conta não tem e-mail. */
  email_mascarado: string | null;
}

export interface ConfirmarDoisFatoresRequest {
  desafio_id: string;
  codigo: string;
}

export interface SolicitarDesativacaoDoisFatoresRequest {
  senha: string;
}

export interface ConfirmarDesativacaoDoisFatoresRequest extends ConfirmarDoisFatoresRequest {
  senha: string;
}

export interface DoisFatoresConfirmacaoResponse {
  message: string;
  dois_fatores_ativo: boolean;
}

/** Tamanho do código numérico (igual ao do backend). */
export const TAMANHO_CODIGO_DOIS_FATORES = 6;

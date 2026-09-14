// src/types/email-auth.ts
import { UserType } from "./api";

/**
 * Request para recuperação de senha (identificador obrigatório, tipo
 * opcional — quando omitido, o backend tenta estudante/academia/admin
 * nessa ordem).
 */
export interface GerarTokenRecuperacaoRequest {
  identificador: string; // codigo_estudante, codigo_academia ou email (admin)
  tipo: UserType; // 'estudante' | 'academia' | 'admin'
}

/**
 * Response quando email é verificado com sucesso
 */
export interface VerificarEmailResponse {
  message: string;
  email: string;
}

/**
 * Response dos endpoints /email/verificar-email/solicitar e
 * /email/recuperar-senha/solicitar — o backend controla o envio completo
 * (token + email), por isso a resposta não traz token nem senha, só a
 * confirmação de que o email foi enviado.
 */
export interface SolicitarEmailResponse {
  success: boolean;
  message: string;
  email?: string;
}

/**
 * ✅ Response de erro quando email não está verificado
 */
export interface EmailNaoVerificadoError {
  error: "email não verificado";
  message: string;
  email_verificado: false;
}

/**
 * Request para alterar senha (usuário logado)
 */
export interface AlterarSenhaRequest {
  senha_atual: string;
  nova_senha: string;
}

/**
 * Response após alterar senha
 */
export interface AlterarSenhaResponse {
  message: string;
}

/**
 * Senhas padrão por tipo de usuário
 * Baseado em: internal/services/email_service.go -> GetDefaultPassword()
 */
export const SenhasPadrao = {
  estudante: (codigo: string) => codigo,           // codigo_estudante
  academia: (codigo: string) => codigo,            // codigo_academia
  admin: "spuriadm",
  gerente: "spurigerente",
  fpp: "spurifpp",
  default: "spuri123"
} as const;

/**
 * Tipo para as senhas padrão
 */
export type SenhaPadrao = 
  | string                    // Para estudante/academia (dinâmico)
  | "spuriadm"               // Admin
  | "spurigerente"           // Gerente
  | "spurifpp"               // FPP
  | "spuri123";              // Default

/**
 * Helper para obter senha padrão
 */
export function getSenhaPadrao(userType: UserType, codigo?: string, role?: string): string {
  switch (userType) {
    case "estudante":
      return codigo || SenhasPadrao.default;
    case "academia":
      return codigo || SenhasPadrao.default;
    case "admin":
      if (role === "fpp") return SenhasPadrao.fpp;
      if (role === "gerente") return SenhasPadrao.gerente;
      return SenhasPadrao.admin; // "adm" e default
    default:
      return SenhasPadrao.default;
  }
}

/**
 * ✅ Type guard para verificar se erro é EmailNaoVerificadoError
 */
export function isEmailNaoVerificadoError(error: any): error is EmailNaoVerificadoError {
  return (
    error &&
    error.error === "email não verificado" &&
    error.email_verificado === false
  );
}

// src/types/email-auth.ts
import { UserType } from "./api";

/**
 * Request para pedir a recuperação de senha por LINK (identificador
 * obrigatório, tipo opcional — quando omitido, o backend tenta
 * estudante/academia/admin nessa ordem).
 */
export interface RecuperarSenhaRequest {
  identificador: string; // codigo_estudante, codigo_academia ou email
  tipo: UserType; // 'estudante' | 'academia' | 'admin'
}

/**
 * Request da página /recuperar-senha/<token>: a nova senha escolhida pelo
 * titular depois de abrir o link do e-mail.
 */
export interface ResetarSenhaRequest {
  nova_senha: string;
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
 * (token + email), por isso a resposta não traz token nem senha. No pedido
 * de recuperação a resposta é SEMPRE a mesma, exista a conta ou não
 * (não permite enumerar contas): não conclua nada a partir dela.
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
 * Request para alterar senha (usuário logado). Também é a troca obrigatória
 * da senha temporária: 8 a 128 caracteres e diferente da senha atual.
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
 * ✅ Type guard para verificar se erro é EmailNaoVerificadoError
 */
export function isEmailNaoVerificadoError(error: any): error is EmailNaoVerificadoError {
  return (
    error &&
    error.error === "email não verificado" &&
    error.email_verificado === false
  );
}

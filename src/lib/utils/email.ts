// src/lib/utils/email.ts
import { UserType } from "@/types/api";
import { tokenStorage } from '@/lib/api';
import { emailAuthService } from '@/lib/api/services/email.service';

/**
 * Solicita o envio do email de verificação para o usuário logado.
 *
 * O backend agora controla o envio completo (token + email, com o HTML de
 * marca da plataforma) — o frontend só precisa estar autenticado, não
 * precisa mais gerar o token nem montar/enviar o email ele mesmo.
 */
export async function VerificarEmailComFrontend(_identificador: string, _tipo: UserType) {
  const jwt = tokenStorage.get();
  if (!jwt) throw new Error('Usuário não autenticado');

  return emailAuthService.solicitarVerificacaoEmail(jwt);
}

/**
 * Pede a recuperação de senha. O backend envia ao e-mail verificado um LINK
 * de uso único (1 hora) para /recuperar-senha/<token>; a senha só muda quando
 * o titular escolhe a nova senha nessa página. A resposta é sempre a mesma,
 * exista a conta ou não.
 *
 * 'tipo' continua opcional: quando não informado, o backend tenta
 * identificar o usuário como estudante, depois academia, depois admin,
 * nessa ordem (mesmo comportamento que antes era feito aqui no frontend).
 */
export async function RecuperarSenhaComFrontend(identificador: string, tipo?: UserType) {
  if (!identificador || identificador.trim() === '') {
    throw new Error('Identificador é obrigatório');
  }

  if (tipo && !['estudante', 'academia', 'admin'].includes(tipo)) {
    throw new Error('Tipo de usuário inválido');
  }

  return emailAuthService.solicitarRecuperacaoSenha(identificador.trim(), tipo);
}

/**
 * Define a nova senha com o token do link de recuperação.
 */
export async function ResetarSenhaComToken(token: string, novaSenha: string) {
  if (!token || token.trim() === '') {
    throw new Error('Token é obrigatório');
  }
  return emailAuthService.resetarSenha(token.trim(), novaSenha);
}

/**
 * Verifica email usando token da URL (usuário clicou no link recebido).
 */
export async function VerificarEmailComToken(token: string) {
  if (!token || token.trim() === '') {
    throw new Error('Token é obrigatório');
  }

  const response = await fetch(`/api/verificar-email/${token}`, {
    method: 'POST'
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || data.error || 'Erro ao verificar email';
    throw new Error(errorMsg);
  }

  return data;
}

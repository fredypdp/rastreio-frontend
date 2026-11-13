// src/lib/api/services/email.service.ts

import { api } from '../client';
import type {
  RecuperarSenhaRequest,
  ResetarSenhaRequest,
  VerificarEmailResponse,
  SolicitarEmailResponse,
} from '@/types/email-auth';

class EmailAuthService {

  /**
   * Confirma o token recebido por email (usuário clicou no link de
   * verificação). Rota pública: POST /email/verificar-email/:token.
   */
  async verificarEmail(token: string): Promise<VerificarEmailResponse> {
    return api.post<VerificarEmailResponse>(`/email/verificar-email/${token}`, {});
  }

  /**
   * Requer JWT — o backend identifica o usuário pelo próprio token (não
   * precisa de identificador/tipo no body) e envia o email de verificação
   * diretamente, com o HTML de marca da plataforma.
   */
  async solicitarVerificacaoEmail(jwt: string): Promise<SolicitarEmailResponse> {
    return api.post<SolicitarEmailResponse>(
      '/email/verificar-email/solicitar',
      {},
      { token: jwt }
    );
  }

  /**
   * Pública. 'tipo' é opcional — se omitido, o backend tenta identificar o
   * usuário como estudante, depois academia, depois admin, nessa ordem.
   * NÃO altera a senha: envia ao e-mail verificado um LINK de uso único
   * (1 hora) para /recuperar-senha/<token>. A resposta é sempre a mesma (200),
   * exista a conta ou não — não permite enumerar contas.
   */
  async solicitarRecuperacaoSenha(identificador: string, tipo?: RecuperarSenhaRequest['tipo']): Promise<SolicitarEmailResponse> {
    return api.post<SolicitarEmailResponse>('/email/recuperar-senha/solicitar', {
      identificador,
      ...(tipo ? { tipo } : {}),
    });
  }

  /**
   * Pública. Define a nova senha com o token do link recebido por e-mail
   * (uso único). Só aqui a senha muda.
   */
  async resetarSenha(token: string, nova_senha: ResetarSenhaRequest['nova_senha']): Promise<{ message: string; email?: string }> {
    return api.post<{ message: string; email?: string }>(`/email/recuperar-senha/${token}`, { nova_senha });
  }
}

export const emailAuthService = new EmailAuthService();

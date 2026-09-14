// src/lib/api/services/email.service.ts

import { api } from '../client';
import type {
  GerarTokenRecuperacaoRequest,
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
   * Reseta a senha imediatamente e envia a nova senha temporária por email
   * (com o HTML de marca da plataforma) — não há mais token/link envolvido.
   */
  async solicitarRecuperacaoSenha(identificador: string, tipo?: GerarTokenRecuperacaoRequest['tipo']): Promise<SolicitarEmailResponse> {
    return api.post<SolicitarEmailResponse>('/email/recuperar-senha/solicitar', {
      identificador,
      ...(tipo ? { tipo } : {}),
    });
  }
}

export const emailAuthService = new EmailAuthService();

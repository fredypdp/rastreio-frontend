// src/lib/utils/educando.ts
//
// Parte 4 — o encarregado age em nome de UM educando de cada vez. O código do
// educando escolhido fica num cookie e o cliente HTTP o envia no cabeçalho
// `X-Educando` nas rotas do estudante. É só conveniência de navegação: quem
// decide se o vínculo existe e em que fase está é o servidor.

import { getCookie, setCookieHours, removeCookie } from '@/lib/utils/cookies';

const COOKIE_EDUCANDO = 'educando_ativo';
const HORAS_EDUCANDO = 24;

/** Cabeçalho que o servidor lê para saber em nome de qual educando o encarregado age. */
export const HEADER_EDUCANDO = 'X-Educando';

export const educandoStorage = {
  get: (): string | null => getCookie(COOKIE_EDUCANDO),

  set: (codigoEstudante: string): void => {
    setCookieHours(COOKIE_EDUCANDO, codigoEstudante, HORAS_EDUCANDO);
  },

  clear: (): void => {
    removeCookie(COOKIE_EDUCANDO);
  },
};

/**
 * Rotas que agem sobre a conta REAL do encarregado e, por isso, não levam o
 * cabeçalho do educando (espelha as rotas de conta do backend, seção 3.6).
 */
const ROTAS_DA_CONTA_DO_ENCARREGADO = [
  '/encarregado/',
  '/meu-perfil',
  '/alterar-senha',
  '/me/',
  '/dois-fatores',
  '/logout',
  '/email/',
  '/login',
];

/** Cabeçalhos a acrescentar a uma chamada: `X-Educando` só para o encarregado e fora das rotas de conta. */
export function cabecalhosDoEducando(endpoint: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  if (getCookie('user_type') !== 'encarregado') return {};
  const codigo = educandoStorage.get();
  if (!codigo) return {};
  if (ROTAS_DA_CONTA_DO_ENCARREGADO.some((prefixo) => endpoint.startsWith(prefixo))) return {};
  return { [HEADER_EDUCANDO]: codigo };
}

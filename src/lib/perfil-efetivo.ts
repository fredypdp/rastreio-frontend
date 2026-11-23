// src/lib/perfil-efetivo.ts
//
// Plano de Atualizações, Parte 4 — perfil EFETIVO da interface.
//
// O servidor já faz o secretário agir "como a academia" e o encarregado "como o
// educando" (seção 3.6 da Documentação da API). A interface segue a mesma ideia
// para não reescrever as dezenas de telas que comparam `user.tipo`: o cookie
// "user" guarda o tipo EFETIVO em `tipo` e o tipo REAL em `tipo_real`.
//
//   secretário  → tipo 'academia'  (+ tipo_real 'secretario', permissoes, academia)
//   encarregado → tipo 'estudante' (+ tipo_real 'encarregado', educando_ativo)
//                 quando há um educando escolhido; senão 'encarregado'
//   professor   → tipo 'professor'
//
// Isto só decide o que MOSTRAR. Quem permite ou nega é sempre o servidor.

import { consultasService, perfilService } from '@/lib/api';
import { educandoStorage } from '@/lib/utils/educando';
import type { MeuPerfilResponse, UserType } from '@/types/api';
import type { EducandoEncarregado } from '@/types/contas';
import { encarregadoService } from '@/lib/api/contas-service';

export function tipoReal(user: MeuPerfilResponse | null | undefined): UserType | null {
  if (!user) return null;
  return user.tipo_real ?? user.tipo;
}

export const ehSecretario = (user: MeuPerfilResponse | null | undefined) => tipoReal(user) === 'secretario';
export const ehEncarregado = (user: MeuPerfilResponse | null | undefined) => tipoReal(user) === 'encarregado';
export const ehProfessor = (user: MeuPerfilResponse | null | undefined) => tipoReal(user) === 'professor';

/**
 * Academia e admin têm todas as permissões; o secretário, só as que a academia
 * concedeu (conjunto já normalizado pelo servidor, com as implicadas).
 */
export function temPermissao(user: MeuPerfilResponse | null | undefined, permissao: string): boolean {
  if (!user) return false;
  if (!ehSecretario(user)) return true;
  return (user.permissoes ?? []).includes(permissao);
}

import {
  PERMISSAO_DA_PAGINA,
  ROTAS_NEGADAS_AO_SECRETARIO,
  ROTAS_RESERVADAS_A_ACADEMIA,
  permissaoDaPagina,
  secretarioPodeAbrir,
  rotaInicial,
} from '@/lib/perfil-efetivo-regras';

export { PERMISSAO_DA_PAGINA, ROTAS_NEGADAS_AO_SECRETARIO, ROTAS_RESERVADAS_A_ACADEMIA, permissaoDaPagina, secretarioPodeAbrir, rotaInicial };

/**
 * Transforma o /meu-perfil no perfil efetivo guardado no cookie "user".
 * `educando` só vale para o encarregado que escolheu um educando.
 */
export function aplicarPerfilEfetivo(
  perfil: MeuPerfilResponse,
  educando?: { estudante: NonNullable<MeuPerfilResponse['estudante']>; info?: EducandoEncarregado } | null
): MeuPerfilResponse {
  switch (perfil.tipo) {
    case 'secretario':
      return { ...perfil, tipo: 'academia', tipo_real: 'secretario', permissoes: perfil.permissoes ?? [] };
    case 'encarregado':
      if (educando) {
        return {
          ...perfil,
          tipo: 'estudante',
          tipo_real: 'encarregado',
          estudante: educando.estudante,
          educando_ativo: educando.info,
        };
      }
      return perfil;
    default:
      return perfil;
  }
}

/**
 * Carrega o perfil e o converte no efetivo. Para o encarregado com educando
 * escolhido, busca também os dados do educando (o cliente HTTP envia o
 * cabeçalho X-Educando). Se o vínculo já não existe, esquece o educando.
 */
export async function carregarPerfilEfetivo(token: string): Promise<MeuPerfilResponse> {
  const perfil = await perfilService.meuPerfil(token);
  if (perfil.tipo !== 'encarregado') return aplicarPerfilEfetivo(perfil);

  const codigo = educandoStorage.get();
  if (!codigo) return aplicarPerfilEfetivo(perfil);

  try {
    const lista = await encarregadoService.listarEducandos(token);
    const info = lista.data.find((e) => e.codigo_estudante.toUpperCase() === codigo.toUpperCase());
    if (!info) {
      educandoStorage.clear();
      return aplicarPerfilEfetivo({ ...perfil, educandos: lista.data });
    }
    const consulta = await consultasService.estudante(info.codigo_estudante, token);
    const estudante = {
      ...consulta.estudante,
      academia_info: consulta.estudante.academia,
    } as NonNullable<MeuPerfilResponse['estudante']>;
    return aplicarPerfilEfetivo({ ...perfil, educandos: lista.data }, { estudante, info });
  } catch {
    educandoStorage.clear();
    return aplicarPerfilEfetivo(perfil);
  }
}

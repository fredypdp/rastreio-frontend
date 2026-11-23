// src/types/contas.ts
//
// Plano de Atualizações, Partes 4 e 5 — secretário, professor e encarregado.
// Contratos da API (seções 26, 27 e 28 da Documentação da API do backend).

import type { CredenciaisEnvio } from '@/types/api';

/** Tipos de login novos (os antigos continuam em UserType). */
export type TipoContaPessoa = 'secretario' | 'professor' | 'encarregado';

export type StatusConta = 'ativo' | 'inativo' | 'deletado';

// ── Permissões do secretário ────────────────────────────────────────────────

/** GET /academia/permissoes */
export interface PermissaoCatalogo {
  chave: string;
  rotulo: string;
  descricao: string;
  grupo: string;
  /** Chaves que esta permissão traz junto (gerir → ver). */
  implica?: string[];
}

// ── Conta de pessoa ─────────────────────────────────────────────────────────

export interface ContaPessoaResumo {
  id: string;
  tipo: TipoContaPessoa;
  codigo: string;
  nome: string;
  genero: 'masculino' | 'feminino';
  data_nascimento: string;
  email?: string | null;
  email_verificado: boolean;
  telefone: string;
  status: StatusConta;
  codigo_academia?: string | null;
  /** Só secretário. */
  permissoes?: string[];
  deve_alterar_senha?: boolean;
  created_at: string;
}

export interface DadosPessoaisNovaConta {
  nome: string;
  genero: 'masculino' | 'feminino';
  /** AAAA-MM-DD. Pelo menos 18 anos. */
  data_nascimento: string;
  /** Móvel nacional de 9 dígitos: recebe as credenciais por SMS. */
  telefone: string;
  email?: string;
}

export interface CriarSecretarioRequest extends DadosPessoaisNovaConta {
  permissoes?: string[];
  todas_permissoes?: boolean;
}

export interface EditarContaRequest {
  nome?: string;
  genero?: 'masculino' | 'feminino';
  data_nascimento?: string;
  telefone?: string;
  email?: string;
  /** Só secretário. */
  permissoes?: string[];
}

export interface CriarContaResponse {
  message: string;
  data: {
    id: string;
    tipo: TipoContaPessoa;
    codigo: string;
    nome: string;
    status: StatusConta;
    permissoes?: string[];
    vinculos?: { id: string; codigo_turma: string; materia_id: string }[];
    credenciais: CredenciaisEnvio;
  };
}

export interface ListaSecretariosResponse {
  data: ContaPessoaResumo[];
  total: number;
}

// ── Professor ───────────────────────────────────────────────────────────────

export interface VinculoProfessor {
  id: string;
  professor_id: string;
  codigo_academia: string;
  codigo_turma: string;
  materia_id: string;
  atribuido_em: string;
}

export interface ProfessorComVinculos {
  professor: ContaPessoaResumo;
  vinculos: VinculoProfessor[];
}

export interface ListaProfessoresResponse {
  data: ProfessorComVinculos[];
  total: number;
}

export interface NovoVinculoProfessor {
  codigo_turma: string;
  materia_id: string;
}

export interface CriarProfessorRequest extends DadosPessoaisNovaConta {
  vinculos?: NovoVinculoProfessor[];
}

/** GET /professor/vinculos */
export interface MeuVinculoProfessor {
  id: string;
  codigo_turma: string;
  materia_id: string;
  materia_nome: string;
  nivel: string;
  turno: string;
  status_turma: string;
}

export interface MinhaTurmaProfessor {
  codigo_turma: string;
  nivel: string;
  turno: string;
  status: string;
  total_estudantes: number;
}

export interface EstudanteDaTurmaProfessor {
  codigo_estudante: string;
  nome: string;
  status: string;
}

export interface NotaConsultaProfessor {
  id: string;
  codigo_estudante: string;
  materia_id: string;
  ano_lectivo: string;
  periodo: string;
  tipo: string;
  categoria: string;
  nota: number;
  ano_academico: string;
  registered_at: string;
}

export interface FaltaConsultaProfessor {
  id: string;
  codigo_estudante: string;
  materia_id: string;
  ano_lectivo: string;
  data: string;
  quantidade: number;
  periodo: string;
  sumario_titulo: string;
}

// ── Encarregado ─────────────────────────────────────────────────────────────

export type RelacaoEncarregado = 'pai' | 'mae' | 'irmao' | 'irma' | 'outro';

export const ROTULOS_RELACAO: Record<RelacaoEncarregado, string> = {
  pai: 'Pai',
  mae: 'Mãe',
  irmao: 'Irmão',
  irma: 'Irmã',
  outro: 'Outro',
};

/** Bloco do encarregado no cadastro do estudante do nível escolar. */
export interface BlocoEncarregado {
  nome?: string;
  genero?: 'masculino' | 'feminino';
  /** AAAA-MM-DD. Pelo menos 18 anos. */
  data_nascimento?: string;
  /** Identificador do encarregado e destino das credenciais. */
  telefone: string;
  email?: string;
  relacao?: RelacaoEncarregado;
  /** Obrigatório quando relacao === 'outro'. */
  relacao_outro?: string;
}

/** `fase`: "acao" = faz tudo o que o estudante faz; "leitura" = só consulta notas e faltas do período escolar. */
export type FaseEducando = 'acao' | 'leitura';

/** GET /encarregado/educandos */
export interface EducandoEncarregado {
  codigo_estudante: string;
  nome: string;
  status: string;
  codigo_academia: string;
  nome_academia: string;
  relacao?: RelacaoEncarregado | null;
  relacao_outro?: string | null;
  fase: FaseEducando;
}

export interface ListaEducandosResponse {
  data: EducandoEncarregado[];
  total: number;
}

/** GET /academia/encarregados/buscar */
export interface BuscarEncarregadoResponse {
  data:
    | { encontrado: false }
    | {
        encontrado: true;
        encarregado: {
          id: string;
          nome: string;
          telefone_mascarado: string;
          total_educandos: number;
          status: StatusConta;
        };
      };
}

/** Resultado do encarregado em POST /academia/estudante/register e PUT /academia/estudante/:codigo/encarregado. */
export interface EncarregadoDoCadastro {
  id: string;
  codigo: string;
  conta_nova: boolean;
  credenciais?: CredenciaisEnvio;
}

export interface TrocarEncarregadoResponse {
  message: string;
  data: {
    encarregado_id: string;
    codigo: string;
    conta_nova: boolean;
    credenciais?: CredenciaisEnvio;
  };
}

/** Códigos do envelope de erro da porta de identidade (403). */
export const CODIGOS_PORTA_IDENTIDADE = {
  SECRETARIO_SEM_PERMISSAO: 'SECRETARIO_SEM_PERMISSAO',
  ACAO_RESERVADA_A_ACADEMIA: 'ACAO_RESERVADA_A_ACADEMIA',
  ACAO_NAO_PERMITIDA_AO_SECRETARIO: 'ACAO_NAO_PERMITIDA_AO_SECRETARIO',
  ROTA_FORA_DO_PERFIL: 'ROTA_FORA_DO_PERFIL',
  ACADEMIA_INATIVA: 'ACADEMIA_INATIVA',
  EDUCANDO_OBRIGATORIO: 'EDUCANDO_OBRIGATORIO',
  EDUCANDO_NAO_VINCULADO: 'EDUCANDO_NAO_VINCULADO',
  ENCARREGADO_SOMENTE_LEITURA: 'ENCARREGADO_SOMENTE_LEITURA',
} as const;

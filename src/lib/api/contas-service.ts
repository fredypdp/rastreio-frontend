// src/lib/api/contas-service.ts
//
// Plano de Atualizações, Partes 4 e 5 — secretários (seção 26), professores
// (seção 27) e encarregados (seção 28 da Documentação da API).

import { api, tokenStorage } from './client';
import type {
  BlocoEncarregado,
  BuscarEncarregadoResponse,
  CriarContaResponse,
  CriarProfessorRequest,
  CriarSecretarioRequest,
  EditarContaRequest,
  EstudanteDaTurmaProfessor,
  FaltaConsultaProfessor,
  ListaEducandosResponse,
  ListaProfessoresResponse,
  ListaSecretariosResponse,
  MeuVinculoProfessor,
  MinhaTurmaProfessor,
  NotaConsultaProfessor,
  NovoVinculoProfessor,
  PermissaoCatalogo,
  ProfessorComVinculos,
  RelacaoEncarregado,
  TrocarEncarregadoResponse,
  VinculoProfessor,
  ContaPessoaResumo,
} from '@/types/contas';

const opcoes = (token?: string) => ({ token: token || tokenStorage.get() || undefined });
const id = encodeURIComponent;

/** Secretários: ações RESERVADAS à academia (o secretário recebe 403 ACAO_RESERVADA_A_ACADEMIA). */
export const secretarioService = {
  /** GET /academia/permissoes — catálogo que a academia pode conceder. */
  listarPermissoes: (token?: string) => api.get<{ data: PermissaoCatalogo[] }>('/academia/permissoes', opcoes(token)),

  /** POST /academia/secretarios — gera SCnnnnnn e envia a senha temporária por SMS. */
  criar: (data: CriarSecretarioRequest, token?: string) =>
    api.post<CriarContaResponse, CriarSecretarioRequest>('/academia/secretarios', data, opcoes(token)),

  listar: (token?: string) => api.get<ListaSecretariosResponse>('/academia/secretarios', opcoes(token)),

  obter: (secretarioId: string, token?: string) =>
    api.get<{ data: ContaPessoaResumo }>(`/academia/secretarios/${id(secretarioId)}`, opcoes(token)),

  /** PUT /academia/secretarios/:id — dados e/ou permissões. */
  editar: (secretarioId: string, data: EditarContaRequest, token?: string) =>
    api.put<{ message: string }, EditarContaRequest>(`/academia/secretarios/${id(secretarioId)}`, data, opcoes(token)),

  ativar: (secretarioId: string, token?: string) =>
    api.put<{ message: string }>(`/academia/secretarios/${id(secretarioId)}/ativar`, undefined, opcoes(token)),

  desativar: (secretarioId: string, motivo?: string, token?: string) =>
    api.put<{ message: string }, { motivo?: string }>(`/academia/secretarios/${id(secretarioId)}/desativar`, motivo ? { motivo } : undefined, opcoes(token)),

  eliminar: (secretarioId: string, motivo?: string, token?: string) =>
    api.delete<{ message: string }, { motivo?: string }>(`/academia/secretarios/${id(secretarioId)}`, motivo ? { motivo } : undefined, opcoes(token)),
};

/** Professores: academia, ou secretário com professores.ver / professores.gerir. */
export const professorService = {
  criar: (data: CriarProfessorRequest, token?: string) =>
    api.post<CriarContaResponse, CriarProfessorRequest>('/academia/professores', data, opcoes(token)),

  listar: (token?: string) => api.get<ListaProfessoresResponse>('/academia/professores', opcoes(token)),

  obter: (professorId: string, token?: string) =>
    api.get<{ data: ProfessorComVinculos }>(`/academia/professores/${id(professorId)}`, opcoes(token)),

  editar: (professorId: string, data: EditarContaRequest, token?: string) =>
    api.put<{ message: string }, EditarContaRequest>(`/academia/professores/${id(professorId)}`, data, opcoes(token)),

  ativar: (professorId: string, token?: string) =>
    api.put<{ message: string }>(`/academia/professores/${id(professorId)}/ativar`, undefined, opcoes(token)),

  desativar: (professorId: string, motivo?: string, token?: string) =>
    api.put<{ message: string }, { motivo?: string }>(`/academia/professores/${id(professorId)}/desativar`, motivo ? { motivo } : undefined, opcoes(token)),

  eliminar: (professorId: string, motivo?: string, token?: string) =>
    api.delete<{ message: string }, { motivo?: string }>(`/academia/professores/${id(professorId)}`, motivo ? { motivo } : undefined, opcoes(token)),

  atribuirVinculo: (professorId: string, data: NovoVinculoProfessor, token?: string) =>
    api.post<{ message: string; data: VinculoProfessor }, NovoVinculoProfessor>(`/academia/professores/${id(professorId)}/vinculos`, data, opcoes(token)),

  removerVinculo: (professorId: string, vinculoId: string, token?: string) =>
    api.delete<{ message: string }>(`/academia/professores/${id(professorId)}/vinculos/${id(vinculoId)}`, opcoes(token)),

  /** PUT /academia/vinculos-professor/:vinculo_id/reatribuir — passa o par turma+matéria a outro professor ativo. */
  reatribuirVinculo: (vinculoId: string, professorId: string, token?: string) =>
    api.put<{ message: string }, { professor_id: string }>(`/academia/vinculos-professor/${id(vinculoId)}/reatribuir`, { professor_id: professorId }, opcoes(token)),
};

/** Área do professor: só consulta, já filtrada pelos vínculos ativos. */
export const professorAreaService = {
  meusVinculos: (token?: string) => api.get<{ data: MeuVinculoProfessor[]; total: number }>('/professor/vinculos', opcoes(token)),

  minhasTurmas: (token?: string) => api.get<{ data: MinhaTurmaProfessor[]; total: number }>('/professor/turmas', opcoes(token)),

  estudantesDaTurma: (codigoTurma: string, token?: string) =>
    api.get<{ data: EstudanteDaTurmaProfessor[]; total: number }>(`/professor/turmas/${id(codigoTurma)}/estudantes`, opcoes(token)),

  notasDaTurma: (codigoTurma: string, filtros?: { materia_id?: string; ano_lectivo?: string }, token?: string) =>
    api.get<{ data: NotaConsultaProfessor[]; total: number }>(`/professor/turmas/${id(codigoTurma)}/notas${consulta(filtros)}`, opcoes(token)),

  faltasDaTurma: (codigoTurma: string, filtros?: { materia_id?: string; ano_lectivo?: string }, token?: string) =>
    api.get<{ data: FaltaConsultaProfessor[]; total: number }>(`/professor/turmas/${id(codigoTurma)}/faltas${consulta(filtros)}`, opcoes(token)),
};

function consulta(filtros?: Record<string, string | undefined>): string {
  if (!filtros) return '';
  const q = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  const texto = q.toString();
  return texto ? `?${texto}` : '';
}

/** Encarregado: rotas da própria conta e rotas de academia/estudante ligadas a ele. */
export const encarregadoService = {
  /** GET /encarregado/educandos */
  listarEducandos: (token?: string) => api.get<ListaEducandosResponse>('/encarregado/educandos', opcoes(token)),

  /** PUT /encarregado/educandos/:codigo/relacao */
  atualizarRelacao: (codigoEstudante: string, data: { relacao?: RelacaoEncarregado; relacao_outro?: string }, token?: string) =>
    api.put<{ message: string }, { relacao?: RelacaoEncarregado; relacao_outro?: string }>(`/encarregado/educandos/${id(codigoEstudante)}/relacao`, data, opcoes(token)),

  /** GET /academia/encarregados/buscar — confirma se o encarregado já existe (por telefone ou e-mail). */
  buscar: (filtro: { telefone?: string; email?: string }, token?: string) =>
    api.get<BuscarEncarregadoResponse>(`/academia/encarregados/buscar${consulta(filtro)}`, opcoes(token)),

  /** PUT /academia/estudante/:codigo/encarregado — troca o encarregado (academia, ou secretário com estudantes.dados). */
  trocar: (codigoEstudante: string, encarregado: BlocoEncarregado, token?: string) =>
    api.put<TrocarEncarregadoResponse, { encarregado: BlocoEncarregado }>(`/academia/estudante/${id(codigoEstudante)}/encarregado`, { encarregado }, opcoes(token)),

  /** DELETE /estudante/encarregado — o estudante só se desvincula depois de concluir o nível escolar. */
  desvincularDoEstudante: (token?: string) => api.delete<{ message: string }>('/estudante/encarregado', opcoes(token)),
};

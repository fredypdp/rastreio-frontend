/**
 * No 4.º ano do ensino médio não existem turmas: os estudantes são separados em
 * grupos, cada um com um trabalho de tema próprio. No backend continua a ser o
 * mesmo agregado (Turma, mesmas rotas); só muda a forma de apresentar.
 */
export const NIVEL_GRUPOS = "4_ano_medio";

/** Máximo de caracteres do tema do trabalho (igual ao limite do backend). */
export const TEMA_TRABALHO_MAX = 200;

/** `true` quando o nível é o 4.º ano médio (agrupamento por grupos, não por turmas). */
export function ehGrupo(nivel?: string | null): boolean {
  return (nivel ?? "").trim() === NIVEL_GRUPOS;
}

/** "grupo"/"grupos" ou "turma"/"turmas", conforme o nível e a quantidade. */
export function termoAgrupamento(nivel?: string | null, quantidade = 1): string {
  const base = ehGrupo(nivel) ? "grupo" : "turma";
  return quantidade === 1 ? base : `${base}s`;
}

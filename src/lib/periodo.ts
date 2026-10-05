/**
 * Como escrever "período" nos textos ao utilizador.
 *
 * Regra: em qualquer texto que cite "período" (trimestre ou semestre), o tipo de
 * período vem entre parênteses e é relativo à academia, nunca "trimestre/semestre" cru:
 *   - escola (fundamental e médio) → "período (trimestre)"
 *   - ensino superior              → "período (semestre)"
 * Num mesmo texto basta explicar uma vez; as repetições seguintes podem ficar só "período".
 * Não se aplica ao período do ano letivo (janela de meses), que é outro conceito.
 */

export type TipoEnsinoAcademia = "escola" | "superior";

/** `nivel` do perfil da academia ('escola' | 'superior'); sem valor, assume escola. */
export function tipoEnsinoDaAcademia(nivel?: string | null): TipoEnsinoAcademia {
  return nivel === "superior" ? "superior" : "escola";
}

/** Para o nível de uma turma ('2_ano_superior' → superior; fundamental e médio → escola). */
export function tipoEnsinoDoNivelTurma(nivelTurma?: string | null): TipoEnsinoAcademia {
  return /_ano_superior$/.test((nivelTurma ?? "").trim()) ? "superior" : "escola";
}

/** "trimestre" (escola) ou "semestre" (superior); `plural` acrescenta o "s". */
export function nomeDoPeriodo(tipo: TipoEnsinoAcademia, plural = false): string {
  const base = tipo === "superior" ? "semestre" : "trimestre";
  return plural ? `${base}s` : base;
}

export interface OpcoesPeriodoComTipo {
  /** "períodos (trimestres)" em vez de "período (trimestre)". */
  plural?: boolean;
  /** Primeira letra maiúscula, para rótulos e cabeçalhos ("Período (trimestre)"). */
  maiuscula?: boolean;
}

/** "período (trimestre)" na escola; "período (semestre)" no ensino superior. */
export function periodoComTipo(tipo: TipoEnsinoAcademia, opcoes: OpcoesPeriodoComTipo = {}): string {
  const palavra = opcoes.plural ? "períodos" : "período";
  const inicio = opcoes.maiuscula ? palavra.charAt(0).toUpperCase() + palavra.slice(1) : palavra;
  return `${inicio} (${nomeDoPeriodo(tipo, opcoes.plural)})`;
}

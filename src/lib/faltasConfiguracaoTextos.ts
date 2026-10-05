/**
 * Textos da página /faltas/configuracoes.
 *
 * Regra de escrita: a primeira vez que "período" aparece ligado a falta/nota,
 * vem sempre explicado ("período (trimestre/semestre)"); depois basta "período".
 * Os textos da reprovação por faltas dependem do tipo de academia: a escola
 * (fundamental/médio) usa a nota do professor; o superior usa o exame final.
 */

export type TipoEnsinoAcademia = "escola" | "superior";

/** Primeira citação de "período" em textos de falta/nota. */
export const PERIODO_EXPLICADO = "período (trimestre/semestre)";

/** `nivel` do perfil da academia ('escola' | 'superior'); sem valor, assume escola. */
export function tipoEnsinoDaAcademia(nivel?: string | null): TipoEnsinoAcademia {
  return nivel === "superior" ? "superior" : "escola";
}

export interface TextosReprovacaoPorFaltas {
  /** Frase curta, sempre visível. */
  resumo: string;
  /** Explicações extras, mostradas só em "Saber mais". */
  detalhes: string[];
}

const AVISO_MOMENTO_DO_CALCULO =
  "A regra é aplicada quando a avaliação final é calculada. Avaliações já calculadas não mudam, mesmo que registe mais faltas depois.";

export function textosReprovacaoPorFaltas(tipo: TipoEnsinoAcademia): TextosReprovacaoPorFaltas {
  if (tipo === "superior") {
    return {
      resumo:
        "Quando o estudante ultrapassa o limite de faltas numa matéria, num período, o exame final dessa matéria nesse período passa a valer 0 (zero) no cálculo da avaliação final automática.",
      detalhes: [
        "As outras notas não são afetadas.",
        "Para isso funcionar, a categoria de nota do exame final precisa ter o código exame_final.",
        AVISO_MOMENTO_DO_CALCULO,
      ],
    };
  }
  return {
    resumo:
      "Quando o estudante ultrapassa o limite de faltas numa matéria, num período, a nota do professor dessa matéria nesse período passa a valer 0 (zero) no cálculo da avaliação final automática.",
    detalhes: ["As outras notas não são afetadas.", AVISO_MOMENTO_DO_CALCULO],
  };
}

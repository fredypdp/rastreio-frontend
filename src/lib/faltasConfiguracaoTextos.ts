/**
 * Textos da página /faltas/configuracoes que dependem do tipo de academia.
 * A escola (fundamental/médio) usa a nota do professor; o superior usa o exame final.
 * "Período" segue a regra de `@/lib/periodo` (trimestre na escola, semestre no superior).
 */

import { periodoComTipo, type TipoEnsinoAcademia } from "@/lib/periodo";

export interface TextosReprovacaoPorFaltas {
  /** Frase curta, sempre visível. */
  resumo: string;
  /** Explicações extras, mostradas só em "Saber mais". */
  detalhes: string[];
}

const AVISO_MOMENTO_DO_CALCULO =
  "A regra é aplicada quando a avaliação final é calculada. Avaliações já calculadas não mudam, mesmo que registe mais faltas depois.";

export function textosReprovacaoPorFaltas(tipo: TipoEnsinoAcademia): TextosReprovacaoPorFaltas {
  const periodo = periodoComTipo(tipo);
  if (tipo === "superior") {
    return {
      resumo: `Quando o estudante ultrapassa o limite de faltas numa matéria, num ${periodo}, o exame final dessa matéria nesse período passa a valer 0 (zero) no cálculo da avaliação final automática.`,
      detalhes: [
        "As outras notas não são afetadas.",
        "Para isso funcionar, a categoria de nota do exame final precisa ter o código exame_final.",
        AVISO_MOMENTO_DO_CALCULO,
      ],
    };
  }
  return {
    resumo: `Quando o estudante ultrapassa o limite de faltas numa matéria, num ${periodo}, a nota do professor dessa matéria nesse período passa a valer 0 (zero) no cálculo da avaliação final automática.`,
    detalhes: ["As outras notas não são afetadas.", AVISO_MOMENTO_DO_CALCULO],
  };
}

// src/components/estudante/AvisoExclusaoConta.tsx
'use client';

import React, { useEffect, useState } from 'react';

import { financeiroService } from '@/lib/api';
import type { MensalidadeMesView } from '@/types/api';

const formatarKz = (valor: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valor);

interface AvisoExclusaoContaProps {
  /** Quem vai apagar a conta: o próprio estudante ou a academia dona dele. */
  perspectiva: 'estudante' | 'academia';
  codigoEstudante: string;
  /** Nome da academia onde as dívidas ficam registadas (texto do aviso do estudante). */
  nomeAcademia?: string;
  /** Informa o modal se já pode ativar o botão de confirmar. */
  onPodeConfirmarChange: (pode: boolean) => void;
}

/**
 * Aviso obrigatório antes de apagar uma conta (SEC-15 / 6.5.2).
 *
 * Apagar a conta continua permitido, mas o estudante deixa de poder entrar e,
 * por isso, de consultar ou pagar o que deve; as dívidas ficam registadas na
 * academia. Com mensalidades pendentes o botão só ativa depois de uma caixa de
 * confirmação. Se as mensalidades não puderem ser consultadas, o aviso geral
 * continua visível e a ação não fica bloqueada.
 */
export default function AvisoExclusaoConta({
  perspectiva,
  codigoEstudante,
  nomeAcademia,
  onPodeConfirmarChange,
}: AvisoExclusaoContaProps) {
  // null = ainda a consultar; { pendentes: null } = a consulta falhou.
  // O componente só existe com o modal aberto (o Modal desmonta os filhos ao fechar),
  // por isso cada abertura começa do zero.
  const [resultado, setResultado] = useState<{ pendentes: MensalidadeMesView[] | null } | null>(null);
  const [ciente, setCiente] = useState(false);

  useEffect(() => {
    let cancelado = false;
    financeiroService
      .consultarMensalidadesEstudante(codigoEstudante)
      .then((resposta) => {
        if (cancelado) return;
        setResultado({ pendentes: (resposta.mensalidades ?? []).filter((m) => m.estado === 'pendente') });
      })
      .catch(() => {
        if (!cancelado) setResultado({ pendentes: null });
      });
    return () => {
      cancelado = true;
    };
  }, [codigoEstudante]);

  const carregando = resultado === null;
  const falhou = resultado !== null && resultado.pendentes === null;
  const pendentes = resultado?.pendentes ?? null;

  const quantidade = pendentes?.length ?? 0;
  const total = (pendentes ?? []).reduce((soma, m) => soma + (Number(m.valor) || 0), 0);
  const exigeConfirmacao = quantidade > 0;

  useEffect(() => {
    onPodeConfirmarChange(!carregando && (!exigeConfirmacao || ciente));
  }, [carregando, exigeConfirmacao, ciente, onPodeConfirmarChange]);

  const textoGeral =
    perspectiva === 'estudante'
      ? `Ao apagar a conta deixa de poder entrar no painel e, por isso, de consultar ou pagar as suas dívidas. As dívidas em aberto continuam registadas${nomeAcademia ? ` na academia ${nomeAcademia}` : ' na academia'}. Os registos académicos ficam guardados. Esta ação não pode ser desfeita.`
      : 'O estudante deixa de poder entrar e de pagar. As inscrições ativas em serviços extras serão canceladas. As dívidas em aberto continuam registadas.';

  return (
    <div role="alert" className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <p className="text-sm text-amber-800 dark:text-amber-300">{textoGeral}</p>

      {carregando && <p className="text-sm text-amber-700 dark:text-amber-400">A verificar mensalidades em aberto…</p>}
      {falhou && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Não foi possível verificar as mensalidades em aberto. Confirme-as antes de continuar.
        </p>
      )}
      {!carregando && exigeConfirmacao && (
        <>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Mensalidades em aberto: {quantidade} ({formatarKz(total)}).
          </p>
          <label className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={ciente}
              onChange={(e) => setCiente(e.target.checked)}
            />
            <span>
              {perspectiva === 'estudante'
                ? 'Compreendo que continuo a dever estes valores.'
                : 'Compreendo que estes valores continuam em aberto depois de apagar a conta.'}
            </span>
          </label>
        </>
      )}
    </div>
  );
}

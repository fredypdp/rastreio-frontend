// src/components/estudante/AvisoContaDesvinculada.tsx
import React from 'react';

/**
 * Faixa mostrada ao estudante desvinculado (status 'inativo').
 *
 * O servidor deixa esse estudante consultar tudo (notas, faltas, histórico),
 * pagar o que deve e gerir a conta, mas recusa as demais ações com
 * 403 CONTA_DESVINCULADA (SEC-12). O aviso explica o porquê antes de ele tentar.
 */
export default function AvisoContaDesvinculada() {
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
    >
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Conta desvinculada</p>
      <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
        Neste momento não está vinculado a nenhuma academia. Pode consultar o seu histórico, pagar o que
        estiver em aberto e gerir a sua conta; as restantes ações ficam indisponíveis até pedir a revinculação
        a uma academia.
      </p>
    </div>
  );
}

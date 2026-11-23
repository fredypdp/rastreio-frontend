// src/components/encarregado/BannerEducando.tsx
"use client";

import React from 'react';
import { removeCookie } from '@/lib/utils/cookies';
import { educandoStorage } from '@/lib/utils/educando';
import type { EducandoEncarregado } from '@/types/contas';

/**
 * Faixa fixa do encarregado: lembra em nome de QUEM ele está a agir e, na fase
 * de leitura (o educando concluiu o nível escolar), que só pode consultar notas
 * e faltas do período escolar. "Trocar educando" volta à lista.
 */
export default function BannerEducando({ educando }: { educando: EducandoEncarregado }) {
  const leitura = educando.fase === 'leitura';

  const trocar = () => {
    educandoStorage.clear();
    // Sem o cookie do perfil, o layout volta a buscá-lo (já sem educando) e recarrega.
    removeCookie('user');
    window.location.assign('/encarregado');
  };

  return (
    <div
      role="status"
      className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        leitura
          ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
          : 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300'
      }`}
    >
      <p>
        Agindo em nome de <strong>{educando.nome}</strong> ({educando.codigo_estudante}
        {educando.nome_academia ? ` · ${educando.nome_academia}` : ''}).
        {leitura && ' Este educando concluiu o nível escolar: só é possível consultar as notas e faltas do período escolar.'}
      </p>
      <button
        type="button"
        onClick={trocar}
        className="rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-current hover:bg-white/40"
      >
        Trocar educando
      </button>
    </div>
  );
}

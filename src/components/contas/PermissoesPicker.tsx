// src/components/contas/PermissoesPicker.tsx
"use client";

import React, { useMemo } from 'react';
import type { PermissaoCatalogo } from '@/types/contas';

interface Props {
  catalogo: PermissaoCatalogo[];
  /** Chaves escolhidas (as implicadas entram automaticamente). */
  valor: string[];
  onChange: (chaves: string[]) => void;
  disabled?: boolean;
}

/** Fecho das implicações: gerir → ver. Espelha permissoes.Normalizar do servidor. */
export function expandirImplicadas(catalogo: PermissaoCatalogo[], chaves: string[]): string[] {
  const porChave = new Map(catalogo.map((p) => [p.chave, p]));
  const saida = new Set<string>();
  chaves.forEach((c) => {
    if (!porChave.has(c)) return;
    saida.add(c);
    (porChave.get(c)?.implica ?? []).forEach((i) => saida.add(i));
  });
  return Array.from(saida).sort();
}

/**
 * Seleção das permissões do secretário, agrupada. Marcar "gerir" marca "ver" e
 * trava-o enquanto "gerir" estiver marcado. O servidor valida de novo: chave
 * fora do catálogo é recusada.
 */
export default function PermissoesPicker({ catalogo, valor, onChange, disabled }: Props) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, PermissaoCatalogo[]>();
    catalogo.forEach((p) => mapa.set(p.grupo, [...(mapa.get(p.grupo) ?? []), p]));
    return Array.from(mapa.entries());
  }, [catalogo]);

  const marcadas = useMemo(() => new Set(valor), [valor]);
  // "ver" travado: alguma permissão marcada que o implica.
  const travadas = useMemo(() => {
    const t = new Set<string>();
    catalogo.forEach((p) => {
      if (marcadas.has(p.chave)) (p.implica ?? []).forEach((i) => t.add(i));
    });
    return t;
  }, [catalogo, marcadas]);

  const alternar = (chave: string) => {
    const proximas = new Set(valor);
    if (proximas.has(chave)) proximas.delete(chave);
    else proximas.add(chave);
    onChange(expandirImplicadas(catalogo, Array.from(proximas)));
  };

  const todas = valor.length === catalogo.length;

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
        <input
          type="checkbox"
          checked={todas}
          disabled={disabled}
          onChange={() => onChange(todas ? [] : catalogo.map((p) => p.chave))}
        />
        Todas as permissões
      </label>
      {grupos.map(([grupo, itens]) => (
        <fieldset key={grupo} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{grupo}</legend>
          <div className="space-y-2">
            {itens.map((p) => (
              <label key={p.chave} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marcadas.has(p.chave)}
                  disabled={disabled || travadas.has(p.chave)}
                  onChange={() => alternar(p.chave)}
                />
                <span>
                  <span className="font-medium">{p.rotulo}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{p.descricao}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

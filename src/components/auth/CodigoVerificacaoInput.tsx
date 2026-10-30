"use client";

import React, { useEffect, useRef } from "react";
import { TAMANHO_CODIGO_DOIS_FATORES } from "@/types/dois-fatores";

/** Mantém só dígitos e corta no tamanho do código (aceita colar "123 456"). */
export function somenteDigitosDoCodigo(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, TAMANHO_CODIGO_DOIS_FATORES);
}

interface CodigoVerificacaoInputProps {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
  /** Foca o campo ao aparecer na tela. */
  focarAoMontar?: boolean;
  invalido?: boolean;
}

export default function CodigoVerificacaoInput({
  id,
  value,
  onChange,
  disabled = false,
  focarAoMontar = true,
  invalido = false,
}: CodigoVerificacaoInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focarAoMontar) ref.current?.focus();
  }, [focarAoMontar]);

  return (
    <input
      ref={ref}
      id={id}
      name="codigo"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={TAMANHO_CODIGO_DOIS_FATORES}
      value={value}
      onChange={(e) => onChange(somenteDigitosDoCodigo(e.target.value))}
      disabled={disabled}
      aria-label="Código de verificação de 6 dígitos"
      aria-invalid={invalido}
      placeholder="000000"
      className={`w-full rounded-lg border bg-white px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-gray-800 transition placeholder:text-gray-300 focus:border-transparent focus:outline-none focus:ring-2 disabled:opacity-60 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-600 ${
        invalido
          ? "border-red-300 focus:ring-red-500 dark:border-red-700"
          : "border-gray-300 focus:ring-brand-500 dark:border-gray-700"
      }`}
    />
  );
}

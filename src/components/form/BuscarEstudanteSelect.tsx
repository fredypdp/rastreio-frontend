"use client";

import { useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { useTheme } from "@/context/ThemeContext";
import { consultasService } from "@/lib/api";
import { createStyles, selectThemeColors, type SearchableSelectOption } from "@/components/form/SearchableSelect";

/**
 * Tarefa 111 — busca de estudante por Código/nome/BI/Telefone/E-mail, em
 * vez do padrão anterior (carregar até um limite fixo de estudantes da
 * academia inteira num <select> comum, sem nenhuma forma de busca real —
 * ver AnularReativarObrigacoesForm.tsx e CancelarCobrancaPainel.tsx, os
 * dois lugares onde isso existia). Usa GET /estudantes?busca= (que já
 * casa contra as 5 colunas no backend), com um debounce simples para não
 * disparar uma busca a cada tecla.
 */
export type BuscarEstudanteSelectProps = {
  codigoAcademia: string;
  value: string;
  onChange: (codigoEstudante: string) => void;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
  inputId?: string;
  name?: string;
  error?: string;
};

const CARACTERES_MINIMOS = 2;
const DEBOUNCE_MS = 300;

export default function BuscarEstudanteSelect({
  codigoAcademia,
  value,
  onChange,
  placeholder = "Buscar por código, nome, BI, telefone ou e-mail...",
  isClearable = true,
  isDisabled,
  inputId,
  name,
  error,
}: BuscarEstudanteSelectProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles<string>(selectThemeColors[theme]), [theme]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selecionado, setSelecionado] = useState<SearchableSelectOption<string> | null>(null);

  // O componente guarda a própria opção selecionada (rótulo incluído) —
  // um <AsyncSelect> não tem uma lista de opções pré-carregada de onde
  // derivar isso a partir só do código. Se o valor for limpo por fora
  // (ex.: o formulário reseta), a seleção exibida também precisa limpar;
  // isso é feito durante a própria renderização (padrão documentado pelo
  // React para "ajustar estado quando uma prop muda"), não com um
  // useEffect, que a nova regra de lint do projeto (react-hooks/set-state-
  // in-effect) rejeita para um setState síncrono no corpo do efeito.
  const [valorAnterior, setValorAnterior] = useState(value);
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (!value) setSelecionado(null);
  }

  const loadOptions = (inputValue: string): Promise<SearchableSelectOption<string>[]> =>
    new Promise((resolve) => {
      const termo = inputValue.trim();
      if (termo.length < CARACTERES_MINIMOS || !codigoAcademia) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        resolve([]);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        consultasService.listarEstudantes({ codigo_academia: codigoAcademia, busca: termo, limit: 10, offset: 0 })
          .then((r) => resolve(r.estudantes.map((e) => ({ value: e.codigo_estudante, label: `${e.nome || e.codigo_estudante} (${e.codigo_estudante})` }))))
          .catch(() => resolve([]));
      }, DEBOUNCE_MS);
    });

  return (
    <div className="space-y-1">
      <AsyncSelect<SearchableSelectOption<string>, false>
        inputId={inputId}
        name={name}
        instanceId={inputId ?? name}
        value={selecionado}
        loadOptions={loadOptions}
        onChange={(option) => {
          setSelecionado(option ?? null);
          onChange(option?.value ?? "");
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        styles={styles}
        aria-invalid={!!error}
        cacheOptions
        defaultOptions={false}
        noOptionsMessage={({ inputValue }) => (inputValue.trim().length < CARACTERES_MINIMOS ? `Digite ao menos ${CARACTERES_MINIMOS} caracteres para buscar` : "Nenhum estudante encontrado")}
        loadingMessage={() => "Buscando..."}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

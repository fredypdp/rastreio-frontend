"use client";
import { useState } from "react";
import { academiaService, useApi } from "@/lib/api";
import { useUserCookie } from "@/hooks/useUserCookie";
import SearchableSelect from "@/components/form/SearchableSelect";
import { SectionDescription, SectionTitle } from "@/components/ui/typography/Typography";
import { useEffect } from "react";

/** Peças comuns às telas de Serviços (Transporte e Atividade extracurricular — Parte 7). */

export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const DIAS_SEMANA = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

export const formatarKz = (v: number) =>
  `${new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} Kz`;

/** "Todos os meses", "Janeiro, Março" ou "Nenhum mês". */
export function mesesTexto(meses: number[]): string {
  if (meses.length === 0) return "Nenhum mês";
  if (meses.length === 12) return "Todos os meses";
  return [...meses].sort((a, b) => a - b).map((m) => MESES[m - 1]).join(", ");
}

/** "6:30" → "06:30" (o backend só aceita hh:mm). */
export const horaCompleta = (h: string) => (/^\d:\d{2}$/.test(h) ? `0${h}` : h);

const ANOS_FUNDAMENTAL = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: `${n}_ano_fundamental`, label: `${n}ª Classe` }));
const formatarAnoLabel = (ano: string) =>
  ano.replace(/^(\d+)_ano_(.+)$/, (_, n, tipo) =>
    tipo === "fundamental" ? `${n}ª Classe` : `${n}º Ano ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);

export const botaoOpcaoClasse = (ativo: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
    ativo
      ? "bg-brand-500 text-white border-brand-500"
      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-400"
  }`;

/**
 * Lê um valor em Kz digitado ("15", "15,50", "15.5") e devolve o número ou a
 * mensagem de erro. Recusa — nunca arredonda — mais de 2 casas decimais, zero,
 * negativo e valor acima do teto do banco (mesma regra do servidor).
 */
export function lerValor(texto: string, campo: string): { valor: number; erro?: undefined } | { valor?: undefined; erro: string } {
  const t = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return { erro: `${campo}: informe um valor válido.` };
  if ((t.split(".")[1] ?? "").length > 2) return { erro: `${campo}: use no máximo 2 casas decimais.` };
  const v = Number(t);
  if (!(v > 0)) return { erro: `${campo}: o valor deve ser maior que zero (para não cobrar, marque Gratuito).` };
  if (v > 999999999999.99) return { erro: `${campo}: valor acima do máximo permitido.` };
  return { valor: v };
}

/** Os 12 meses do ano civil, para marcar os meses cobrados. */
export function MesesSelector({ value, onChange, disabled }: { value: number[]; onChange: (m: number[]) => void; disabled?: boolean }) {
  const alternar = (m: number) => onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m].sort((a, b) => a - b));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {MESES.map((nome, i) => (
          <button key={nome} type="button" disabled={disabled} onClick={() => alternar(i + 1)} className={`${botaoOpcaoClasse(value.includes(i + 1))} ${disabled ? "opacity-50" : ""}`}>
            {nome.slice(0, 3)}
          </button>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-3 text-xs">
          <button type="button" className="text-brand-600 dark:text-brand-400" onClick={() => onChange([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}>Marcar todos</button>
          <button type="button" className="text-brand-600 dark:text-brand-400" onClick={() => onChange([])}>Limpar</button>
        </div>
      )}
    </div>
  );
}

/** Botões de escolha única (ex.: Não definido / Gratuito / Com preço). */
export function EscolhaUnica<T extends string>({ value, options, onChange, disabled }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled}
          className={`${botaoOpcaoClasse(value === o.value)} ${disabled ? "opacity-50" : ""}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Lista de problemas de configuração (o que falta para o estudante poder pedir). */
export function ProblemasConfiguracao({ problemas }: { problemas: string[] }) {
  if (problemas.length === 0) return null;
  return (
    <ul className="list-disc space-y-0.5 rounded-lg bg-warning-50 p-3 pl-7 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
      {problemas.map((p) => <li key={p}>{p}</li>)}
    </ul>
  );
}

/**
 * Disponibilidade: para quais anos/cursos o serviço fica disponível. Nada
 * selecionado = todos os estudantes. Fundamental fica em `anos`; médio e
 * superior em `cursos` ("<curso_id>|<ano_academico>").
 */
export function DisponibilidadeServico({ anos, cursos, onChange }: { anos: string[]; cursos: string[]; onChange: (v: { anos: string[]; cursos: string[] }) => void }) {
  const { user } = useUserCookie();
  const cursosApi = useApi(academiaService.listarCursos);
  const [cursoSelecionado, setCursoSelecionado] = useState("");
  useEffect(() => {
    cursosApi.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todosCursos = cursosApi.data?.cursos ?? [];
  const cursosAtivos = todosCursos.filter((c) => c.status === "ativo");
  const nomeCurso = (id: string) => todosCursos.find((c) => c.id === id)?.nome ?? id;
  const cursoEmEdicao = cursosAtivos.find((c) => c.id === cursoSelecionado);
  const anosDaAcademia = user?.academia?.anos_academicos?.filter((a) => a.endsWith("_ano_fundamental")) ?? [];
  const anosOpcoes = ANOS_FUNDAMENTAL.filter((a) => anosDaAcademia.includes(a.value));

  const alternar = (lista: string[], item: string) => (lista.includes(item) ? lista.filter((v) => v !== item) : [...lista, item]);

  return (
    <div className="space-y-3">
      <SectionTitle>Disponibilidade</SectionTitle>
      <SectionDescription>Escolha para quais anos/cursos fica disponível. Nada selecionado = disponível para todos os estudantes.</SectionDescription>
      {anosOpcoes.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Ensino Primário e Iº Ciclo</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {anosOpcoes.map((a) => (
              <button key={a.value} type="button" onClick={() => onChange({ anos: alternar(anos, a.value), cursos })} className={botaoOpcaoClasse(anos.includes(a.value))}>{a.label}</button>
            ))}
          </div>
        </div>
      )}
      {cursosAtivos.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Cursos (Médio / Superior)</SectionTitle>
          <SearchableSelect
            value={cursoSelecionado}
            onChange={(v) => setCursoSelecionado(v || "")}
            options={[{ value: "", label: "Selecione um curso para adicionar anos" }, ...cursosAtivos.map((c) => ({ value: c.id, label: c.nome }))]}
            isClearable={false}
          />
          {cursoEmEdicao && (
            <div className="flex flex-wrap gap-2">
              {cursoEmEdicao.anos_academicos.map((ano) => (
                <button key={ano} type="button" onClick={() => onChange({ anos, cursos: alternar(cursos, `${cursoEmEdicao.id}|${ano}`) })} className={botaoOpcaoClasse(cursos.includes(`${cursoEmEdicao.id}|${ano}`))}>
                  {formatarAnoLabel(ano)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {cursos.length > 0 && (
        <div className="space-y-1">
          <SectionDescription>Anos de curso selecionados:</SectionDescription>
          <div className="flex flex-wrap gap-2">
            {cursos.map((chave) => {
              const [cursoId, ano] = chave.split("|");
              return (
                <span key={chave} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {nomeCurso(cursoId)} · {formatarAnoLabel(ano)}
                  <button type="button" onClick={() => onChange({ anos, cursos: cursos.filter((c) => c !== chave) })} title="Remover">✕</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
      {anosOpcoes.length === 0 && cursosAtivos.length === 0 && (
        <SectionDescription>Nenhum ano acadêmico ou curso configurado ainda — configure em Gerenciamento antes de restringir a disponibilidade.</SectionDescription>
      )}
    </div>
  );
}

"use client";

/**
 * Peças reutilizáveis pelas páginas de /financas/configuracoes, /mensalidade
 * e /taxa-matricula (Tarefa 11 — cada uma dessas telas passou a ser uma
 * página própria em vez de uma subtela dentro de um único componente
 * gigante). Este arquivo concentra o estado e os componentes que mais de
 * uma dessas páginas precisa, para evitar duplicar a mesma lógica em cada
 * page.tsx.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { academiaService, financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserType } from "@/hooks/useRoutePermission";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Checkbox from "@/components/form/input/Checkbox";
import Radio from "@/components/form/input/Radio";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState, METODO_PAGAMENTO_LABEL, NIVEL_LABEL, niveisDaAcademia, ConfirmDialog, ValorKzInput, money } from "@/components/paineis/financeiroShared";
import type { Curso, FinanceiroMetodoPagamento, FinanceiroModoVigencia, FinanceiroNivel, MatriculaConfiguracaoView, MensalidadeConfiguracaoView } from "@/types/api";

export const METODOS: FinanceiroMetodoPagamento[] = ["GPO", "REF", "GPO_QR"];
export const MES_FIM_OPCOES = [
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
];
/** Nomes reais dos meses (pt-AO) — corrige o bug de exibir "Mês 1", "Mês 2"... */
export const MES_NOME_OPCOES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Intl.DateTimeFormat("pt-AO", { month: "long" }).format(new Date(2026, i, 1)),
}));

export function formatarDataHora(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("pt-AO", { dateStyle: "short", timeStyle: "short" }).format(d);
}

/** "6_ano_fundamental" → "6ª Classe"; "2_ano_medio" → "2.º Ano (Médio)". Mesmo padrão usado nas telas de matrícula/turmas. */
export function labelAnoAcademico(codigo: string): string {
  const m = /^(\d+)_ano_(fundamental|medio|superior)$/.exec(codigo);
  if (!m) return codigo;
  const [, numero, nivel] = m;
  if (nivel === "fundamental") return `${numero}ª Classe`;
  if (nivel === "medio") return `${numero}.º Ano (Médio)`;
  return `${numero}.º Ano (Superior)`;
}

export type NivelFormState = {
  nivel: FinanceiroNivel;
  ano_academico: string;
  curso_id: string;
  valor: string;
  metodos_pagamento: FinanceiroMetodoPagamento[];
  modo_vigencia: "" | FinanceiroModoVigencia;
};

export type FormFieldErrors = Partial<Record<"ano_academico" | "curso_id" | "valor" | "modo_vigencia", string>>;

/**
 * Estado e chamadas de API compartilhados por todas as páginas de
 * configurações financeiras (lista de mensalidade, lista de taxa de
 * matrícula, e os formulários de criação de cada uma). Cada página chama
 * este hook de forma independente — como cada uma agora é uma rota própria
 * (Next.js monta cada page.tsx separadamente), isso significa que navegar
 * entre elas refaz essas buscas; é a mesma troca que qualquer conversão de
 * "abas dentro de uma página" para "páginas de verdade" implica, e não é um
 * comportamento novo introduzido por bug — só a página muda de componente.
 */
export function useFinanceiroNivelContext() {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";
  const codigoAcademia = user?.academia?.codigo_academia ?? "";
  const anosAcademicosAcademia = useMemo(() => user?.academia?.anos_academicos ?? [], [user?.academia?.anos_academicos]);
  /** Níveis que a academia realmente oferece — nunca uma lista fixa fundamental/médio/superior. */
  const niveisDisponiveis = useMemo(() => niveisDaAcademia(user?.academia), [user?.academia]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const mensalidadesApi = useApi(financeiroService.listarConfiguracoesMensalidade);
  const matriculasApi = useApi(financeiroService.listarConfiguracoesMatricula);
  const credenciaisApi = useApi(financeiroService.listarCredenciais);

  const reload = async () => {
    if (!codigoAcademia) return;
    await Promise.all([
      mensalidadesApi.execute({ codigo_academia: codigoAcademia }),
      matriculasApi.execute({ codigo_academia: codigoAcademia }),
    ]);
  };

  useEffect(() => {
    if (!loading && isAcademia && codigoAcademia) void reload().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAcademia, codigoAcademia]);

  useEffect(() => {
    if (!isAcademia || !codigoAcademia) { setCursos([]); return; }
    academiaService.listarCursos({ codigo_academia: codigoAcademia })
      .then((r) => setCursos((r.cursos ?? []).filter((c) => c.status === "ativo")))
      .catch(() => setCursos([]));
  }, [isAcademia, codigoAcademia]);

  useEffect(() => {
    if (!isAcademia || !codigoAcademia) return;
    void credenciaisApi.execute({ contexto_tipo: "academia", codigo_academia: codigoAcademia });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAcademia, codigoAcademia]);

  const temCredenciais = (credenciaisApi.data?.length ?? 0) > 0;
  const bloquear = credenciaisApi.loading || !temCredenciais;

  return { user, isAdmin, isAcademia, isFpp, loading, codigoAcademia, anosAcademicosAcademia, niveisDisponiveis, cursos, mensalidadesApi, matriculasApi, reload, bloquear };
}

export type FinanceiroNivelContext = ReturnType<typeof useFinanceiroNivelContext>;

/**
 * Guarda de acesso comum a todas as páginas de configurações financeiras:
 * carregando → aviso de acesso restrito (nem academia nem admin FPP) →
 * mensagem de indisponível para admin FPP. Só quando nenhum desses casos se
 * aplica é que a página real (children) é exibida.
 */
export function FinanceiroAcessoGuard({ ctx, children }: { ctx: FinanceiroNivelContext; children: ReactNode }) {
  if (ctx.loading) return <LoadingState label="Carregando configurações..." />;
  if (!ctx.isAcademia && !ctx.isFpp) return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} message="O módulo financeiro é exclusivo de administradores FPP e academias." />;
  if (ctx.isFpp) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:cog-outline" width={24} className="text-gray-800 dark:text-white/90" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Configurações financeiras</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Propina, matrícula e as demais configurações desta página pertencem a cada academia, não ao administrador —
              indisponível no momento. Ainda não existe nenhuma configuração financeira própria do Spuri.
            </p>
          </div>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}

/** Aviso + atalho para aderir ao Gateway de Pagamento Online, exibido sempre que a academia ainda não tem credenciais AppyPay configuradas. */
export function AvisoCredenciais() {
  return (
    <div className="space-y-3">
      <Alert variant="warning" title="Adesão ao Gateway de Pagamento Online" message="A sua instituição precisa aderir ao Gateway de Pagamento Online." />
      <Link href="/financas/credenciais" className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600">
        Siga as instruções aqui <Icon icon="mdi:arrow-right" width={16} />
      </Link>
    </div>
  );
}

/**
 * Manual de funcionamento — Tarefa 11: cada página passou a ter o seu
 * próprio (em vez de uma única tela genérica de "Regras de funcionamento"
 * compartilhada por tudo). Fica como um painel que se abre/fecha à esquerda
 * — não é mais uma subtela separada, então não precisa de navegação própria.
 * O conteúdo (children) nunca deve usar termos técnicos nem expor detalhes
 * de implementação/back end — só explicar, em linguagem simples, o que a
 * funcionalidade faz do ponto de vista de quem usa.
 */
export function ManualDeFuncionamento({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="flex justify-start">
      <div className="w-full">
        <Button size="sm" variant="outline" onClick={() => setAberto((v) => !v)} startIcon={<Icon icon="mdi:information-outline" width={16} />}>
          Manual de funcionamento
        </Button>
        {aberto && (
          <div className="mt-3 max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function MetodosPagamentoCheckboxes({ kind, selected, onToggle }: { kind: "mensalidade" | "matricula"; selected: FinanceiroMetodoPagamento[]; onToggle: (metodo: FinanceiroMetodoPagamento) => void }) {
  return (
    <div className="flex flex-wrap gap-4">
      {METODOS.map((m) => (
        <Checkbox key={m} id={`${kind}-metodo-${m}`} label={METODO_PAGAMENTO_LABEL[m]} checked={selected.includes(m)} onChange={() => onToggle(m)} />
      ))}
    </div>
  );
}

/** "6_ano_fundamental" → "6ª Classe"; "2_ano_medio" → "2.º Ano" — sem o sufixo "(Médio)"/"(Superior)" de labelAnoAcademico, usado nos cartões de configurações definidas (Tarefa 12) porque lá o nível/curso já aparece no título da secção, tornando o sufixo redundante. */
export function labelAnoAcademicoCurto(codigo: string): string {
  const m = /^(\d+)_ano_(fundamental|medio|superior)$/.exec(codigo);
  if (!m) return codigo;
  const [, numero, nivel] = m;
  return nivel === "fundamental" ? `${numero}ª Classe` : `${numero}.º Ano`;
}

/** Extrai o número inicial de "6_ano_fundamental" para ordenar cartões/linhas por ano — "10_ano_medio" deve vir depois de "9_ano_medio", não antes (ordenação alfabética erraria isso). */
function numeroDoAno(anoAcademico?: string): number {
  const m = /^(\d+)_/.exec(anoAcademico ?? "");
  return m ? Number(m[1]) : 0;
}

export function validarValorEAno(form: NivelFormState, existeConfiguracaoParaEscopo: boolean): FormFieldErrors {
  const errors: FormFieldErrors = {};
  const valorNumero = Number(form.valor);
  if (!form.valor.trim() || !(valorNumero > 0)) errors.valor = "Informe um valor maior que zero.";
  // modo_vigencia só é perguntado (e exigido) quando já existe uma
  // configuração vigente para este escopo — isto é, isto é uma edição. Na
  // primeira configuração de um escopo o campo não muda nada (ver
  // Tarefa 108 do rastreio-backend), então nem perguntamos.
  if (existeConfiguracaoParaEscopo && !form.modo_vigencia) errors.modo_vigencia = "Escolha o que acontece com quem já está pendente.";
  if (form.nivel === "fundamental") {
    if (!form.ano_academico) errors.ano_academico = "Selecione o ano/classe.";
  } else {
    if (!form.curso_id) errors.curso_id = "Selecione o curso.";
    if (!form.ano_academico) errors.ano_academico = "Selecione o ano do curso.";
  }
  return errors;
}

/**
 * true quando já existe, entre `linhas` (as configurações já carregadas —
 * `ctx.mensalidadesApi.data.configuracoes` ou `ctx.matriculasApi.data.configuracoes`),
 * uma configuração vigente para o escopo atualmente selecionado no
 * formulário (mesmo nível + ano_academico, e para médio/superior também o
 * mesmo curso_id). Usado tanto para decidir se a pergunta "o que acontece
 * com quem já está pendente?" aparece, quanto para decidir se a
 * requisição deve ir por POST (criar) ou PUT (atualizar) — a mesma
 * condição decide as duas coisas, por isso ficou centralizada aqui em vez
 * de duplicada nos dois formulários (Tarefa 12).
 */
export function existeConfiguracaoParaEscopo(
  linhas: (MensalidadeConfiguracaoView | MatriculaConfiguracaoView)[],
  form: Pick<NivelFormState, "nivel" | "ano_academico" | "curso_id">
): boolean {
  if (!form.ano_academico) return false;
  if (form.nivel === "fundamental") {
    return linhas.some((l) => l.nivel === "fundamental" && l.ano_academico === form.ano_academico);
  }
  if (!form.curso_id) return false;
  return linhas.some((l) => l.nivel === form.nivel && l.curso_id === form.curso_id && l.ano_academico === form.ano_academico);
}

/**
 * Campos de nível/curso/ano/valor/pendente, compartilhados pelos
 * formulários de criação de mensalidade e de taxa de matrícula — os dois
 * sempre tiveram exatamente os mesmos campos aqui (só o que vem depois, como
 * "Mês de encerramento da cobrança", é exclusivo da mensalidade).
 *
 * Nível só aparece como escolha quando a academia oferece mais de um (ex.:
 * nivel_escolar="misto"). Com um único nível, ele é aplicado direto, sem
 * select. "Ano do curso" só fica habilitável depois que um curso é
 * selecionado (para médio/superior) — fundamental não tem essa restrição
 * porque não depende de curso.
 *
 * `escopoFixo` (Tarefa 12): true quando o formulário foi aberto a partir de
 * "Editar" num cartão de configuração já existente (ver
 * ConfiguracoesDefinidasCards) — nesse caso nível/curso/ano vêm fixos pela
 * URL e são mostrados como texto, não como campos editáveis, porque editar
 * aqui significa mudar o VALOR daquele escopo, não migrar a configuração
 * para outro escopo (isso já é feito criando uma configuração nova).
 *
 * `existeConfiguracaoParaEscopo` decide se a pergunta "o que acontece com
 * quem já está pendente?" aparece — só na edição (ver a função de mesmo
 * nome acima).
 */
export function NivelCamposFields({
  kind, form, errors, setForm, niveisDisponiveis, cursos, anosAcademicosAcademia, escopoFixo = false, existeConfiguracaoParaEscopo: existeConfig,
}: {
  kind: "mensalidade" | "matricula";
  form: NivelFormState;
  errors: FormFieldErrors;
  setForm: (updater: (prev: NivelFormState) => NivelFormState) => void;
  niveisDisponiveis: FinanceiroNivel[];
  cursos: Curso[];
  anosAcademicosAcademia: string[];
  escopoFixo?: boolean;
  existeConfiguracaoParaEscopo: boolean;
}) {
  const cursosDoNivel = (nivel: FinanceiroNivel) => cursos.filter((c) => c.type === nivel);
  const anosDoFormulario = (f: NivelFormState): string[] => {
    if (f.nivel === "fundamental") return anosAcademicosAcademia.filter((a) => a.endsWith("_ano_fundamental"));
    const curso = cursos.find((c) => c.id === f.curso_id);
    return curso?.anos_academicos ?? [];
  };
  const updateNivel = (nivel: FinanceiroNivel) => setForm((prev) => ({ ...prev, nivel, curso_id: "", ano_academico: "" }));

  if (escopoFixo) {
    const cursoNome = form.curso_id ? (cursos.find((c) => c.id === form.curso_id)?.nome ?? form.curso_id) : null;
    return (
      <>
        <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/[0.03]">
          <p className="text-gray-500 dark:text-gray-400">
            Nível: <span className="font-medium text-gray-800 dark:text-white/90">{NIVEL_LABEL[form.nivel]}</span>
          </p>
          {cursoNome && (
            <p className="text-gray-500 dark:text-gray-400">
              Curso: <span className="font-medium text-gray-800 dark:text-white/90">{cursoNome}</span>
            </p>
          )}
          <p className="text-gray-500 dark:text-gray-400">
            {form.nivel === "fundamental" ? "Ano / classe" : "Ano do curso"}: <span className="font-medium text-gray-800 dark:text-white/90">{labelAnoAcademico(form.ano_academico)}</span>
          </p>
        </div>
        <Label>Valor (Kz)</Label>
        <ValorKzInput id={`${kind}-valor`} name={`${kind}-valor`} value={form.valor} onChange={(v) => setForm((prev) => ({ ...prev, valor: v }))} error={!!errors.valor} hint={errors.valor} />
        {existeConfig && (
          <>
            <Label>O que acontece com quem já está pendente?</Label>
            <div className="flex flex-col gap-3">
              <Radio
                id={`${kind}-modo-vigencia-pendentes`}
                name={`${kind}-modo-vigencia`}
                value="cobrancas_pendentes"
                checked={form.modo_vigencia === "cobrancas_pendentes"}
                label={
                  <span>
                    <span className="block font-semibold text-gray-800 dark:text-white/90">Aplicar retroativamente</span>
                    <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
                      {kind === "mensalidade"
                        ? "O novo valor passa a valer também para mensalidades de meses anteriores que já venceram e ainda não foram pagas."
                        : "O novo valor passa a valer também para matrículas já aprovadas que ainda não foram pagas."}
                    </span>
                  </span>
                }
                onChange={() => setForm((prev) => ({ ...prev, modo_vigencia: "cobrancas_pendentes" }))}
              />
              <Radio
                id={`${kind}-modo-vigencia-futuro`}
                name={`${kind}-modo-vigencia`}
                value="a_partir_da_atualizacao"
                checked={form.modo_vigencia === "a_partir_da_atualizacao"}
                label={
                  <span>
                    <span className="block font-semibold text-gray-800 dark:text-white/90">Aplicar só daqui para frente</span>
                    <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
                      {kind === "mensalidade"
                        ? "Quem já está com uma mensalidade pendente continua pagando o valor antigo até quitá-la; o novo valor vale só para cobranças futuras."
                        : "Quem já está com uma matrícula pendente continua pagando o valor antigo até quitá-la; o novo valor vale só para matrículas aprovadas a partir de agora."}
                    </span>
                  </span>
                }
                onChange={() => setForm((prev) => ({ ...prev, modo_vigencia: "a_partir_da_atualizacao" }))}
              />
            </div>
            {errors.modo_vigencia && <p className="text-sm text-error-500 dark:text-error-400">{errors.modo_vigencia}</p>}
          </>
        )}
      </>
    );
  }

  return (
    <>
      {niveisDisponiveis.length > 1 ? (
        <>
          <Label>Nível</Label>
          <SearchableSelect
            value={form.nivel}
            options={niveisDisponiveis.map((n) => ({ value: n, label: NIVEL_LABEL[n] }))}
            onChange={(v) => updateNivel((v || niveisDisponiveis[0]) as FinanceiroNivel)}
            isSearchable={false}
            isClearable={false}
            inputId={`${kind}-nivel`}
            name={`${kind}-nivel`}
          />
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nível: <span className="font-medium text-gray-800 dark:text-white/90">{NIVEL_LABEL[form.nivel]}</span></p>
      )}
      {form.nivel !== "fundamental" && (
        <>
          <Label>Curso</Label>
          <SearchableSelect
            value={form.curso_id}
            options={cursosDoNivel(form.nivel).map((c) => ({ value: c.id, label: c.nome }))}
            onChange={(v) => setForm((prev) => ({ ...prev, curso_id: v, ano_academico: "" }))}
            placeholder={cursosDoNivel(form.nivel).length ? "Selecione um curso" : "Nenhum curso cadastrado para este nível"}
            isClearable
            inputId={`${kind}-curso`}
            name={`${kind}-curso`}
            error={errors.curso_id}
          />
        </>
      )}
      <Label>{form.nivel === "fundamental" ? "Ano / classe" : "Ano do curso"}</Label>
      <SearchableSelect
        value={form.ano_academico}
        options={anosDoFormulario(form).map((a) => ({ value: a, label: labelAnoAcademico(a) }))}
        onChange={(v) => setForm((prev) => ({ ...prev, ano_academico: v }))}
        placeholder={anosDoFormulario(form).length ? "Selecione o ano" : "Selecione um curso primeiro"}
        isDisabled={form.nivel !== "fundamental" && !form.curso_id}
        isClearable
        inputId={`${kind}-ano-academico`}
        name={`${kind}-ano-academico`}
        error={errors.ano_academico}
      />
      <Label>Valor (Kz)</Label>
      <ValorKzInput
        id={`${kind}-valor`}
        name={`${kind}-valor`}
        value={form.valor}
        onChange={(v) => setForm((prev) => ({ ...prev, valor: v }))}
        error={!!errors.valor}
        hint={errors.valor}
      />
      {existeConfig && (
        <>
          <Label>O que acontece com quem já está pendente?</Label>
          <div className="flex flex-col gap-3">
            <Radio
              id={`${kind}-modo-vigencia-pendentes`}
              name={`${kind}-modo-vigencia`}
              value="cobrancas_pendentes"
              checked={form.modo_vigencia === "cobrancas_pendentes"}
              label={
                <span>
                  <span className="block font-semibold text-gray-800 dark:text-white/90">Aplicar retroativamente</span>
                  <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
                    {kind === "mensalidade"
                      ? "O novo valor passa a valer também para mensalidades de meses anteriores que já venceram e ainda não foram pagas."
                      : "O novo valor passa a valer também para matrículas já aprovadas que ainda não foram pagas."}
                  </span>
                </span>
              }
              onChange={() => setForm((prev) => ({ ...prev, modo_vigencia: "cobrancas_pendentes" }))}
            />
            <Radio
              id={`${kind}-modo-vigencia-futuro`}
              name={`${kind}-modo-vigencia`}
              value="a_partir_da_atualizacao"
              checked={form.modo_vigencia === "a_partir_da_atualizacao"}
              label={
                <span>
                  <span className="block font-semibold text-gray-800 dark:text-white/90">Aplicar só daqui para frente</span>
                  <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
                    {kind === "mensalidade"
                      ? "Quem já está com uma mensalidade pendente continua pagando o valor antigo até quitá-la; o novo valor vale só para cobranças futuras."
                      : "Quem já está com uma matrícula pendente continua pagando o valor antigo até quitá-la; o novo valor vale só para matrículas aprovadas a partir de agora."}
                  </span>
                </span>
              }
              onChange={() => setForm((prev) => ({ ...prev, modo_vigencia: "a_partir_da_atualizacao" }))}
            />
          </div>
          {errors.modo_vigencia && <p className="text-sm text-error-500 dark:text-error-400">{errors.modo_vigencia}</p>}
        </>
      )}
    </>
  );
}

/** Chave estável para identificar qual linha está com remoção em andamento (desabilita só o botão daquela linha). */
function configKey(kind: "mensalidade" | "matricula", c: { nivel: string; ano_academico?: string; curso_id?: string }) {
  return `${kind}|${c.nivel}|${c.ano_academico ?? ""}|${c.curso_id ?? ""}`;
}

type ConfigRow = MensalidadeConfiguracaoView | MatriculaConfiguracaoView;

/** Agrupa as configurações em secções para exibição em cartões (Tarefa 12): uma secção "Ensino Primário e Iº Ciclo" (todo o fundamental junto) e uma secção por curso para médio/superior. */
function agruparEmSecoes(linhas: ConfigRow[], cursos: Curso[]): { titulo: string; linhas: ConfigRow[] }[] {
  const secoes: { titulo: string; linhas: ConfigRow[] }[] = [];
  const fundamental = linhas.filter((l) => l.nivel === "fundamental").sort((a, b) => numeroDoAno(a.ano_academico) - numeroDoAno(b.ano_academico));
  if (fundamental.length > 0) secoes.push({ titulo: "Ensino Primário e Iº Ciclo", linhas: fundamental });

  const porCurso = new Map<string, ConfigRow[]>();
  for (const l of linhas) {
    if (l.nivel === "fundamental" || !l.curso_id) continue;
    if (!porCurso.has(l.curso_id)) porCurso.set(l.curso_id, []);
    porCurso.get(l.curso_id)!.push(l);
  }
  for (const [cursoId, rows] of porCurso) {
    const nome = cursos.find((c) => c.id === cursoId)?.nome ?? "Curso";
    secoes.push({ titulo: nome, linhas: rows.sort((a, b) => numeroDoAno(a.ano_academico) - numeroDoAno(b.ano_academico)) });
  }
  return secoes;
}

/**
 * Substitui a antiga "Configurações já feitas" (Tarefa 12): em vez de uma
 * tabela crua, cartões "{ano/classe} - {valor} Kz" agrupados por secção
 * (fundamental junto; médio/superior um bloco por curso), clicáveis — abrem
 * uma subtela de detalhe com "Editar" (leva ao formulário de criação com o
 * escopo pré-preenchido e travado — ver NivelCamposFields escopoFixo) e
 * "Remover" (mesmo fluxo de confirmação que já existia na tabela).
 */
export function ConfiguracoesDefinidasCards({
  linhas, comMesFim, kind, cursos, codigoAcademia, reload, onAlert,
}: {
  linhas: ConfigRow[];
  comMesFim: boolean;
  kind: "mensalidade" | "matricula";
  cursos: Curso[];
  codigoAcademia: string;
  reload: () => Promise<void>;
  onAlert: (a: { variant: "success" | "error"; message: string } | null) => void;
}) {
  const removerMensalidade = useApi(financeiroService.removerConfiguracaoMensalidade);
  const removerMatricula = useApi(financeiroService.removerConfiguracaoMatricula);
  const [removendo, setRemovendo] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const [selecionada, setSelecionada] = useState<ConfigRow | null>(null);

  const labelEscopo = (c: { ano_academico?: string; curso_id?: string }) =>
    c.ano_academico ? labelAnoAcademico(c.ano_academico) : (cursos.find((cu) => cu.id === c.curso_id)?.nome ?? "este escopo");

  const criarHref = (c: ConfigRow) => {
    const qs = new URLSearchParams({ nivel: c.nivel, ...(c.ano_academico ? { ano_academico: c.ano_academico } : {}), ...(c.curso_id ? { curso_id: c.curso_id } : {}) });
    return `/financas/configuracoes/${kind === "mensalidade" ? "mensalidade" : "taxa-matricula"}/criar?${qs.toString()}`;
  };

  const onRemover = async () => {
    if (!selecionada) return;
    onAlert(null);
    setRemovendo(true);
    try {
      const executar = kind === "mensalidade" ? removerMensalidade.execute : removerMatricula.execute;
      await executar({ codigo_academia: codigoAcademia, nivel: selecionada.nivel, ano_academico: selecionada.ano_academico, curso_id: selecionada.curso_id });
      onAlert({ variant: "success", message: kind === "mensalidade" ? "Configuração de mensalidade removida com sucesso." : "Configuração de matrícula removida com sucesso." });
      setSelecionada(null);
      await reload();
    } catch (err) {
      onAlert({ variant: "error", message: formatApiError(err, `Não foi possível remover a configuração de ${kind === "mensalidade" ? "mensalidade" : "matrícula"}.`) });
    } finally {
      setRemovendo(false);
      setConfirmarRemocao(false);
    }
  };

  if (linhas.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma configuração salva ainda.</p>;
  }

  if (selecionada) {
    return (
      <div className="space-y-4">
        {confirmarRemocao && (
          <ConfirmDialog
            title={kind === "mensalidade" ? "Remover configuração de propina" : "Remover taxa de matrícula"}
            message={
              kind === "mensalidade"
                ? `Tem certeza que deseja remover a configuração de propina de ${NIVEL_LABEL[selecionada.nivel]} — ${labelEscopo(selecionada)}? Meses já cobrados não são afetados; a partir de agora, novas mensalidades desse escopo ficam sem valor definido até configurar de novo.`
                : `Tem certeza que deseja remover a configuração de taxa de matrícula de ${NIVEL_LABEL[selecionada.nivel]} — ${labelEscopo(selecionada)}? A matrícula volta a ser gratuita para este escopo até configurar de novo.`
            }
            confirmLabel="Remover"
            onConfirm={onRemover}
            onClose={() => setConfirmarRemocao(false)}
          />
        )}
        <button type="button" onClick={() => setSelecionada(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Icon icon="mdi:arrow-left" width={16} /> Voltar
        </button>
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{NIVEL_LABEL[selecionada.nivel]} — {labelEscopo(selecionada)}</h3>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500 dark:text-gray-400">Valor</dt><dd className="font-medium text-gray-800 dark:text-white/90">{money(selecionada.valor)}</dd></div>
            {comMesFim && "mes_fim_cobranca" in selecionada && (
              <div><dt className="text-gray-500 dark:text-gray-400">Mês de encerramento da cobrança</dt><dd className="font-medium text-gray-800 dark:text-white/90">{selecionada.mes_fim_cobranca === 6 ? "Junho" : "Julho"}</dd></div>
            )}
            <div><dt className="text-gray-500 dark:text-gray-400">Métodos de pagamento</dt><dd className="font-medium text-gray-800 dark:text-white/90">{selecionada.metodos_pagamento.map((m) => METODO_PAGAMENTO_LABEL[m]).join(", ") || "Nenhum"}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Vigente desde</dt><dd className="font-medium text-gray-800 dark:text-white/90">{formatarDataHora(selecionada.vigente_em)}</dd></div>
          </dl>
          <div className="flex gap-2 pt-2">
            <Link href={criarHref(selecionada)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
              <Icon icon="mdi:pencil-outline" width={16} /> Editar
            </Link>
            <Button size="sm" variant="danger" disabled={removendo} onClick={() => setConfirmarRemocao(true)} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
              {removendo ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {agruparEmSecoes(linhas, cursos).map((secao) => (
        <div key={secao.titulo} className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{secao.titulo}</h4>
          <div className="flex flex-wrap gap-3">
            {secao.linhas.map((c) => (
              <button
                key={configKey(kind, c)}
                type="button"
                onClick={() => setSelecionada(c)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm shadow-theme-xs transition hover:border-brand-400 hover:shadow-theme-sm dark:border-white/[0.05] dark:bg-white/[0.03] dark:hover:border-brand-400"
              >
                <span className="font-medium text-gray-800 dark:text-white/90">{labelAnoAcademicoCurto(c.ano_academico ?? "")} - {money(c.valor)}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

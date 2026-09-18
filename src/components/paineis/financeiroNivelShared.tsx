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

export function validarValorEAno(form: NivelFormState): FormFieldErrors {
  const errors: FormFieldErrors = {};
  const valorNumero = Number(form.valor);
  if (!form.valor.trim() || !(valorNumero > 0)) errors.valor = "Informe um valor maior que zero.";
  if (!form.modo_vigencia) errors.modo_vigencia = "Escolha o que acontece com quem já está pendente.";
  if (form.nivel === "fundamental") {
    if (!form.ano_academico) errors.ano_academico = "Selecione o ano/classe.";
  } else {
    if (!form.curso_id) errors.curso_id = "Selecione o curso.";
    if (!form.ano_academico) errors.ano_academico = "Selecione o ano do curso.";
  }
  return errors;
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
 */
export function NivelCamposFields({
  kind, form, errors, setForm, niveisDisponiveis, cursos, anosAcademicosAcademia,
}: {
  kind: "mensalidade" | "matricula";
  form: NivelFormState;
  errors: FormFieldErrors;
  setForm: (updater: (prev: NivelFormState) => NivelFormState) => void;
  niveisDisponiveis: FinanceiroNivel[];
  cursos: Curso[];
  anosAcademicosAcademia: string[];
}) {
  const cursosDoNivel = (nivel: FinanceiroNivel) => cursos.filter((c) => c.type === nivel);
  const anosDoFormulario = (f: NivelFormState): string[] => {
    if (f.nivel === "fundamental") return anosAcademicosAcademia.filter((a) => a.endsWith("_ano_fundamental"));
    const curso = cursos.find((c) => c.id === f.curso_id);
    return curso?.anos_academicos ?? [];
  };
  const updateNivel = (nivel: FinanceiroNivel) => setForm((prev) => ({ ...prev, nivel, curso_id: "", ano_academico: "" }));

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
  );
}

/** Chave estável para identificar qual linha está com remoção em andamento (desabilita só o botão daquela linha). */
function configKey(kind: "mensalidade" | "matricula", c: { nivel: string; ano_academico?: string; curso_id?: string }) {
  return `${kind}|${c.nivel}|${c.ano_academico ?? ""}|${c.curso_id ?? ""}`;
}

/**
 * Tabela de "Configurações já feitas", exibida na página de listagem de
 * mensalidade/taxa de matrícula — substitui a antiga tela separada de
 * "Histórico de versões", que não existe mais.
 */
export function ConfiguracoesSalvasTable({
  linhas, comMesFim, kind, cursos, codigoAcademia, reload, onAlert,
}: {
  linhas: (MensalidadeConfiguracaoView | MatriculaConfiguracaoView)[];
  comMesFim: boolean;
  kind: "mensalidade" | "matricula";
  cursos: Curso[];
  codigoAcademia: string;
  reload: () => Promise<void>;
  onAlert: (a: { variant: "success" | "error"; message: string } | null) => void;
}) {
  const removerMensalidade = useApi(financeiroService.removerConfiguracaoMensalidade);
  const removerMatricula = useApi(financeiroService.removerConfiguracaoMatricula);
  const [removendoConfig, setRemovendoConfig] = useState<string | null>(null);
  const [configParaRemover, setConfigParaRemover] = useState<{ nivel: FinanceiroNivel; ano_academico?: string; curso_id?: string } | null>(null);

  const labelEscopo = (c: { ano_academico?: string; curso_id?: string }) =>
    c.ano_academico ? labelAnoAcademico(c.ano_academico) : (cursos.find((cu) => cu.id === c.curso_id)?.nome ?? "este escopo");

  const onRemover = async (c: { nivel: FinanceiroNivel; ano_academico?: string; curso_id?: string }) => {
    onAlert(null);
    setRemovendoConfig(configKey(kind, c));
    try {
      const executar = kind === "mensalidade" ? removerMensalidade.execute : removerMatricula.execute;
      await executar({ codigo_academia: codigoAcademia, nivel: c.nivel, ano_academico: c.ano_academico, curso_id: c.curso_id });
      onAlert({ variant: "success", message: kind === "mensalidade" ? "Configuração de mensalidade removida com sucesso." : "Configuração de matrícula removida com sucesso." });
      await reload();
    } catch (err) {
      onAlert({ variant: "error", message: formatApiError(err, `Não foi possível remover a configuração de ${kind === "mensalidade" ? "mensalidade" : "matrícula"}.`) });
    } finally {
      setRemovendoConfig(null);
    }
  };

  if (linhas.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma configuração salva ainda.</p>;
  }

  return (
    <div className="overflow-x-auto">
      {configParaRemover && (
        <ConfirmDialog
          title={kind === "mensalidade" ? "Remover configuração de propina" : "Remover taxa de matrícula"}
          message={
            kind === "mensalidade"
              ? `Tem certeza que deseja remover a configuração de propina de ${NIVEL_LABEL[configParaRemover.nivel]} — ${labelEscopo(configParaRemover)}? Meses já cobrados não são afetados; a partir de agora, novas mensalidades desse escopo ficam sem valor definido até configurar de novo.`
              : `Tem certeza que deseja remover a configuração de taxa de matrícula de ${NIVEL_LABEL[configParaRemover.nivel]} — ${labelEscopo(configParaRemover)}? A matrícula volta a ser gratuita para este escopo até configurar de novo.`
          }
          confirmLabel="Remover"
          onConfirm={() => onRemover(configParaRemover)}
          onClose={() => setConfigParaRemover(null)}
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {["Nível", "Ano/Curso", "Valor", ...(comMesFim ? ["Fim"] : []), "Métodos", "Vigente em", ""].map((h) => (
              <TableCell key={h || "acoes"} isHeader className="px-3 py-2 text-xs uppercase text-gray-500 dark:text-gray-400">{h}</TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((c, i) => {
            const key = configKey(kind, c);
            return (
              <TableRow key={i}>
                <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300">{NIVEL_LABEL[c.nivel]}</TableCell>
                <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300">{c.ano_academico ? labelAnoAcademico(c.ano_academico) : (cursos.find((cu) => cu.id === c.curso_id)?.nome ?? c.curso_id ?? "—")}</TableCell>
                <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300">{money(c.valor)}</TableCell>
                {comMesFim && (
                  <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    {"mes_fim_cobranca" in c ? (c.mes_fim_cobranca === 6 ? "Junho" : c.mes_fim_cobranca === 7 ? "Julho" : c.mes_fim_cobranca) : "—"}
                  </TableCell>
                )}
                <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300">{c.metodos_pagamento.map((m) => METODO_PAGAMENTO_LABEL[m]).join(", ")}</TableCell>
                <TableCell className="px-3 py-2 text-gray-700 dark:text-gray-300">{formatarDataHora(c.vigente_em)}</TableCell>
                <TableCell className="px-3 py-2">
                  <Button size="sm" variant="danger" disabled={removendoConfig === key} onClick={() => setConfigParaRemover(c)} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
                    {removendoConfig === key ? "Removendo..." : "Remover"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

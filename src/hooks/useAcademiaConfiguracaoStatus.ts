"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { academiaService } from "@/lib/api/services";
import { tokenStorage } from "@/lib/api";
import { useUserType } from "@/hooks/useRoutePermission";
import type { ConfiguracaoStatusResponse } from "@/types/api";

export type ConfiguracaoGuiaStepId = "email-verificacao" | "ano-letivo" | "cursos" | "materias" | "categorias-superiores" | "regras-superiores" | "turmas" | "estudantes" | "estudantes-turmas";

export interface ConfiguracaoGuiaStep {
  id: ConfiguracaoGuiaStepId;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  unlocked: boolean;
  current: boolean;
  details: string;
}

// NOTE: toda a lógica de cálculo de cobertura (matérias/turmas por ano
// acadêmico, existência de estudante por nível etc.) que antes vivia aqui
// (hasAnoLetivo/asArray/active/includes/hasStudentsInInstitutionLevels e os
// helpers hasFundamentalCoverage/hasCourseCoverage dentro de buildSteps) foi
// movida para o back end (GET /academia/configuracao-status). O front end
// agora só lê os booleanos/contagens já prontos e monta os mesmos 9 passos,
// com o MESMO texto, MESMA ordem e MESMA regra de desbloqueio sequencial de
// sempre — só a fonte do "completed"/"details" mudou.
function buildSteps(status: ConfiguracaoStatusResponse | null, nivel?: string, nivelEscolar?: string, emailVerificado = false, email?: string): ConfiguracaoGuiaStep[] {
  const s = status?.steps;
  const needsCourses = nivel === "superior" || (nivel === "escola" && ["medio", "misto"].includes(nivelEscolar ?? ""));

  const base = (id: ConfiguracaoGuiaStepId, title: string, description: string, href: string, completed: boolean, details: string): ConfiguracaoGuiaStep => ({ id, title, description, href, completed, details, unlocked: false, current: false });

  const anoLetivoCompleted = Boolean(s?.["ano-letivo"]?.completed);
  const cursosTotalAtivos = s?.cursos?.total_ativos ?? 0;
  const materiasCompleted = Boolean(s?.materias?.completed);
  const turmasCompleted = Boolean(s?.turmas?.completed);
  const estudantesTotal = s?.estudantes?.total ?? 0;
  const estudantesCompleted = Boolean(s?.estudantes?.completed);
  const estudantesTurmasCompleted = Boolean(s?.["estudantes-turmas"]?.completed);

  const steps: ConfiguracaoGuiaStep[] = [
    base(
      "email-verificacao",
      "Verificar e-mail",
      "Envie o e-mail de verificação para confirmar o endereço da instituição antes de continuar.",
      "",
      emailVerificado,
      emailVerificado
        ? "E-mail da instituição verificado."
        : email
          ? `Será enviado um link de verificação para ${email}.`
          : "Cadastre um e-mail para a instituição antes de solicitar a verificação.",
    ),
    base("ano-letivo", "Definir ano letivo", "Ative o primeiro ciclo letivo da instituição.", "/configuracoes/ano-letivo", anoLetivoCompleted, anoLetivoCompleted ? "Ano letivo ativo encontrado." : "Nenhum ano letivo ativo encontrado."),
  ];
  if (needsCourses) steps.push(base("cursos", "Criar cursos", "Cadastre os cursos da sua instituição", "/gerenciamento/cursos", cursosTotalAtivos > 0, `${cursosTotalAtivos} curso(s) ativo(s).`));
  steps.push(base("materias", "Criar matérias disciplinares", "Garanta matérias disciplinares para cada ano acadêmico ofertado.", "/gerenciamento/materias-disciplinares", materiasCompleted, "Cobertura exigida para cada ano ofertado e, no superior, para cada período do curso."));
  if (nivel === "superior") {
    const categoriasCompleted = Boolean(s?.["categorias-superiores"]?.completed);
    const regrasTotalAtivas = s?.["regras-superiores"]?.total_ativas ?? 0;
    steps.push(base("categorias-superiores", "Criar categorias de nota", "Configure categorias para todos os anos acadêmicos superiores em uso.", "/configuracoes/regras-avaliacao-final", categoriasCompleted, "Cobertura exigida por ano acadêmico."));
    steps.push(base("regras-superiores", "Criar regras de avaliação final", "Cadastre ao menos uma regra superior ativa.", "/configuracoes/regras-avaliacao-final", regrasTotalAtivas > 0, `${regrasTotalAtivas} regra(s) ativa(s).`));
  }
  steps.push(
    base("turmas", "Criar turmas", "Crie turmas ativas para cada ano acadêmico ofertado, exceto o 4º ano médio.", "/gerenciamento/turmas", turmasCompleted, "Cobertura exigida para cada ano ofertado, exceto o 4º ano médio."),
    base("estudantes", "Cadastrar estudantes ou aprovar solicitações de matrícula", "Tenha ao menos um estudante cadastrado em cada nível da instituição", "/estudantes/cadastrar", estudantesCompleted, `${estudantesTotal} estudante(s) encontrado(s), sem filtro de status.`),
    base("estudantes-turmas", "Adicionar estudantes às turmas", "Para cada ano acadêmico da sua instituição, exceto o 4º ano médio, vincule pelo menos um estudante a uma turma.", "/gerenciamento/turmas", estudantesTurmasCompleted, "Cobertura exigida para cada ano ofertado, exceto o 4º ano médio."),
  );

  let previousCompleted = true;
  let currentAssigned = false;
  return steps.map((step) => {
    const unlocked = previousCompleted;
    const current = unlocked && !step.completed && !currentAssigned;
    if (current) currentAssigned = true;
    previousCompleted = previousCompleted && step.completed;
    return { ...step, unlocked, current };
  });
}

export function useAcademiaConfiguracaoStatus() {
  const { user, isAcademia } = useUserType();
  const [status, setStatus] = useState<ConfiguracaoStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const nivel = user?.academia?.nivel;
  const nivelEscolar = user?.academia?.nivel_escolar;

  const reload = useCallback(async () => {
    if (!isAcademia || !nivel) return;
    setLoading(true); setError(null);
    const token = tokenStorage.get() || undefined;
    try {
      const response = await academiaService.getConfiguracaoStatus(token);
      setStatus(response);
    } catch (err) { setError(err instanceof Error ? err : new Error("Não foi possível carregar o guia.")); }
    finally { setLoading(false); }
  }, [isAcademia, nivel]);

  useEffect(() => { reload(); }, [reload]);
  const steps = useMemo(() => buildSteps(status, nivel, nivelEscolar, Boolean(user?.academia?.email_verificado), user?.academia?.email), [status, nivel, nivelEscolar, user?.academia?.email, user?.academia?.email_verificado]);
  const completedCount = steps.filter((step) => step.completed).length;
  return { steps, completedCount, totalCount: steps.length, nextStep: steps.find((step) => step.current) ?? null, loading, error, retry: reload, mutate: reload };
}

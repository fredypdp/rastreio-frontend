# Tarefa para o Codex — Repositório `rastreio-frontend`

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Pré-requisito:** esta tarefa assume que a tarefa do backend (`GET /academia/configuracao-status`, documento separado, repositório `rastreio-backend`) já foi implementada e mergeada. Se o endpoint ainda não existir no backend, esta tarefa pode ser feita mesmo assim (o front end só vai receber erro 404 até o backend estar pronto), mas não faça deploy antes do backend estar no ar.
**Execução:** Não é necessário planejar nada. Todo o código já está escrito e validado abaixo (`tsc --noEmit` e `eslint` reais do próprio projeto, ver seção seguinte). Siga os passos na ordem e cole os trechos indicados literalmente. Se algum trecho não bater 100% com o que está no repositório, **PARE e reporte a diferença em vez de improvisar.**

---

## Contexto do problema

O hook `src/hooks/useAcademiaConfiguracaoStatus.ts` (usado por `GuiaConfiguracoesSection.tsx` e por `PainelDashboard.tsx`) hoje faz **até 8 chamadas HTTP em paralelo** (`getAnoLetivo`, `listarAnosAcademicos`, `listarCursos`, `listarMaterias`, `listarTurmas`, `listarEstudantes`, `listarCategoriasNota`, `listarRegrasAvaliacaoFinal`) e só depois calcula, no navegador, quais dos 9 passos do "Guia de Configuração" estão completos.

**Objetivo desta tarefa:** trocar essas 8 chamadas por **uma única chamada** a `GET /academia/configuracao-status` (que já devolve pronto o que está completo). **A UI/UX não muda em nada** — mesmos títulos, mesmas descrições, mesma ordem dos passos, mesmo texto de detalhe, mesma regra de "passo bloqueado até o anterior ser concluído". Só a fonte de dados muda.

**Esta tarefa mexe SOMENTE no frontend.** Não altere nada no repositório `rastreio-backend`.

---

## O que já foi validado antes de escrever esta tarefa (leia antes de começar)

Diferente de uma tarefa comum, aqui as três mudanças de código abaixo (tipo em `types/api.ts`, método em `services.ts`, e o hook inteiro reescrito) **já foram aplicadas e testadas de verdade** em uma cópia do repositório, com o ambiente completo:

1. `npm install` rodado com sucesso (803 pacotes, sem erro).
2. `npx tsc --noEmit` rodado no **projeto inteiro**, com o `tsconfig.json` real do repositório (modo `strict: true`) — **zero erros**, incluindo o arquivo novo/alterado.
3. `npx eslint` rodado nos três arquivos alterados — **zero avisos/erros**.

Ou seja: o que está descrito abaixo não é uma sugestão a ser adaptada — é código que já compila e passa lint no projeto real. Sua parte é aplicar exatamente isso, mais os passos de verificação no final (que você deve rodar de novo no seu próprio ambiente para confirmar).

Também vale registrar uma checagem de comportamento que fiz antes de escrever isto: os dois componentes que consomem este hook (`PainelDashboard.tsx` e `GuiaConfiguracoesSection.tsx`) só usam os campos `steps`, `completedCount`, `totalCount`, `nextStep`, `loading`, `error`, `retry` do retorno do hook — nenhum deles acessa o estado interno (`raw`/`RawStatus`) que está sendo removido. Por isso a assinatura de retorno do hook não muda, e nenhum desses dois componentes precisa ser tocado.

---

## Passo 1 — Adicionar o tipo de resposta em `src/types/api.ts`

Localize a interface `AnoLetivoResponse` (marcada como `@deprecated`, logo depois de `AnoLetivoAcademiaResponse`). Logo depois dela, adicione:

```typescript
/** GET /academia/configuracao-status */
export interface ConfiguracaoStatusResponse {
  steps: {
    'ano-letivo': { completed: boolean };
    cursos?: { completed: boolean; total_ativos: number };
    materias: { completed: boolean };
    'categorias-superiores'?: { completed: boolean };
    'regras-superiores'?: { completed: boolean; total_ativas: number };
    turmas: { completed: boolean };
    estudantes: { completed: boolean; total: number };
    'estudantes-turmas': { completed: boolean };
  };
}
```

(`cursos`, `categorias-superiores` e `regras-superiores` são opcionais porque o backend só os inclui quando fazem sentido para o nível da academia — ver documento da tarefa do backend.)

---

## Passo 2 — Adicionar o método `getConfiguracaoStatus` em `src/lib/api/services.ts`

**2a.** No bloco de `import type { ... } from '@/types/api'` no topo do arquivo, localize a linha `AnoLetivoAcademiaResponse,` e adicione logo depois:

```typescript
  ConfiguracaoStatusResponse,
```

**2b.** Localize a constante `const ACADEMIA_ANO_LETIVO_ENDPOINT = '/academia/ano-letivo';` e adicione logo depois:

```typescript
const ACADEMIA_CONFIGURACAO_STATUS_ENDPOINT = '/academia/configuracao-status';
```

**2c.** Dentro do objeto `academiaService`, localize o método `getAnoLetivo` (ele tem esta forma exata):

```typescript
  getAnoLetivo: (params?: { codigo_academia?: string; token?: string } | string) => {
    const isLegacy = typeof params === 'string' || params === undefined;
    const tok      = isLegacy ? (params as string | undefined) : params?.token;
    const codigo   = isLegacy ? undefined : params?.codigo_academia;
    const qs       = codigo ? `?codigo_academia=${encodeURIComponent(codigo)}` : '';
    return api.get<AnoLetivoAcademiaResponse>(`${ACADEMIA_ANO_LETIVO_ENDPOINT}${qs}`, {
      token: tok || tokenStorage.get() || undefined,
    });
  },
```

Logo depois desse método (mesmo objeto `academiaService`), adicione:

```typescript
  // GET /academia/configuracao-status
  // Consolida em uma única chamada o status de cada passo do Guia de
  // Configuração (o que já foi configurado e o que falta), evitando que o
  // front end precise buscar ano letivo, anos acadêmicos, cursos, matérias,
  // turmas, estudantes, categorias de nota e regras de avaliação final
  // separadamente para depois calcular isso no navegador.
  getConfiguracaoStatus: (params?: { codigo_academia?: string; token?: string } | string) => {
    const isLegacy = typeof params === 'string' || params === undefined;
    const tok      = isLegacy ? (params as string | undefined) : params?.token;
    const codigo   = isLegacy ? undefined : params?.codigo_academia;
    const qs       = codigo ? `?codigo_academia=${encodeURIComponent(codigo)}` : '';
    return api.get<ConfiguracaoStatusResponse>(`${ACADEMIA_CONFIGURACAO_STATUS_ENDPOINT}${qs}`, {
      token: tok || tokenStorage.get() || undefined,
    });
  },
```

---

## Passo 3 — Substituir o conteúdo inteiro de `src/hooks/useAcademiaConfiguracaoStatus.ts`

Apague todo o conteúdo atual do arquivo e substitua por exatamente isto:

```typescript
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
```

**O que mudou em relação ao arquivo antigo, para você conferir mentalmente:**
- Os 9 passos, seus títulos, descrições, `href`s e textos de "details" são **idênticos, palavra por palavra**, ao arquivo antigo.
- A regra de "passo desbloqueado/atual" (o `for`/`map` no final, com `previousCompleted`/`currentAssigned`) é **idêntica**, não foi tocada.
- O que mudou: em vez de `Promise.all` com 8 chamadas + funções como `hasAnoLetivo`, `active`, `includes`, `hasCourseCoverage`, `hasFundamentalCoverage`, `hasStudentsInInstitutionLevels` calculando tudo no navegador, agora é **uma chamada** (`academiaService.getConfiguracaoStatus(token)`) e os valores já vêm prontos em `status.steps`.
- O passo `"email-verificacao"` continua exatamente igual (vem de `user.academia.email_verificado`/`email`, nunca dependeu de chamada de API).

---

## Passo 4 — Verificação (rode no seu ambiente)

Na raiz do repositório:

```bash
npm install
npx tsc --noEmit
npx eslint src/hooks/useAcademiaConfiguracaoStatus.ts src/lib/api/services.ts src/types/api.ts
```

Os três comandos devem terminar **sem nenhum erro** (isso já foi confirmado no ambiente de validação desta tarefa — se der erro no seu ambiente, é sinal de que algo no Passo 1, 2 ou 3 não foi colado exatamente como escrito acima; revise contra o texto original antes de tentar corrigir por conta própria).

Se quiser, rode também o build completo para uma confirmação extra (mais lento, opcional):

```bash
npm run build
```

---

## Passo 5 — Conferir que nenhum outro arquivo foi afetado

Rode:

```bash
git status
git diff --stat
```

O `git diff --stat` deve mostrar **exatamente três arquivos alterados**: `src/types/api.ts`, `src/lib/api/services.ts` e `src/hooks/useAcademiaConfiguracaoStatus.ts`. Se qualquer outro arquivo aparecer como modificado (em especial `src/components/dashboard/PainelDashboard.tsx` ou `src/app/(painel)/configuracoes/GuiaConfiguracoesSection.tsx`), desfaça essa mudança — nenhum desses arquivos precisa ser tocado nesta tarefa.

---

## O que NÃO fazer (fora de escopo)

- **Não altere `GuiaConfiguracoesSection.tsx` nem `PainelDashboard.tsx`.** Eles continuam consumindo o hook exatamente como consomem hoje (`steps`, `completedCount`, `totalCount`, `nextStep`, `loading`, `error`, `retry`) — nenhuma mudança de UI é necessária nem permitida nesta tarefa.
- **Não altere nenhum texto visível** (títulos, descrições, textos de "details", mensagens de erro). Se algum texto no arquivo novo parecer "melhorável", não mude — o objetivo é zero diferença perceptível para quem usa o sistema.
- **Não altere a ordem dos passos** nem a lógica de "passo bloqueado/atual" (o bloco final de `buildSteps` com `previousCompleted`/`currentAssigned`).
- **Não remova os métodos antigos** de `academiaService` (`getAnoLetivo`, `listarAnosAcademicos`, `listarCursos`, `listarMaterias`, `listarTurmas`, `listarCategoriasNota`, `listarRegrasAvaliacaoFinal`) nem o `consultasService.listarEstudantes`. Eles continuam em uso por outras telas do sistema — esta tarefa só para de usá-los **dentro deste hook específico**.
- **Não altere nada no repositório `rastreio-backend`.**

---

## Resumo das mudanças (checklist final)

- [ ] `src/types/api.ts` — interface `ConfiguracaoStatusResponse` adicionada
- [ ] `src/lib/api/services.ts` — import do tipo, constante de endpoint e método `getConfiguracaoStatus` adicionados a `academiaService`
- [ ] `src/hooks/useAcademiaConfiguracaoStatus.ts` — conteúdo inteiro substituído pelo do Passo 3
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npx eslint` nos três arquivos passa sem erros
- [ ] `git diff --stat` mostra só os três arquivos esperados
- [ ] `GuiaConfiguracoesSection.tsx` e `PainelDashboard.tsx` não foram alterados
- [ ] Nenhum arquivo do repositório `rastreio-backend` foi tocado
- [ ] Commit com mensagem sugerida: `refactor: consolida o guia de configuração em uma única chamada a GET /academia/configuracao-status`

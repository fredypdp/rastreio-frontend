---
criado: 2026-09-16
origem: Fredy — relatou (com print) que a página /painel fica em branco depois do skeleton desaparecer e pediu que o skeleton só suma quando todos os dados estiverem prontos; pediu também que a Vista em Escala de /estudantes mostre skeleton sempre que uma consulta de estudantes for feita, não só na primeira carga
status: pendente de execução pelo Codex
repositório: fredypdp/rastreio-frontend (main)
---

# 8 — Skeleton do Painel e da Vista em Escala de Estudantes não acompanham os dados reais

## Prompt recomendado para o Codex

```
Executa o documento de tarefa "docs/Lista de Tarefas/8 - Skeleton do
Painel e da Vista em Escala de Estudantes.md" no repositório
fredypdp/rastreio-frontend, branch main.

Aplica exatamente os blocos "Localizar" / "Substituir" de cada ficheiro,
na ordem em que aparecem no documento, sem alterar mais nada além do que
está descrito. Não planeies, não proponhas alternativas de arquitetura —
o desenho já foi decidido, só falta aplicar.

Depois de aplicar todas as alterações, corre:
  npx tsc --noEmit
  npx eslint "src/app/(painel)/layout.tsx" "src/components/dashboard/PainelDashboard.tsx" "src/app/(painel)/estudantes/PageContent.tsx"

Cola a saída completa dos dois comandos. Se algum deles reportar erro,
não tentes corrigir sozinho — pára e devolve a saída exata do erro.
```

## Contexto

### Situação 1 — `/painel` fica em branco depois do skeleton desaparecer

Reportado com print: depois do skeleton do painel desaparecer, a página
mostra só o cabeçalho "Bom dia, 👋" (sem nome) e o resto fica em branco.

Investigando os três ficheiros envolvidos (`RouteGuard.tsx`,
`src/app/(painel)/layout.tsx` e `PainelDashboard.tsx`), a causa real é uma
corrida (*race condition*) entre dois mecanismos que já existem no código,
não um bug isolado do skeleton em si:

1. `useUserCookie` lê o cookie `user` de forma síncrona, mas se não o
   encontrar de imediato fica a tentar de novo a cada 100 ms durante até
   3 segundos; se esse tempo passar sem encontrar o cookie, devolve
   `loading: false` e `user: null` mesmo assim (é o comportamento correto
   dele — só não devia ser lido como "dados prontos" por quem o consome).
2. `src/app/(painel)/layout.tsx` já tem uma lógica para este cenário: se
   `loadingUser` fica `false` e não havia `user` no cookie, ele pede o
   perfil à API (`perfilService.meuPerfil`), grava um cookie novo e, como
   não havia dados antes, força um `window.location.reload()` para os
   restantes componentes lerem o cookie atualizado.
3. O problema é o que acontece **entre** o passo 1 e o `reload()` do
   passo 2: nesse intervalo (o tempo da chamada à API `meuPerfil`),
   `PainelLayout` já deixa passar `children` — e `PainelDashboard`, que
   também lê o mesmo cookie de forma independente, recebe
   `loadingUser: false` e `user: null`. Como nenhuma das três condições
   (`admin` / `academia` / `estudante`) bate com `user` nulo, nada é
   desenhado a seguir ao cabeçalho — daí o "em branco" que reportaste, e é
   exatamente o "fica requisitando alguma coisa" que suspeitaste: o
   `meuPerfil` está mesmo a ser pedido nesse instante, só que em segundo
   plano, sem nenhum indicador visível.

Correção (duas frentes, no mesmo espírito de "só esconder o skeleton
quando os dados estiverem prontos"):

- **`layout.tsx`**: enquanto essa verificação de perfil em segundo plano
  estiver a decorrer (só acontece quando não havia cookie `user` ainda),
  mostrar uma tela de espera em vez de deixar `children` (que inclui
  `PainelDashboard`) renderizar sem dados.
- **`PainelDashboard.tsx`**: como rede de segurança adicional — e para
  cumprir a regra geral que pediste ("o skeleton só desaparece quando os
  dados estiverem prontos") — o componente passa a só esconder o skeleton
  quando `user` existir **e** tiver o sub-objeto correspondente ao seu
  `tipo` (`user.admin` / `user.academia` / `user.estudante`). Se isso não
  acontecer mesmo depois do carregamento terminar (situação residual, ex.:
  a chamada `meuPerfil` falhar), mostra um estado explícito de erro com
  botão "Tentar novamente" — nunca mais um espaço em branco sem
  explicação.

### Situação 2 — `/estudantes`, Vista em Escala, sem skeleton nas consultas seguintes

Pedido: mostrar skeleton sempre que uma consulta de estudantes for feita
na visão em escala (não só na primeira).

Em `PageContent.tsx` (componente `Estudantes`), a Vista em Escala da
Academia decide entre mostrar a lista (`VistaEscala`) ou o skeleton
usando só a flag `carregado`, que fica `true` para sempre depois da
**primeira** consulta bem-sucedida e nunca volta a `false`. Ao trocar de
filtro, paginar ou clicar em "Atualizar lista", uma nova consulta é
disparada (`carregandoEstudantes` volta a `true` durante ela, e
`dataEstudantes` é momentaneamente limpo para `null` pelo próprio hook
`useApi`) — mas como `carregado` continua `true`, a tela mostra
`VistaEscala` com a lista **antiga** (`estudantesEscala`, que não é
limpa) até a nova consulta terminar, sem qualquer sinal de que algo está
a carregar.

Correção: mostrar o skeleton também quando `carregandoEstudantes` for
`true`, além do caso já existente de `!carregado`.

## Resumo executivo

| # | Ficheiro | O que muda | Risco |
|---|----------|------------|-------|
| 1 | `src/app/(painel)/layout.tsx` | Ficheiro inteiro substituído: adiciona um estado `verificandoPerfilInicial` que mostra uma tela de espera enquanto o perfil é confirmado em segundo plano, em vez de deixar `children` renderizar sem dados | Baixo — só ativa no cenário exato descrito (sem cookie `user` ainda); no caminho normal (cookie já presente) o comportamento é idêntico ao atual |
| 2 | `src/components/dashboard/PainelDashboard.tsx` | Só esconde o skeleton quando o sub-objeto do `tipo` do utilizador existir; adiciona um estado de erro explícito para o caso residual de continuar sem dados | Baixo — muda só a condição de exibição; nenhuma das três visões (`DashboardAdmin`/`DashboardAcademia`/`DashboardEstudante`) é alterada |
| 3 | `src/app/(painel)/estudantes/PageContent.tsx` | Skeleton da Vista em Escala passa a aparecer também quando `carregandoEstudantes` for `true`, não só antes da primeira carga | Baixo — muda só a condição de exibição de dois blocos JSX já existentes; a Vista Tabela e a Vista em Escala do Admin não são tocadas |

Nenhum ficheiro precisa de ser removido.

---

## Secção 1 — `/painel`: só esconder o skeleton quando os dados estiverem prontos

### Objetivo

Impedir que `/painel` mostre conteúdo em branco depois do skeleton
desaparecer, cobrindo tanto a causa raiz (corrida entre o cookie `user` e
a renovação de perfil em segundo plano em `layout.tsx`) como uma rede de
segurança no próprio `PainelDashboard.tsx`.

### Escopo obrigatório

- Alterar **apenas** `src/app/(painel)/layout.tsx` e
  `src/components/dashboard/PainelDashboard.tsx`.
- Não alterar `RouteGuard.tsx`, `useUserCookie.ts`, `useApi.ts` nem
  `AppHeader`/`AppSidebar` — nenhum deles precisa de mudar para esta
  correção.
- Não alterar a lógica interna de `DashboardAdmin`, `DashboardAcademia`
  ou `DashboardEstudante` (as três "visões" dentro de
  `PainelDashboard.tsx`) — elas continuam a ser chamadas exatamente como
  antes, só a condição que decide **quando** chamá-las é que muda.

### Ficheiro 1/2 — `src/app/(painel)/layout.tsx` (substituir o ficheiro completo)

O ficheiro é pequeno (111 linhas) e a mudança toca o corpo do componente
inteiro — por isso, em vez de blocos "Localizar/Substituir", substitui o
**ficheiro inteiro** pelo conteúdo abaixo.

```tsx
"use client"
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { tokenStorage, useApi, perfilService } from '@/lib/api';
import { setCookie } from '@/lib/utils/cookies';
import { useUserCookie } from '@/hooks/useUserCookie';
import RouteGuard from "@/components/guards/RouteGuard";

/**
 * Tela de espera reutilizada enquanto ainda confirmamos se há um perfil mais
 * recente por trás do cookie "user" (ver useEffect abaixo). Usa o mesmo
 * visual da tela de carregamento do RouteGuard para não haver troca de
 * layout perceptível entre as duas fases de verificação.
 */
function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const hasLoadedProfile = useRef(false);

  const { user, loading: loadingUser } = useUserCookie();
  const { execute: executarPegarPerfil } = useApi(perfilService.meuPerfil);
  // Verdadeiro apenas durante a janela entre "não havia cookie 'user' ainda"
  // e "o perfil buscado da API terminou de chegar (e a página vai recarregar
  // sozinha) ou falhou". Enquanto verdadeiro, o conteúdo do painel (children)
  // não tem dados suficientes para ser desenhado corretamente — por isso
  // mostramos esta tela de espera em vez de deixar `children` renderizar em
  // branco até o reload automático abaixo acontecer.
  const [verificandoPerfilInicial, setVerificandoPerfilInicial] = useState(false);

  useEffect(() => {
    // Só executa uma vez por montagem do layout
    if (hasLoadedProfile.current) return;
    if (loadingUser) return;

    const token = tokenStorage.get();
    if (!token) return;
    if (tokenStorage.isRestrictedFinance()) return;

    hasLoadedProfile.current = true;

    const tinhaUserAoIniciar = !!user;
    if (!tinhaUserAoIniciar) {
      setVerificandoPerfilInicial(true);
    }

    executarPegarPerfil(token).then((data) => {
      if (!data) {
        setVerificandoPerfilInicial(false);
        return;
      }

      const userNovo = JSON.stringify(data);

      // Atualiza o cookie silenciosamente com a data mais recente do servidor
      setCookie("user", userNovo, 1);

      // Só recarrega a página se não havia dados antes (primeiro carregamento sem cookie)
      // Evita o loop: se já havia user, NÃO recarrega — apenas atualiza o cookie
      if (!tinhaUserAoIniciar) {
        // Sem dados anteriores: força reload para o cookie novo ser lido pelos componentes
        window.location.reload();
      }
    }).catch(() => {
      // Silencia erros de perfil (ex: token expirado é tratado pelo RouteGuard)
      setVerificandoPerfilInicial(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser]); // Só re-executa se o estado de loading mudar

  const contentPadding = isExpanded || isHovered
    ? "lg:pl-[290px]"
    : "lg:pl-[90px]";

  return (
    <RouteGuard>
      {verificandoPerfilInicial ? (
        <LoadingScreen message="Espere um pouco..." />
      ) : (
        <div className="flex min-h-screen">
          <AppSidebar />
          <Backdrop />

          <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${contentPadding}`}>
            <AppHeader />

            <div className="p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}
```

O que muda em relação ao ficheiro atual, resumido:
- Import de `useState` adicionado.
- Nova função `LoadingScreen` (igual à do `RouteGuard.tsx`, copiada aqui
  porque `RouteGuard.tsx` não a exporta).
- Novo estado `verificandoPerfilInicial`.
- Dentro do `useEffect`: captura `tinhaUserAoIniciar` antes da chamada à
  API (substitui o `userAtual` que antes só era calculado depois da
  resposta chegar); liga `verificandoPerfilInicial` quando não havia
  `user`; desliga em qualquer desfecho que não termine em reload
  (`!data`, ou `.catch`).
- No `return`: `children` (com sidebar/header) só é desenhado quando
  `verificandoPerfilInicial` for falso; caso contrário mostra a
  `LoadingScreen`. `RouteGuard` continua a envolver tudo, incluindo essa
  tela de espera — a verificação de permissão de rota dele não é
  contornada em nenhum momento.

### Ficheiro 2/2 — `src/components/dashboard/PainelDashboard.tsx` (Localizar/Substituir)

**Localizar** (bloco único, do fim das variáveis derivadas até ao fecho
do componente):

```tsx
  const nome = user?.estudante?.nome ?? user?.academia?.nome ?? user?.admin?.nome ?? "";
  const nomeSaudacao = user?.tipo === "academia" ? user?.academia?.nome ?? "" : firstName(nome);
  const tipo = user?.tipo;
  const deveMostrarGuiaAcademia = tipo === "academia" && (
    configuracaoStatus.loading ||
    Boolean(configuracaoStatus.error) ||
    configuracaoStatus.completedCount < configuracaoStatus.totalCount
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        {loadingUser ? (
          <>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {greeting()}, {nomeSaudacao} 👋
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {tipo === "admin" && "Visão geral do sistema Spuri"}
              {tipo === "academia" && "Resumo da sua instituição"}
              {tipo === "estudante" && "O seu painel académico"}
            </p>
          </>
        )}
      </div>

      {/* Conteúdo condicional por tipo */}
      {loadingUser ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
            >
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {tipo === "admin" && user && <DashboardAdmin user={user} />}
          {tipo === "academia" && user && (
            configuracaoStatus.loading ? (
              <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 text-center dark:border-brand-500/20 dark:from-brand-500/10 dark:to-gray-900">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"><Icon icon="mdi:clipboard-text-clock-outline" width={26} className="animate-pulse" /></span>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Montando a guia de configurações</h2>
                <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">Estamos a consultar as configurações da sua academia para mostrar os próximos passos mais importantes.</p>
              </section>
            ) : deveMostrarGuiaAcademia ? <GuiaConfiguracoesSection /> : <DashboardAcademia user={user} />
          )}
          {tipo === "estudante" && user && <DashboardEstudante user={user} />}
        </>
      )}
    </div>
  );
}
```

**Substituir por:**

```tsx
  const nome = user?.estudante?.nome ?? user?.academia?.nome ?? user?.admin?.nome ?? "";
  const nomeSaudacao = user?.tipo === "academia" ? user?.academia?.nome ?? "" : firstName(nome);
  const tipo = user?.tipo;
  const deveMostrarGuiaAcademia = tipo === "academia" && (
    configuracaoStatus.loading ||
    Boolean(configuracaoStatus.error) ||
    configuracaoStatus.completedCount < configuracaoStatus.totalCount
  );

  // O cookie "user" pode ficar `loading: false` sem ainda ter os dados do
  // sub-objeto correspondente ao `tipo` (ex.: cookie a meio caminho de ser
  // renovado em segundo plano por PainelLayout). Só consideramos os dados
  // essenciais prontos quando temos um `tipo` conhecido E o sub-objeto desse
  // tipo — caso contrário nenhuma das três visões abaixo bate e a tela
  // ficaria em branco mesmo com o skeleton já escondido.
  const tipoReconhecido = tipo === "admin" || tipo === "academia" || tipo === "estudante";
  const dadosDoTipoDisponiveis = !!user && (
    (tipo === "admin" && !!user.admin) ||
    (tipo === "academia" && !!user.academia) ||
    (tipo === "estudante" && !!user.estudante)
  );
  const dadosEssenciaisProntos = !loadingUser && tipoReconhecido && dadosDoTipoDisponiveis;
  const falhaAoIdentificarPerfil = !loadingUser && !dadosEssenciaisProntos;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        {!dadosEssenciaisProntos ? (
          <>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {greeting()}, {nomeSaudacao} 👋
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {tipo === "admin" && "Visão geral do sistema Spuri"}
              {tipo === "academia" && "Resumo da sua instituição"}
              {tipo === "estudante" && "O seu painel académico"}
            </p>
          </>
        )}
      </div>

      {/* Conteúdo condicional por tipo */}
      {!dadosEssenciaisProntos ? (
        falhaAoIdentificarPerfil ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-white/[0.03]">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
              <Icon icon="mdi:alert-circle-outline" width={26} />
            </span>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Não foi possível carregar os seus dados</h2>
            <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Isto pode acontecer imediatamente após iniciar sessão. Recarregue a página para tentar novamente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <Icon icon="mdi:refresh" width={16} />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {tipo === "admin" && user && <DashboardAdmin user={user} />}
          {tipo === "academia" && user && (
            configuracaoStatus.loading ? (
              <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 text-center dark:border-brand-500/20 dark:from-brand-500/10 dark:to-gray-900">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300"><Icon icon="mdi:clipboard-text-clock-outline" width={26} className="animate-pulse" /></span>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Montando a guia de configurações</h2>
                <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">Estamos a consultar as configurações da sua academia para mostrar os próximos passos mais importantes.</p>
              </section>
            ) : deveMostrarGuiaAcademia ? <GuiaConfiguracoesSection /> : <DashboardAcademia user={user} />
          )}
          {tipo === "estudante" && user && <DashboardEstudante user={user} />}
        </>
      )}
    </div>
  );
}
```

Nada mais neste ficheiro muda — nenhuma outra função (`DashboardAdmin`,
`DashboardAcademia`, `DashboardEstudante`, `StatCard`, `Section`,
`AlertBanner`, `QuickLink`, `MediaBadge`, `Skeleton`) é alterada.

---

## Secção 2 — `/estudantes`: skeleton da Vista em Escala em toda consulta

### Objetivo

Fazer o skeleton da Vista em Escala (visão da **Academia**, componente
`VistaEscala`) aparecer sempre que uma nova consulta de estudantes for
disparada — não só antes da primeira carga da página.

### Escopo obrigatório

- Alterar **apenas** `src/app/(painel)/estudantes/PageContent.tsx`,
  dentro do componente `Estudantes` (função exportada por padrão do
  ficheiro).
- Não alterar a Vista Tabela (`!vistaEscala`) — já mostra corretamente um
  spinner com "Carregando estudantes..." em toda consulta, guiado por
  `carregandoEstudantes`; não precisa de mudança.
- Não alterar `EstudantesVistaEscalaAdmin.tsx` (Vista em Escala do
  **Admin**) — é um componente à parte, com a própria navegação
  Província → Academia → árvore, e já mostra "A carregar academias..." /
  "A carregar estudantes..." em toda consulta própria; não apresenta o
  problema relatado.
- Não alterar o efeito que popula `estudantesEscala` progressivamente por
  turma (a variável `carregandoEscala` e o `useEffect` que a usa,
  linhas ~904-946) — esse carregamento incremental é intencional (o
  comentário já existente no código explica que é para "deixar a tela
  mais fluida enquanto as demais consultas terminam") e não é a causa do
  problema relatado.
- Não alterar `VistaEscala` nem `estudantesEscalaShared.tsx`.

### Ficheiro — `src/app/(painel)/estudantes/PageContent.tsx` (Localizar/Substituir)

**Localizar:**

```tsx
        {modoTela === 'lista' && vistaEscala && isAcademia && carregado && (
          <>
          <VistaEscala
            estudantes={estudantesEscala.length > 0 ? estudantesEscala : dataEstudantes?.estudantes ?? []}
            turmas={turmas}
            cursos={cursos}
            nivelAcademia={nivelParaVista}
            filtros={filtrosVisiveis}
            ordem={ordem}
            onVerDetalhes={handleVerDetalhes}
            anosAcademicos={anosAcademicosAcademia}
          />
          </>
        )}

        {modoTela === 'lista' && vistaEscala && isAcademia && !carregado && (
```

**Substituir por:**

```tsx
        {modoTela === 'lista' && vistaEscala && isAcademia && carregado && !carregandoEstudantes && (
          <>
          <VistaEscala
            estudantes={estudantesEscala.length > 0 ? estudantesEscala : dataEstudantes?.estudantes ?? []}
            turmas={turmas}
            cursos={cursos}
            nivelAcademia={nivelParaVista}
            filtros={filtrosVisiveis}
            ordem={ordem}
            onVerDetalhes={handleVerDetalhes}
            anosAcademicos={anosAcademicosAcademia}
          />
          </>
        )}

        {/*
          Skeleton exibido tanto na primeira carga (!carregado) quanto em
          qualquer nova consulta de estudantes disparada depois (filtros,
          "Atualizar lista", paginação etc.) — carregandoEstudantes volta a
          true a cada chamada de carregarEstudantes, mesmo depois da
          primeira. Sem o segundo termo, trocar de filtro na Vista em Escala
          continuava a mostrar a lista antiga (estudantesEscala) parada até a
          nova consulta terminar, em vez de indicar que uma consulta estava
          em curso.
        */}
        {modoTela === 'lista' && vistaEscala && isAcademia && (!carregado || carregandoEstudantes) && (
```

O `<div className="space-y-3" aria-busy="true" ...>` e todo o markup do
skeleton que vem logo depois desta linha **não mudam** — só a condição
que decide quando esse bloco aparece.

---

## Fora de escopo (não tocar)

- Qualquer ficheiro do `rastreio-backend`.
- `RouteGuard.tsx`, `useUserCookie.ts`, `useApi.ts`, `AppHeader.tsx`,
  `AppSidebar.tsx`, `UserDropdown.tsx`.
- `EstudantesVistaEscalaAdmin.tsx`, `estudantesEscalaShared.tsx`
  (`VistaEscala`, `TabelaEstudantes`).
- O carregamento progressivo por turma em `PageContent.tsx`
  (`carregandoEscala` e o `useEffect` associado).
- Qualquer texto, cor, rota ou fluxo relacionado com matrícula/inscrição
  de estudante numa academia — nada nesta tarefa toca nesse fluxo; as
  três alterações são só sobre **quando exibir skeleton vs. conteúdo**
  em `/painel` e `/estudantes`.
- `package-lock.json` / `yarn.lock` — não precisam de nenhuma alteração
  para esta tarefa (se o `npm install`/`yarn install` do Codex os tocar
  sozinho, não incluir essa alteração no commit).

## Critérios de aceitação

1. `npx tsc --noEmit` termina sem nenhum erro.
2. `npx eslint "src/app/(painel)/layout.tsx" "src/components/dashboard/PainelDashboard.tsx" "src/app/(painel)/estudantes/PageContent.tsx"` termina sem nenhum erro nem warning.
3. Revisão manual (Fredy, em staging/produção, já que o ambiente do Codex
   não tem o backend real): 
   - `/painel`: recarregar a página várias vezes (incluindo com
     "Disable cache" nas devtools) deve sempre terminar num destes dois
     estados — nunca em branco: (a) painel completo com nome e cartões;
     ou (b), no raro caso de a verificação de perfil falhar, o cartão
     "Não foi possível carregar os seus dados" com botão "Tentar
     novamente".
   - `/estudantes`, como Academia, na Vista em Escala: aplicar um filtro
     ou clicar em "Atualizar lista" deve mostrar o skeleton de novo
     enquanto a nova consulta corre, em vez de manter a lista anterior
     parada sem indicação de carregamento.

## Validação já realizada por Claude

- Repositório `fredypdp/rastreio-frontend` (branch `main`) clonado e as
  três alterações aplicadas localmente exatamente como descrito acima.
- `npm install` + `npx tsc --noEmit`: **0 erros**.
- `npx eslint` nos três ficheiros alterados: **0 erros, 0 warnings**.
- Não foi possível validar visualmente num browser real contra o backend
  em produção (o sandbox não tem acesso ao backend/DB reais do Spuri) —
  a validação funcional final descrita nos critérios de aceitação é
  manual, por ti, como nas tarefas anteriores só de frontend.

## Procedimento de conclusão

1. Codex aplica as alterações e cola a saída de `tsc`/`eslint` pedida no
   prompt.
2. Fredy confirma visualmente os dois cenários descritos nos critérios
   de aceitação.
3. Mover este ficheiro de `docs/Lista de Tarefas/` para
   `docs/Tarefas feitas/`.

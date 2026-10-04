# Tarefa 25 — Página de Configurações de Faltas `/faltas/configuracoes` (frontend)

**Estado:** pendente

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (validado contra o commit `ba333e2`)
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `25 - Pagina de Configuracoes de Faltas.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover os arquivos conforme o Passo 3.

**Ordem de deploy:** depende da **Tarefa 117 do `rastreio-backend`** já em produção (rotas `GET`/`PUT /academia/faltas/configuracao`). Sem ela, a página abre mas mostra erro ao carregar/guardar (404). **Aplicar depois das Tarefas 23 e 24 deste repositório.**

---

## 0. Prompt recomendado para executar

> Aplique o patch `25 - Pagina de Configuracoes de Faltas.patch` com `git apply`, rode `npm install`, `npx tsc --noEmit` e `npx eslint .`, confirme o resultado esperado do Passo 2, e depois execute o Passo 3 (marcar a tarefa como feita e movê-la para `src/docs/Tarefas feitas/`). Não replaneje, não altere o código do patch, não abra PR.

---

## Contexto do pedido

A academia passa a configurar duas coisas independentes (backend, Tarefa 117):

1. **Limite de faltas por período** (opcional): quantas faltas um estudante pode ter numa matéria, em cada período.
2. **Reprovação por faltas** (liga/desliga; só com limite definido): se o estudante ultrapassar o limite numa matéria e período, a avaliação final automática lê como **0** a **nota do professor** (ensino escolar) ou o **exame final** (ensino superior).

Onde fica: **página `/faltas/configuracoes`**, acessada **apenas** por um botão **"Configurações"** na página `/faltas`. **Não** entra na barra lateral.

## O que o patch faz

**4 arquivos alterados + 3 novos:**

| Arquivo | Mudança |
| --- | --- |
| `src/app/(painel)/faltas/configuracoes/page.tsx` (**novo**) | rota Next com `metadata.title = "Configurações de Faltas"` |
| `src/app/(painel)/faltas/configuracoes/PageContent.tsx` (**novo**) | `PageBreadcrumb` "Configurações de Faltas"; só academia (`UnauthorizedAccess` para os outros); botão "Voltar para faltas" |
| `src/components/faltas/ConfiguracaoFaltas.tsx` (**novo**) | o formulário (descrito abaixo) |
| `src/components/faltas/FaltasAcademia.tsx` | botão **"Configurações"** (ícone `mdi:cog-outline`, estilo secundário) ao lado do botão "Lançar Faltas", linkando `/faltas/configuracoes` |
| `src/lib/route-guards.ts` | regra `/faltas/configuracoes` → `allowedTypes: ['academia']`, `redirectIfUnauthorized: '/faltas'` |
| `src/lib/api/services.ts` | `academiaService.obterConfiguracaoFaltas` (GET) e `definirConfiguracaoFaltas` (PUT) em `/academia/faltas/configuracao` |
| `src/types/api.ts` | `ConfiguracaoFaltas`, `DefinirConfiguracaoFaltasRequest`, `ConfiguracaoFaltasResponse`, `DefinirConfiguracaoFaltasResponse` |

**`AppSidebar.tsx` NÃO é alterado** (é o requisito: acesso só pelo botão).

**Formulário (`ConfiguracaoFaltas.tsx`):**

- Secção **"Limite de faltas por período"**: checkbox "Definir limite de faltas"; ao marcar aparece o campo numérico "Máximo de faltas por matéria e período *" (inteiro **1 a 500**; mensagem de erro inline se inválido).
- Secção **"Reprovação por faltas"**: explica que, ao ultrapassar o limite, a avaliação final automática lê 0 na nota do professor (escolar) / no exame final (superior, categoria com o código `exame_final`), que as outras notas não são afetadas e que avaliações já calculadas não mudam. Checkbox "Aplicar reprovação por faltas", **desativado enquanto não houver limite** (com texto a explicar). Desmarcar o limite desmarca a reprovação.
- Botão **"Guardar configuração"**: só ativo quando há alteração válida; envia `{ limite_faltas_por_periodo: número | null, reprovacao_por_faltas: boolean }`. Mostra alerta de sucesso/erro; após guardar, o formulário passa a refletir os valores devolvidos pelo backend.

## Validação do guarda de rota (executada de verdade)

`checkRoutePermission` de `route-guards.ts` compilado e executado:

| Quem | `/faltas/configuracoes` |
| --- | --- |
| academia (autenticada) | `{ allowed: true }` |
| estudante | `{ allowed: false, redirectTo: "/faltas" }` |
| admin | `{ allowed: false, redirectTo: "/faltas" }` |
| anónimo | `{ allowed: false, redirectTo: "/faltas" }` |

`/faltas` continua permitida para estudante (sem regressão).

## O que já foi validado pelo orquestrador

**Baseline (`main` @ `ba333e2`, sem patch):** `npx tsc --noEmit` sem erros. `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos pré-existentes e em arquivos que nenhuma das Tarefas 23/24/25 toca: `verificar-email/[token]/page.tsx` (erro 29:7), `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx` (erro 102:13), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`.

**Validação final num clone novo e limpo de `main`:** `npm ci` do zero (797 pacotes, exit 0), aplicados os patches **23 → 24 → 25** com `git apply` exatamente como o Codex fará, `npx tsc --noEmit` sem nenhum erro e `npx eslint .` com saída **idêntica** à do baseline (mesmos 10 problemas, mesmos arquivos, nenhum novo).

**`next build`:** no ambiente do orquestrador falha **só** por `Failed to fetch 'Outfit' from Google Fonts` (`fonts.googleapis.com` bloqueado) — limitação de rede do sandbox, **não é erro de código**. Se acontecer o mesmo no seu ambiente, reporte como limitação de rede e siga; `tsc` + `eslint` são a verificação exigida.

**Não foi possível** abrir a página num navegador (sem `next build`/`next dev` com fontes). A parte visual foi validada por leitura do JSX final e por `tsc`/`eslint`, não por captura de ecrã.

## Passo 1 — Aplicar o patch

**Pré-requisito:** Tarefas 23 e 24 já aplicadas. Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/25 - Pagina de Configuracoes de Faltas.patch"
```

Deve alterar 4 arquivo(s) e criar 3 novo(s). Se `git apply` falhar, **PARE** — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)** — exatamente os pré-existentes listados acima, em arquivos não relacionados a este patch. **Nenhum** erro/aviso novo. Não rode `npm audit fix`, não altere `package.json`/`package-lock.json`/`yarn.lock` (se `npm install` modificar o `yarn.lock` ou o lock, **descarte** essa alteração com `git checkout -- yarn.lock package-lock.json` antes de continuar).

## O que NÃO fazer (fora de escopo)

- **Não** adicionar a página à barra lateral (`AppSidebar.tsx`).
- **Não** acrescentar indicadores/alertas de "limite de faltas excedido" em `/faltas` nem por estudante — a funcionalidade é só a configuração.
- **Não** permitir configuração por matéria, curso ou tipo de ensino: é **um único limite por academia**.
- **Não** alterar o texto "exame_final" nem o comportamento descrito: o backend (Tarefa 117) é quem decide qual nota é zerada.
- **Não** mexer nos cabeçalhos de `/faltas` e `/notas` (Tarefa 24) nem em grupos (Tarefa 23).

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema:

1. Neste documento, troque a linha `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título (`# (feito) Tarefa 25 — …`).
2. Acrescente, ao final, uma secção **Resultado** com um parágrafo curto descrevendo o que foi efetivamente feito e qualquer desvio pontual.
3. Mova este `.md` **e** o `.patch` de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome** (a numeração 25 não muda).
4. Não renumere nem altere nenhuma outra tarefa. Não abra PR nem faça merge.

## Resumo das mudanças (checklist final)

- [ ] Tarefas 23 e 24 já aplicadas antes desta; Tarefa 117 do `rastreio-backend` identificada como pré-requisito de deploy
- [ ] Patch aplicado (`git apply`) sem conflitos (4 alterados, 3 novos)
- [ ] `AppSidebar.tsx` **não** foi alterado
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos pré-existentes
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, título com `(feito)`, secção **Resultado** adicionada
- [ ] `.md` e `.patch` movidos para `src/docs/Tarefas feitas/` com o mesmo nome

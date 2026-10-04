# Tarefa 24 — Cabeçalhos "Gestão de Faltas" e "Gestão de Notas" (frontend)

**Estado:** pendente

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (validado contra o commit `ba333e2`)
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `24 - Cabecalhos Gestao de Faltas e Gestao de Notas.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover os arquivos conforme o Passo 3.

**Ordem de deploy:** nenhuma dependência com o `rastreio-backend` — pode ir para produção antes, depois ou junto. **Aplicar depois da Tarefa 23 e antes da Tarefa 25 deste repositório** (a 25 acrescenta o botão "Configurações" ao lado do botão alterado aqui; o patch da 25 foi gerado em cima desta).

---

## 0. Prompt recomendado para executar

> Aplique o patch `24 - Cabecalhos Gestao de Faltas e Gestao de Notas.patch` com `git apply`, rode `npm install`, `npx tsc --noEmit` e `npx eslint .`, confirme o resultado esperado do Passo 2, e depois execute o Passo 3 (marcar a tarefa como feita e movê-la para `src/docs/Tarefas feitas/`). Não replaneje, não altere o código do patch, não abra PR.

---

## Contexto do pedido

Nas páginas `/faltas` e `/notas`, a **academia** vê hoje dois textos empilhados: o título da migalha de pão (`PageBreadcrumb`) com "Faltas"/"Notas" e, logo abaixo, um segundo título "Gestão de Faltas"/"Gestão de Notas" com o botão de lançar ao lado.

Pedido: manter **o breadcrumb** (não removê-lo), mas com o texto **"Gestão de Faltas"** / **"Gestão de Notas"**, e deixar **só esse texto**; o botão de lançar registos fica **logo abaixo** dele.

`PageBreadcrumb` mostra o `pageTitle` em dois sítios (o `<h2>` e o último item do trilho "Home / …"), por isso trocar o `pageTitle` altera os dois — é o comportamento desejado.

## O que o patch faz

**4 arquivos alterados (2 inserções, 4 remoções):**

| Arquivo | Mudança |
| --- | --- |
| `src/app/(painel)/faltas/PageContent.tsx` | `<PageBreadcrumb pageTitle={isAcademia ? "Gestão de Faltas" : "Faltas"} />` |
| `src/app/(painel)/notas/PageContent.tsx` | `<PageBreadcrumb pageTitle={isAcademia ? "Gestão de Notas" : "Notas"} />` |
| `src/components/faltas/FaltasAcademia.tsx` | remove o `<h2>` duplicado "Gestão de Faltas"; o botão "Lançar Faltas" passa a ser o primeiro elemento do bloco, abaixo do breadcrumb |
| `src/components/notas/NotasAcademia.tsx` | remove o `<h2>` duplicado "Gestão de Notas"; o botão "Lançar Notas" idem. O botão "Categoria" (só ensino superior) à direita **não muda** |

`isAcademia` já existia nos dois `PageContent.tsx` (vem de `useUserType()`), por isso o patch não acrescenta imports nem estado.

**Resultado:** a academia vê `Gestão de Faltas` (breadcrumb) → botão `Lançar Faltas` → linha de contagens. **Estudante e admin continuam a ver "Faltas"/"Notas"**, porque o "Gestão de…" só existia na vista da academia.

## O que já foi validado pelo orquestrador

**Baseline (`main` @ `ba333e2`, sem patch):** `npx tsc --noEmit` sem erros. `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos pré-existentes e em arquivos que nenhuma das Tarefas 23/24/25 toca: `verificar-email/[token]/page.tsx` (erro 29:7), `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx` (erro 102:13), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`.

**Validação final num clone novo e limpo de `main`:** `npm ci` do zero (797 pacotes, exit 0), aplicados os patches **23 → 24 → 25** com `git apply` exatamente como o Codex fará, `npx tsc --noEmit` sem nenhum erro e `npx eslint .` com saída **idêntica** à do baseline (mesmos 10 problemas, mesmos arquivos, nenhum novo).

**`next build`:** no ambiente do orquestrador falha **só** por `Failed to fetch 'Outfit' from Google Fonts` (`fonts.googleapis.com` bloqueado) — limitação de rede do sandbox, **não é erro de código**. Se acontecer o mesmo no seu ambiente, reporte como limitação de rede e siga; `tsc` + `eslint` são a verificação exigida.

**Não foi possível** abrir a página num navegador (sem `next build`/`next dev` com fontes). A parte visual foi validada por leitura do JSX final e por `tsc`/`eslint`, não por captura de ecrã.

## Passo 1 — Aplicar o patch

**Pré-requisito:** Tarefa 23 já aplicada. Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/24 - Cabecalhos Gestao de Faltas e Gestao de Notas.patch"
```

Deve alterar 4 arquivo(s). Se `git apply` falhar, **PARE** — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)** — exatamente os pré-existentes listados acima, em arquivos não relacionados a este patch. **Nenhum** erro/aviso novo. Não rode `npm audit fix`, não altere `package.json`/`package-lock.json`/`yarn.lock` (se `npm install` modificar o `yarn.lock` ou o lock, **descarte** essa alteração com `git checkout -- yarn.lock package-lock.json` antes de continuar).

## O que NÃO fazer (fora de escopo)

- **Não** remover o `PageBreadcrumb` — só o texto dele muda.
- **Não** mudar o texto para estudante/admin (continuam "Faltas"/"Notas").
- **Não** tocar nas páginas `/faltas/lancar` e `/notas/lancar` (têm o próprio cabeçalho).
- **Não** adicionar o botão "Configurações" aqui — é a Tarefa 25.
- **Não** mexer nas linhas de contagem ("N turma(s) ativa(s)…") nem em `PageBreadCrumb.tsx`.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema:

1. Neste documento, troque a linha `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título (`# (feito) Tarefa 24 — …`).
2. Acrescente, ao final, uma secção **Resultado** com um parágrafo curto descrevendo o que foi efetivamente feito e qualquer desvio pontual.
3. Mova este `.md` **e** o `.patch` de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome** (a numeração 24 não muda).
4. Não renumere nem altere nenhuma outra tarefa. Não abra PR nem faça merge.

## Resumo das mudanças (checklist final)

- [ ] Tarefa 23 já aplicada antes desta
- [ ] Patch aplicado (`git apply`) sem conflitos (4 arquivos alterados)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos pré-existentes
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, título com `(feito)`, secção **Resultado** adicionada
- [ ] `.md` e `.patch` movidos para `src/docs/Tarefas feitas/` com o mesmo nome

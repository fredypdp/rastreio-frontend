# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `13 - Navegacao de Pagamentos por Pagina.patch`, nesta mesma pasta. Sua tarefa é aplicar o patch e rodar as verificações do Passo 2. Se o patch não aplicar de primeira (`git apply` reclamar de conflito), PARE e reporte a diferença em vez de tentar recriar as mudanças manualmente.

Esta é a terceira de **quatro tarefas de frontend**; é **independente das outras três** (confirmei aplicando este patch sozinho, num clone sem nenhuma das outras aplicadas — funcionou sem conflito). Não depende de nenhuma mudança de backend.

---

## Contexto do problema

`/financas/pagamentos` tinha dois cards ("Mensalidade / Propina" e "Taxa de matrícula") que abriam subtelas *dentro do mesmo componente* (`FinanceiroPagamentosPainel.tsx`), controladas por um estado local (`tela: "menu" | "mensalidade-ano" | "mensalidade-mes" | "lista"`). O pedido:

- Os dois cards passam a navegar para páginas de verdade: `/financas/pagamentos/mensalidades` e `/financas/pagamentos/taxas-matricula` — "não muda o visual, apenas a lógica".
- "Mensalidade / Propina" → **"Mensalidades"**; "Taxa de matrícula" → **"Taxas de matrícula"** (os nomes exatos que o pedido original já especificou junto com as rotas).

Isso é o mesmo padrão de navegação por rota já usado em `/financas/configuracoes` desde a Tarefa 9 (cards com `href` em vez de `onClick`), só que aqui, diferente de lá, cada card levava a um **fluxo de várias etapas** (mensalidade tem um drill-down ano letivo → mês antes da listagem; matrícula vai direto pra listagem) — não só um formulário único. Por isso, em vez de mover tudo para um único componente novo, extraí as partes que os dois fluxos compartilham (busca de credenciais, guarda de acesso, e a própria listagem paginada com filtro/cancelamento/detalhe) para um arquivo `PagamentosShared.tsx`, evitando duplicar ~150 linhas entre as duas páginas novas.

## O que o patch faz

7 arquivos — 5 novos, 2 alterados — nenhuma mudança de backend, nenhuma chamada de API nova (as mesmas 3 chamadas de sempre: `listarCobrancas`, `cancelarCobranca`, `listarCredenciais`, mais `listarAnosLetivosLista` já usada também em Início de cobrança):

1. **`src/components/paineis/PagamentosShared.tsx`** (novo) — `PAGE_SIZE`, `mesesDoAnoLetivo` (a mesma função que já existia, só movida), `PagamentosCobrancasSubtela` (filtro de estado + tabela + paginação + subtela de detalhe — o antigo bloco `tela === "lista"`, agora reutilizável, sem nenhuma mudança visual), `usePagamentosAcesso` (hook com a checagem de permissão + credenciais) e `PagamentosAcessoGuard` (as 3 checagens — carregando / sem permissão / FPP indisponível — que já existiam, agora compartilhadas).
2. **`src/components/paineis/FinanceiroPagamentosPainel.tsx`** (alterado) — de um componente com máquina de estados para só a tela raiz com os 2 cards, agora com `href` em vez de `onClick`. Rótulos renomeados para "Mensalidades" e "Taxas de matrícula".
3. **`src/components/paineis/PagamentosMensalidadesPainel.tsx`** (novo) — `/financas/pagamentos/mensalidades`: mesmo drill-down ano→mês→lista de antes, como página própria.
4. **`src/components/paineis/PagamentosTaxasMatriculaPainel.tsx`** (novo) — `/financas/pagamentos/taxas-matricula`: vai direto para a listagem.
5. **`src/app/(painel)/financas/pagamentos/mensalidades/page.tsx`** (novo)
6. **`src/app/(painel)/financas/pagamentos/taxas-matricula/page.tsx`** (novo)
7. **`src/lib/route-guards.ts`** (alterado) — 2 novas entradas (`admin`, `academia`), mesmo padrão de `/financas/pagamentos` já existente.

Nenhuma rota nova foi adicionada à barra lateral — só `/financas/pagamentos` continua lá, como já era.

## O que já foi validado pelo orquestrador

- **Baseline** (sobre o estado já validado das Tarefas 11/12): `npx tsc --noEmit` limpo.
- Durante o desenvolvimento encontrei um erro real de lint em código que eu tinha acabado de mover (`setState` síncrono logo no início de um `useEffect` de busca de anos letivos) — reestruturei para só atualizar estado dentro dos callbacks `.then()/.catch()/.finally()` da própria chamada assíncrona (o padrão que a própria regra do eslint pede: nenhuma chamada de `setState` direta no corpo síncrono do efeito). Depois disso: `npx tsc --noEmit` limpo; `npx eslint` nos 7 arquivos — **0 erros, 0 avisos**.
- `npx next build` chega a compilar e gerar todas as rotas (incluindo as 2 novas); para só no download da fonte `Outfit` do Google Fonts, o mesmo ponto documentado desde a Tarefa 9 — não é um problema do código.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` (sem nenhuma das Tarefas 11/12 aplicadas, para confirmar que esta tarefa é mesmo independente das outras duas), apliquei o `.patch` exatamente como você vai aplicar, confirmei que aplica sem conflito, rodei `npm install` + `npx tsc --noEmit` + `npx eslint src/` + `npx next build` de novo — mesmíssimo resultado (tsc limpo; eslint com os mesmos 2 erros/8 avisos pré-existentes de sempre, em arquivos que este patch não toca; build para no mesmo ponto da fonte do Google).

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/13 - Navegacao de Pagamentos por Pagina.patch"
```

Deve alterar 2 arquivos e criar 5 novos. Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

Na raiz do repositório:

```bash
npm install
npx tsc --noEmit
npx eslint src/
npx next build
```

- `tsc` sem nenhum erro.
- `eslint` só pode mostrar os mesmos problemas pré-existentes de sempre (arquivos não tocados por este patch); nenhum dos 7 arquivos listados acima deve aparecer na saída.
- `next build` deve parar só no erro conhecido da fonte `Outfit`/`fonts.googleapis.com` — qualquer outro erro, PARE e reporte.

## O que NÃO fazer (fora de escopo)

- Não adicione as 2 rotas novas à barra lateral — só `/financas/pagamentos` fica lá, como antes.
- Não toque no card "Outros"/cobranças avulsas — ele já não existia neste menu antes desta tarefa; nada a fazer aqui.
- Não toque em `/financas/gestao-cobrancas`, `/financas/configuracoes/*` nem `/servicos-extras` — são as Tarefas 11, 12 e 14, documentos separados.
- Nenhuma mudança de backend faz parte desta tarefa.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint src/` sem novos erros/avisos nos 7 arquivos deste patch
- [x] `npx next build` chega até o erro conhecido da fonte do Google (nenhum outro erro)
- [x] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

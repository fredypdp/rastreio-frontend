# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `18 - Corrigir Catalogo de Servicos Extras do Estudante.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover/renomear os arquivos conforme o Passo 3.

**Pré-requisito de deploy:** esta tarefa depende da rota nova `GET /estudante/servicos-extras/catalogo`, da Tarefa 112 do `rastreio-backend`. **Confirme que a Tarefa 112 já foi implantada em produção antes de implantar esta.**

Também verifiquei as outras páginas `/servicos-extras/*` (gerenciar-servicos, categorias-servico, inscrições, minhas-inscrições) — estão funcionando corretamente, nenhuma mudança necessária nelas.

---

## Contexto do problema

Reportado: `/servicos-extras/catalogo` (tela do estudante) com problemas de cor e sem mostrar os serviços disponíveis. Investigando `ServicosExtrasCatalogoPainel.tsx`, encontrei três problemas:

1. **A tela ficava vazia (às vezes sempre).** O componente fazia duas chamadas em paralelo com `Promise.all`, sem nenhum `.catch()`: uma para listar os serviços (rota pública, sem filtro de elegibilidade) e outra para listar as categorias (`GET /academia/categorias-servico`, que **exige academia/admin e rejeita qualquer estudante com 403**). Como a segunda sempre falhava para um estudante, e não havia tratamento de erro, a promessa combinada rejeitava e nenhum estado era atualizado — a tela ficava vazia, sempre, mesmo quando existiam serviços elegíveis.
2. **Sem filtro de elegibilidade.** A lista de serviços vinha da rota pública, que devolve todos os serviços ativos da academia — nenhuma verificação de que o serviço está disponível para o ano/curso do estudante (a mesma regra que corrigi no backend, Tarefa 112).
3. **Paleta de cores.** Faltava suporte a tema escuro em quase todas as classes — borda do card (`border-gray-200` sem `dark:border-...`), o badge de categoria (`bg-brand-50 text-brand-700` sem variante escura) e os textos.

Também encontrei, à parte dos dois problemas reportados, que **o botão "Solicitar inscrição" não tinha nenhuma ação** — nenhum `onClick`. A função que já existe para enviar a solicitação (`estudanteService.solicitarServicoExtra`) nunca era chamada em lugar nenhum do app. Ou seja, mesmo que a tela mostrasse os serviços corretamente, não havia como o estudante de fato se inscrever.

## O que já foi verificado nas outras páginas `/servicos-extras/*`

- **`/servicos-extras/inscricoes`** (`ServicosExtrasSolicitacoesPainel.tsx`, tela da academia) e **`/servicos-extras/minhas-inscricoes`** (`MinhasInscricoesServicoExtraPainel.tsx`, tela do estudante) — código denso (uma linha), mas correto: `npx tsc --noEmit` e `npx eslint` limpos, todos os botões de ação (aprovar, reprovar, cancelar, ver pendências, anular/reativar obrigação) já têm `onClick` chamando a função certa. Nenhuma mudança feita.
- **`/servicos-extras/gerenciar-servicos`** e **`/servicos-extras/categorias-servico`** — já corrigidas nas Tarefas 16/17; confirmado que continuam batendo com o que foi entregue.

## O que o patch faz

2 arquivos:

- **`src/components/paineis/ServicosExtrasCatalogoPainel.tsx`** — reescrito por completo:
  - Passa a chamar `estudanteService.listarCatalogoServicosExtras()` (nova, ver abaixo) em vez das duas chamadas antigas — uma só requisição, já filtrada pela elegibilidade do estudante, já com as categorias resolvidas. Com tratamento de erro (`Alert` de erro) e estado de carregamento visível.
  - Cores com suporte a tema escuro em tudo — cartão (`dark:border-white/[0.05] dark:bg-white/[0.03]`), badge de categoria (componente `Badge`, já usado no resto do app, em vez das classes fixas sem variante escura), textos (`dark:text-white/90`, `dark:text-gray-300`, `dark:text-gray-400`).
  - "Solicitar inscrição" agora chama `estudanteService.solicitarServicoExtra`. Quando o serviço exige documento (`documento_obrigatorio`), aparece um campo para anexar um PDF antes do botão ficar utilizável, com as instruções do serviço (`documento_instrucoes`) exibidas embaixo, se houver. Depois de uma solicitação enviada com sucesso, o card mostra uma confirmação e para de oferecer o botão de novo (evita uma segunda tentativa que o backend rejeitaria com "já existe solicitação ativa").
- **`src/lib/api/services.ts`** — nova função `estudanteService.listarCatalogoServicosExtras()`, chamando `GET /estudante/servicos-extras/catalogo` (rota nova da Tarefa 112 do backend).

## O que já foi validado pelo orquestrador

- `npx tsc --noEmit` (projeto inteiro) — limpo.
- `npx eslint .` (projeto inteiro) — **zero erros novos**; só os mesmos 2 erros pré-existentes de sempre, em arquivos que este patch não toca (`verificar-email/[token]/page.tsx`, `Calendar.tsx`).
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` direto do GitHub, apliquei o `.patch` exatamente como você vai aplicar (`git apply`), `npm install` do zero, e rodei de novo `npx tsc --noEmit` e `npx eslint` — 100% limpo.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "docs/Lista de Tarefas/18 - Corrigir Catalogo de Servicos Extras do Estudante.patch"
```

Deve alterar 2 arquivos, nenhum novo. Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` sem nenhum erro novo (só os 2 pré-existentes já documentados, em arquivos não relacionados).

## O que NÃO fazer (fora de escopo)

- Não toque em `ServicosExtrasSolicitacoesPainel.tsx` nem em `MinhasInscricoesServicoExtraPainel.tsx` — já verificados, sem problema.
- Não crie um fluxo de upload de documento equivalente em nenhuma outra tela — só o catálogo de serviços extras precisava disso, e só porque o botão de solicitar não tinha nenhuma ação.
- Não mude a regra de elegibilidade no frontend — ela vem inteira do backend (Tarefa 112); o frontend só exibe o que a rota já filtrou.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `docs/Lista de Tarefas/` para `docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npm install` sem erros
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint .` sem erros novos
- [x] Confirmado que a Tarefa 112 do `rastreio-backend` já está em produção antes de implantar esta
- [x] Arquivos desta tarefa movidos para `docs/Tarefas feitas/`

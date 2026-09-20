# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `15 - Usar Endpoints por Id em Vez de Filtrar a Lista Inteira.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch e rodar as verificações do Passo 2.

**⚠️ Ordem de deploy — importante:** este patch só funciona corretamente em produção **depois** que a Tarefa 110 do `rastreio-backend` (`GET /academia/categorias-servico/:id`) estiver no ar. Antes disso, a tela de **editar categoria de serviço** vai quebrar com 404 ao tentar carregar a categoria (o endpoint novo ainda não existiria). A tela de **editar serviço extra** não tem essa dependência — o endpoint que ela passa a usar já existia antes desta tarefa. Se não for possível confirmar que a Tarefa 110 já está em produção, aplique este patch mas **não faça deploy** até confirmar.

---

## Contexto do problema

Na Tarefa 14, as telas de edição de categoria de serviço e de serviço extra (`CategoriaServicoFormPainel.tsx`, `ServicoExtraFormPainel.tsx`) foram implementadas buscando a **lista inteira** do recurso e filtrando pelo id no cliente, porque não havia (ou eu não tinha visto) uma chamada de API mais específica disponível. O usuário apontou, corretamente, que isso é uma gambiarra e pediu para trocar pelo jeito certo.

Investigando de novo, encontrei duas situações diferentes:

- **Categoria de serviço**: realmente não existia `GET /academia/categorias-servico/:id` — só listagem completa. Corrigido no backend pela **Tarefa 110**, que adicionou esse endpoint.
- **Serviço extra**: na verdade **já existia** `GET /academia/servicos-extras/:id` (`getServicoExtra` em `services.ts`, `handlers.GetServicoExtra` no backend) — a gambiarra ali foi puro descuido meu na Tarefa 14, não uma limitação real. Não precisou de nenhuma mudança de backend para este caso.

## O que o patch faz

3 arquivos alterados, nenhum novo:

1. **`src/lib/api/services.ts`** — nova função `getCategoriaServico(id, token?)`, chamando `GET /academia/categorias-servico/:id` (o endpoint da Tarefa 110). `getServicoExtra` já existia e não precisou de nenhuma mudança.
2. **`src/components/paineis/CategoriaServicoFormPainel.tsx`** — a edição agora chama `academiaService.getCategoriaServico(categoriaId)` em vez de `listarCategoriasServico()` + `.find()`. Um 404 da API (categoria realmente não existe) é distinguido de outros erros e mostra a mesma tela de "Categoria não encontrada" de antes — só que agora vinda de uma resposta real da API, não de um `.find()` que não achou nada numa lista.
3. **`src/components/paineis/ServicoExtraFormPainel.tsx`** — a edição agora chama `academiaService.getServicoExtra(servicoId)` em vez de `listarServicosExtras()` + `.find()`, com o mesmo tratamento de 404.

Nenhuma mudança de visual, nenhuma mudança de comportamento do ponto de vista de quem usa a tela — só a chamada de rede por trás ficou correta (busca só o item necessário, em vez de toda a lista).

## O que já foi validado pelo orquestrador

- **Baseline** (sobre o estado atual do repositório, já com as Tarefas 11–14 aplicadas): `npx tsc --noEmit` limpo.
- Depois de implementar: `npx tsc --noEmit` limpo; `npx eslint` nos 3 arquivos — **0 erros, 0 avisos**.
- `npx next build` chega a compilar; para só no download da fonte `Outfit` do Google Fonts, o mesmo ponto documentado desde a Tarefa 9 — não é um problema do código.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` direto do GitHub, apliquei o `.patch` exatamente como você vai aplicar, confirmei que aplica sem conflito, rodei `npm install` + `npx tsc --noEmit` + `npx eslint src/` + `npx next build` de novo — mesmíssimo resultado (tsc limpo; eslint com exatamente os mesmos 10 problemas pré-existentes de sempre, nenhum novo; build para no mesmo ponto da fonte do Google).
- Conferi o formato exato da resposta de erro da API (`ApiError`/`SpuriApiError`, campo `.status`) em `src/lib/api/client.ts`, e o padrão já usado em `InicioCobrancaPainel.tsx` (`err instanceof ApiError && err.status === 404`) para tratar o 404 da forma já estabelecida no código, em vez de inventar uma checagem nova.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/15 - Usar Endpoints por Id em Vez de Filtrar a Lista Inteira.patch"
```

Deve alterar exatamente os 3 arquivos listados acima, nenhum novo. Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

Na raiz do repositório:

```bash
npm install
npx tsc --noEmit
npx eslint src/
npx next build
```

- `tsc` sem nenhum erro.
- `eslint` só pode mostrar os mesmos problemas pré-existentes de sempre; nenhum dos 3 arquivos deste patch deve aparecer na saída.
- `next build` deve parar só no erro conhecido da fonte `Outfit`/`fonts.googleapis.com` — qualquer outro erro, PARE e reporte.

## O que NÃO fazer (fora de escopo)

- Não toque em `CategoriasServicoPainel.tsx` nem em `ServicosExtrasPainel.tsx` (as telas de listagem) — elas já usam a listagem completa de propósito (é uma tabela com todos os itens), a gambiarra estava só nas telas de edição.
- Não remova `listarCategoriasServico`/`listarServicosExtras` de `services.ts` — continuam sendo as chamadas certas para as telas de listagem.
- Não implemente nada de backend aqui — se a Tarefa 110 ainda não estiver aplicada no `rastreio-backend`, aplique-a primeiro (ela é um pré-requisito de deploy desta tarefa, não desta implementação).

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint src/` sem novos erros/avisos nos 3 arquivos deste patch
- [x] `npx next build` chega até o erro conhecido da fonte do Google (nenhum outro erro)
- [x] Confirmado que a Tarefa 110 do `rastreio-backend` está aplicada **antes** de fazer deploy deste patch em produção
- [x] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

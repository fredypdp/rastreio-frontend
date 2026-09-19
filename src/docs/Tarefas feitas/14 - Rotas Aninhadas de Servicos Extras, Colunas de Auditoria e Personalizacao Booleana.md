# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `14 - Rotas Aninhadas de Servicos Extras, Colunas de Auditoria e Personalizacao Booleana.patch`, nesta mesma pasta. Sua tarefa é aplicar o patch e rodar as verificações do Passo 2. Se o patch não aplicar de primeira (`git apply` reclamar de conflito), PARE e reporte a diferença em vez de tentar recriar as mudanças manualmente.

Esta é a última das **quatro tarefas de frontend**; é **independente das outras três** (confirmei aplicando este patch sozinho, num clone sem nenhuma das outras aplicadas — funcionou sem conflito). Não depende de nenhuma mudança de backend — conferi que `CategoriaServicoDTO` e `ServicoExtraDTO`, nas projections do `rastreio-backend`, já persistem e já retornam `created_at`/`updated_at` no JSON das listagens; nada precisou mudar lá.

---

## Contexto do problema

`/servicos-extras/categorias-servico` e `/servicos-extras/gerenciar-servicos` tinham criação e edição embutidas na própria tela de listagem (categorias: um mini-formulário acima da tabela para criar, e um campo de texto que aparecia dentro da linha para editar; serviços: um formulário inteiro, com várias seções, ativado por um estado local `view === "form"` que escondia a tabela). O pedido tinha 4 partes, para as duas páginas:

1. Adicionar um botão "Carregar"/"Consultar" ao lado dos botões de adicionar.
2. Criação/edição saírem da tela de listagem e irem para rotas aninhadas (`criar`/`editar`).
3. Adicionar colunas "Criado em", "Editado em" e "Ver mais" (a última abre uma subtela com todas as informações).
4. (só em `gerenciar-servicos`) Corrigir a UI do booleano (sim/não) de "Personalização adicional".

### Como cada rota de edição foi resolvida sem endpoint de "buscar por id"

Nem `academiaService.listarCategoriasServico` nem `academiaService.listarServicosExtras` têm uma variante "buscar só um pelo id" — só listagem completa. Por isso `/editar/[id]` busca a lista inteira (a mesma que a página de listagem já usa) e filtra pelo id no cliente — não é a chamada mais eficiente possível, mas é o que já está disponível sem exigir uma mudança de backend, e o comportamento (uma tela de edição que carrega e então mostra o formulário preenchido) é idêntico ao que o usuário já tinha antes (a listagem já precisava estar carregada para a edição inline funcionar).

### O booleano confuso de "Personalização adicional"

Confirmei a causa exata no código: cada personalização do tipo "booleano" usava um único `Checkbox` cujo **rótulo mudava de texto** ("Sim"/"Não") conforme o estado marcado/desmarcado — a única pista de qual opção está selecionada é essa combinação de caixinha + texto que também muda, exatamente o que o usuário descreveu como confuso. Troquei por dois botões lado a lado ("Sim" / "Não"), só um selecionável por vez, reaproveitando o mesmo padrão visual de botão-pílula que o próprio arquivo já usa mais abaixo para selecionar anos/classes (`botaoAnoClasse`) — nenhum componente visual novo foi introduzido, só uma nova função `BooleanoField` com a mesma classe de estilo.

## O que o patch faz

8 arquivos — 6 novos, 2 alterados — nenhuma migration, nenhuma mudança de contrato de API:

1. **`src/components/paineis/CategoriaServicoFormPainel.tsx`** (novo) — formulário de criar/editar categoria (um campo só: nome), usado pelas duas rotas novas abaixo.
2. **`src/app/(painel)/servicos-extras/categorias-servico/criar/page.tsx`** (novo)
3. **`src/app/(painel)/servicos-extras/categorias-servico/editar/[id]/page.tsx`** (novo — rota dinâmica, mesmo padrão já usado em `verificar-email/[token]`)
4. **`src/components/paineis/CategoriasServicoPainel.tsx`** (alterado) — virou só a listagem: botão "Consultar" ao lado de "Adicionar categoria" (que agora é um link para `/criar`); colunas "Criado em"/"Editado em" adicionadas; "Ver mais" por linha abre uma subtela com nome/status/criado em/editado em e os botões Editar (→ rota de edição)/Desativar-Reativar/Excluir.
5. **`src/components/paineis/ServicoExtraFormPainel.tsx`** (novo) — o formulário inteiro de serviço extra, extraído de `ServicosExtrasPainel.tsx` sem nenhuma mudança de campo/validação/comportamento, só a navegação (salvar leva de volta à listagem via rota, não mais troca de estado local) — mais a correção do booleano (`BooleanoField`, ver acima).
6. **`src/app/(painel)/servicos-extras/gerenciar-servicos/criar/page.tsx`** (novo)
7. **`src/app/(painel)/servicos-extras/gerenciar-servicos/editar/[id]/page.tsx`** (novo — rota dinâmica)
8. **`src/components/paineis/ServicosExtrasPainel.tsx`** (alterado) — virou só a listagem: botão "Consultar" ao lado de "Novo Serviço" (que agora é um link para `/criar`); colunas "Criado em"/"Editado em" adicionadas; "Ver mais" por linha abre uma subtela com todas as informações do serviço (categoria, status, datas, se é pago e com que preço/métodos, taxa de inscrição, documento obrigatório, disponibilidade por ano/curso, e as personalizações) e os botões Editar (→ rota de edição)/Desativar-Reativar/Excluir.

## O que já foi validado pelo orquestrador

- **Baseline** (sobre o estado já validado das Tarefas 11/12/13): `npx tsc --noEmit` limpo.
- Depois de implementar: `npx tsc --noEmit` limpo; `npx eslint` nos 8 arquivos — **0 erros**. Restam 2 avisos (`react-hooks/exhaustive-deps`, "missing dependency: recarregar") em `CategoriasServicoPainel.tsx` e `ServicosExtrasPainel.tsx` — conferi que são os **mesmos 2 arquivos que já tinham exatamente esse mesmo tipo de aviso antes desta tarefa** (o padrão "carregar a lista uma vez ao montar, sem incluir a própria função de carregar nas dependências" já existia; só mudou de linha). O total de problemas em todo o `src/` continua **10** (2 erros + 8 avisos), idêntico ao de antes desta tarefa — nenhum problema novo, nenhum a menos.
- `npx next build` chega a compilar e gerar todas as rotas (incluindo as 4 novas, duas delas dinâmicas — `editar/[id]`); para só no download da fonte `Outfit` do Google Fonts, o mesmo ponto documentado desde a Tarefa 9 — não é um problema do código.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` (sem nenhuma das Tarefas 11/12/13 aplicadas, para confirmar que esta tarefa é mesmo independente das outras três), apliquei o `.patch` exatamente como você vai aplicar, confirmei que aplica sem conflito, rodei `npm install` + `npx tsc --noEmit` + `npx eslint src/` + `npx next build` de novo — mesmíssimo resultado (tsc limpo; eslint com exatamente os mesmos 10 problemas de sempre, nenhum novo; build para no mesmo ponto da fonte do Google).
- Conferi em `internal/projections/categoria_servico_projection.go` e `internal/projections/servico_extra_projection.go`, no `rastreio-backend`, que `created_at`/`updated_at` já são persistidos e retornados nas duas listagens usadas aqui — nenhuma mudança de backend fazia falta para as colunas novas.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/14 - Rotas Aninhadas de Servicos Extras, Colunas de Auditoria e Personalizacao Booleana.patch"
```

Deve alterar 2 arquivos e criar 6 novos (contando as 4 pastas de rota). Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

Na raiz do repositório:

```bash
npm install
npx tsc --noEmit
npx eslint src/
npx next build
```

- `tsc` sem nenhum erro.
- `eslint` deve mostrar exatamente os mesmos **10 problemas** de sempre (2 erros em `verificar-email/[token]/page.tsx` e `Calendar.tsx`, 8 avisos espalhados, incluindo os 2 avisos de "missing dependency: recarregar" nos dois arquivos desta tarefa — isso é esperado, não um regressão); nenhum problema **novo** deve aparecer.
- `next build` deve parar só no erro conhecido da fonte `Outfit`/`fonts.googleapis.com` — qualquer outro erro, PARE e reporte.

## O que NÃO fazer (fora de escopo)

- Não tente eliminar os 2 avisos "missing dependency: recarregar" — são pré-existentes (mesmo padrão já usado antes desta tarefa nesses mesmos 2 arquivos) e não fazem parte deste pedido.
- Não adicione um endpoint de "buscar categoria/serviço por id" no backend — as rotas de edição já funcionam buscando a lista inteira e filtrando pelo id; se quiser otimizar isso depois, é uma tarefa própria, não esta.
- Não toque em `/servicos-extras/catalogo`, `/servicos-extras/inscricoes` nem `/servicos-extras/minhas-inscricoes` — não fazem parte deste pedido.
- Não toque em `/financas/*` — são as Tarefas 11, 12 e 13, documentos separados.
- Nenhuma mudança de backend faz parte desta tarefa.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint src/` com exatamente os mesmos 10 problemas pré-existentes (nenhum novo)
- [x] `npx next build` chega até o erro conhecido da fonte do Google (nenhum outro erro)
- [x] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

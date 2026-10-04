# Tarefa 23 — Grupos no 4º ano médio no painel de Turmas (frontend)

**Estado:** pendente

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (validado contra o commit `ba333e2`)
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `23 - Grupos no 4o Ano Medio no Painel de Turmas.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover os arquivos conforme o Passo 3.

**Ordem de deploy:** depende da **Tarefa 116 do `rastreio-backend`** (campo `tema_trabalho` e `tipo_agrupamento`). O patch compila e funciona sem ela (a decisão "grupo vs turma" é feita no frontend pelo nível `4_ano_medio`), **mas** o tema digitado só é guardado/devolvido quando o backend da 116 estiver em produção. Colocar a 116 em produção primeiro.

---

## 0. Prompt recomendado para executar

> Aplique o patch `23 - Grupos no 4o Ano Medio no Painel de Turmas.patch` com `git apply`, rode `npm install`, `npx tsc --noEmit` e `npx eslint .`, confirme o resultado esperado do Passo 2, e depois execute o Passo 3 (marcar a tarefa como feita e movê-la para `src/docs/Tarefas feitas/`). Não replaneje, não altere o código do patch, não abra PR.

---

## Contexto do pedido

No **4º ano do ensino médio** não existem turmas: os estudantes são separados em **grupos**, cada um com um trabalho de **tema** diferente. O painel de Turmas (`/gerenciamento/turmas`) só fala de "turma". Nesta tarefa, **no 4º ano médio** o painel passa a falar de **grupo** e permite indicar o **tema do trabalho**. Os outros níveis ficam exatamente como estão.

O backend (Tarefa 116) manteve o agregado `Turma` — mesmas rotas, mesmo `codigo_turma` — e acrescentou `tipo_agrupamento` (`"grupo"`/`"turma"`) e `tema_trabalho` (opcional, só 4º ano médio, máx. 200 caracteres).

## O que o patch faz

**2 arquivos alterados + 1 novo:**

| Arquivo | Mudança |
| --- | --- |
| `src/lib/agrupamento.ts` (**novo**) | `NIVEL_GRUPOS = "4_ano_medio"`, `TEMA_TRABALHO_MAX = 200`, `ehGrupo(nivel)`, `termoAgrupamento(nivel, quantidade)` — única fonte da regra "este nível usa grupos" |
| `src/types/api.ts` | `Turma` ganha `tipo_agrupamento?: 'turma' \| 'grupo'` e `tema_trabalho?: string`; `CriarTurmaRequest` e `AtualizarTurmaRequest` ganham `tema_trabalho?: string` |
| `src/components/paineis/TurmasPainel.tsx` | textos e ícone passam a depender de `ehGrupo(nivel)` (lista abaixo) |

**Comportamento no 4º ano médio (`nivel === "4_ano_medio"`):**

- Cartão: ícone de grupo (`mdi:account-group-outline`) e, se houver, `· Tema: …` ao lado do turno; botão "Deletar grupo".
- Formulário: título "Novo Grupo"/"Editar Grupo" (aparece assim assim que o nível 4º ano médio é escolhido), "Código do Grupo", placeholder `Ex: G1, G2`, botão "Criar Grupo", e o campo **"Tema do trabalho (opcional)"** (máx. 200 caracteres, com texto de ajuda).
- Payload: ao **criar**, `tema_trabalho` só é enviado se preenchido; ao **editar**, é sempre enviado (vazio = remove o tema no backend). Se o nível não for de grupos, `tema_trabalho` nunca é enviado.
- Mensagens de sucesso/erro: "Grupo criado/actualizado/deletado com sucesso", "Grupo ativado/desativado", "Erro ao guardar/deletar grupo", "Selecione o curso do grupo."
- Modal de deletar: "Deletar Grupo" / "Tem certeza que deseja deletar o grupo …".
- Barra de seleção em lote: "grupo(s) selecionado(s)", "ativo(s)/inativo(s)" quando **todos** os selecionados são grupos; mensagens de lote dizem "grupo(s)".
- Listas por curso/nível: contador "N grupo(s)" e "N sem grupo" no 4º ano médio; card "Estudantes sem grupo"; botão "Voltar para grupos"; detalhe mostra `· Tema: …`; estados vazios "Nenhum estudante neste grupo".

**Nos outros níveis nada muda** (todos os textos continuam "turma").

Limitação aceita: o botão geral do cabeçalho do painel ("Nova Turma") continua com esse texto, porque nesse momento o nível ainda não foi escolhido; o título do formulário muda para "Novo Grupo" quando o nível 4º ano médio é selecionado.

## O que já foi validado pelo orquestrador

**Baseline (`main` @ `ba333e2`, sem patch):** `npx tsc --noEmit` sem erros. `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos pré-existentes e em arquivos que nenhuma das Tarefas 23/24/25 toca: `verificar-email/[token]/page.tsx` (erro 29:7), `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx` (erro 102:13), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`.

**Validação final num clone novo e limpo de `main`:** `npm ci` do zero (797 pacotes, exit 0), aplicados os patches **23 → 24 → 25** com `git apply` exatamente como o Codex fará, `npx tsc --noEmit` sem nenhum erro e `npx eslint .` com saída **idêntica** à do baseline (mesmos 10 problemas, mesmos arquivos, nenhum novo).

**`next build`:** no ambiente do orquestrador falha **só** por `Failed to fetch 'Outfit' from Google Fonts` (`fonts.googleapis.com` bloqueado) — limitação de rede do sandbox, **não é erro de código**. Se acontecer o mesmo no seu ambiente, reporte como limitação de rede e siga; `tsc` + `eslint` são a verificação exigida.

**Não foi possível** abrir a página num navegador (sem `next build`/`next dev` com fontes). A parte visual foi validada por leitura do JSX final e por `tsc`/`eslint`, não por captura de ecrã.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/23 - Grupos no 4o Ano Medio no Painel de Turmas.patch"
```

Deve alterar 2 arquivo(s) e criar 1 novo. Se `git apply` falhar, **PARE** — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)** — exatamente os pré-existentes listados acima, em arquivos não relacionados a este patch. **Nenhum** erro/aviso novo. Não rode `npm audit fix`, não altere `package.json`/`package-lock.json`/`yarn.lock` (se `npm install` modificar o `yarn.lock` ou o lock, **descarte** essa alteração com `git checkout -- yarn.lock package-lock.json` antes de continuar).

## O que NÃO fazer (fora de escopo)

- **Não** alterar mais nenhuma tela que ainda diga "turma" no 4º ano (cadastro/edição de estudante, matrículas, faltas, notas, avaliações finais, filtros). Ficam para tarefa própria.
- **Não** mudar rotas nem nomes de campo (`codigo_turma`, `/academia/turma…` continuam iguais).
- **Não** criar página nova para grupos nem entidades de professor/secretário/encarregado (adiadas pelo dono do produto).
- **Não** mexer em `/faltas` nem `/notas` — Tarefas 24 e 25.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema:

1. Neste documento, troque a linha `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título (`# (feito) Tarefa 23 — …`).
2. Acrescente, ao final, uma secção **Resultado** com um parágrafo curto descrevendo o que foi efetivamente feito e qualquer desvio pontual.
3. Mova este `.md` **e** o `.patch` de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome** (a numeração 23 não muda).
4. Não renumere nem altere nenhuma outra tarefa. Não abra PR nem faça merge.

## Resumo das mudanças (checklist final)

- [ ] Tarefa 116 do `rastreio-backend` identificada como pré-requisito de deploy (não de aplicação do patch)
- [ ] Patch aplicado (`git apply`) sem conflitos (2 alterados, 1 novo)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos pré-existentes
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, título com `(feito)`, secção **Resultado** adicionada
- [ ] `.md` e `.patch` movidos para `src/docs/Tarefas feitas/` com o mesmo nome

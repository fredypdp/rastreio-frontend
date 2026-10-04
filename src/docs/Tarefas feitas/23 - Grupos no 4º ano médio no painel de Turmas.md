# Tarefa 23 — Grupos no 4º ano médio no painel de Turmas

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `ba333e2`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/` do pacote, com os mesmos caminhos do repositório
**Ordem de deploy:** depende da **Tarefa 116 do `rastreio-backend`** (campos `tema_trabalho` e `tipo_agrupamento`). Compila e funciona sem ela (a decisão grupo/turma é feita no frontend pelo nível `4_ano_medio`), **mas** o tema digitado só é guardado e devolvido quando a 116 estiver em produção.

---

## Contexto

No **4º ano do ensino médio** não existem turmas: os estudantes são separados em **grupos**, cada um com um trabalho de **tema** diferente. O painel de Turmas (`/gerenciamento/turmas`) só falava de "turma". Agora, **no 4º ano médio**, o painel fala de **grupo** e permite indicar o **tema do trabalho**. Os outros níveis ficam exatamente como estão.

O backend (Tarefa 116) manteve o agregado `Turma` — mesmas rotas, mesmo `codigo_turma` — e acrescentou `tipo_agrupamento` (`"grupo"`/`"turma"`) e `tema_trabalho` (opcional, só 4º ano médio, máx. 200 caracteres).

## O que foi atualizado e onde

**2 arquivos alterados + 1 novo.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/agrupamento.ts` (**novo**) | `ehGrupo` (linha 12) e `termoAgrupamento` | Única fonte da regra "este nível usa grupos": `NIVEL_GRUPOS = "4_ano_medio"`, `TEMA_TRABALHO_MAX = 200` |
| `src/types/api.ts` | `Turma` (linha 1455), `CriarTurmaRequest` (1125), `AtualizarTurmaRequest` (1134) | `Turma` ganha `tipo_agrupamento` e `tema_trabalho`; os dois requests ganham `tema_trabalho?`. As demais mudanças deste arquivo são da Tarefa 25 |
| `src/components/paineis/TurmasPainel.tsx` | import (linha 13), `grupoForm` (281), campo "Tema do trabalho" (624), envio do formulário (485), contadores por curso (723), além dos textos do cartão, modal de deletar, barra de lote e detalhe | Textos e ícone passam a depender de `ehGrupo(nivel)` |

**Comportamento no 4º ano médio (`nivel === "4_ano_medio"`):**

- **Cartão:** ícone de grupo e, se houver, `· Tema: …` ao lado do turno; botão "Deletar grupo".
- **Formulário:** título "Novo Grupo"/"Editar Grupo" (muda assim que o nível 4º ano médio é escolhido), "Código do Grupo", placeholder `Ex: G1, G2`, botão "Criar Grupo" e o campo **"Tema do trabalho (opcional)"** (máx. 200 caracteres, com texto de ajuda).
- **Envio:** ao **criar**, `tema_trabalho` só é enviado se preenchido; ao **editar**, é sempre enviado (vazio = remove o tema). Fora do 4º ano médio, `tema_trabalho` nunca é enviado.
- **Mensagens:** "Grupo criado/actualizado/deletado com sucesso", "Grupo ativado/desativado", "Erro ao guardar/deletar grupo", "Selecione o curso do grupo."
- **Modal de deletar:** "Deletar Grupo" / "Tem certeza que deseja deletar o grupo …".
- **Seleção em lote:** "grupo(s) selecionado(s)", "ativo(s)/inativo(s)" quando **todos** os selecionados são grupos.
- **Listas por curso/nível:** contador "N grupo(s)" e "N sem grupo"; cartão "Estudantes sem grupo"; botão "Voltar para grupos"; detalhe com `· Tema: …`; estado vazio "Nenhum estudante neste grupo".

**Nos outros níveis nada muda** (todos os textos continuam "turma"). Limitação aceita: o botão geral do cabeçalho do painel ("Nova Turma") mantém esse texto, porque o nível ainda não foi escolhido nesse momento.

## Validação realizada

**Baseline (`main` @ `ba333e2`, antes das mudanças):** `npx tsc --noEmit` sem erros; `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos antigos e em arquivos que as Tarefas 23/24/25 não tocam: `verificar-email/[token]/page.tsx` (erro 29:7), `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx` (erro 102:13), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`.

**Depois (clone novo de `main` @ `9b8a02f`, arquivos da pasta `rastreio-frontend/` copiados por cima — 8 alterados + 4 novos, 0 apagados):** `npx tsc --noEmit` sem nenhum erro; `npx eslint .` com saída **idêntica** à do baseline (mesmos 10 problemas, mesmos arquivos, nenhum novo).

**`next build`:** no ambiente de validação falha **só** por `Failed to fetch 'Outfit' from Google Fonts` (`fonts.googleapis.com` sem acesso) — limitação de rede, **não** erro de código. **Não foi possível abrir as páginas num navegador**; a parte visual foi validada por leitura do JSX final e por `tsc`/`eslint`.

## Como aplicar

As Tarefas 23, 24 e 25 são entregues **no mesmo pacote** (`types/api.ts` e `FaltasAcademia.tsx` contêm mudanças de mais de uma tarefa). Copie a pasta inteira de uma vez.

1. **Confirme que a base não mudou.** Os arquivos foram gerados sobre o código de `main` @ `ba333e2` (o `main` atual, `9b8a02f`, só acrescentou documentos de tarefa). Na raiz do repositório:
   ```bash
   git diff --stat ba333e2 HEAD -- src/app/\(painel\)/faltas/PageContent.tsx src/app/\(painel\)/notas/PageContent.tsx src/components/faltas/FaltasAcademia.tsx src/components/notas/NotasAcademia.tsx src/components/paineis/TurmasPainel.tsx src/lib/api/services.ts src/lib/route-guards.ts src/types/api.ts
   ```
   Saída **vazia** = pode substituir. Se aparecer algum arquivo, ele mudou depois da base: **não substitua** — avise para eu reconciliar.
2. **Copie** os arquivos da pasta `rastreio-frontend/` do pacote para a raiz do repositório, **mantendo os caminhos**. Os arquivos são **completos**: substituem os existentes por inteiro (não é para mesclar).
3. **Verifique** (secção abaixo).
4. **Marque como feito** (secção "Marcar como feito").

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)** — exatamente os antigos listados acima, em arquivos não relacionados a estas tarefas; **nenhum novo**. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração (`git checkout -- yarn.lock package-lock.json`).

## Fora de escopo

- **Não** alterar as outras telas que ainda dizem "turma" no 4º ano (cadastro/edição de estudante, matrículas, faltas, notas, avaliações finais, filtros): ficam para tarefa própria.
- **Não** mudar rotas nem nomes de campo (`codigo_turma`, `/academia/turma…` continuam iguais).
- **Não** criar página nova para grupos nem entidades de professor/secretário/encarregado (adiadas).
- **Não** mexer em `/faltas` nem `/notas` — Tarefas 24 e 25.

## Marcar como feito

1. Troque `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título.
2. Acrescente no fim uma secção **Resultado** com um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mova este documento de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, com o mesmo nome (a numeração 23 não muda).

## Checklist

- [ ] Tarefa 116 do `rastreio-backend` identificada como pré-requisito de deploy
- [ ] Base conferida (`git diff --stat ba333e2 HEAD -- …` vazio)
- [ ] Pasta `rastreio-frontend/` copiada por inteiro (8 alterados, 4 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos antigos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

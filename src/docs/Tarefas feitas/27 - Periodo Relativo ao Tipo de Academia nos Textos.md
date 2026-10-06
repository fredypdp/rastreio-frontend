# Tarefa 27 — "Período" relativo ao tipo de academia nos textos (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `7fa995f`
**Entrega:** apenas os arquivos novos ou atualizados, na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** nenhuma dependência do `rastreio-backend`; só textos. Pode ir a qualquer momento.

---

## Contexto

Na Tarefa 26 a primeira citação de "período" ficou escrita de forma crua, "período (trimestre/semestre)". A regra certa é que o tipo de período seja **relativo à academia** e valha para **qualquer texto que cite "período"**:

| Academia | Como se escreve |
| --- | --- |
| Escola (fundamental e médio) | `período (trimestre)` |
| Ensino superior | `período (semestre)` |

Exemplo: "Quando o estudante ultrapassa o limite de faltas numa matéria, num período (trimestre), …" numa escola, e "… num período (semestre), …" no superior.

**Ponto a confirmar:** o pedido escrevia "(semestre)" também para as escolas. Foi interpretado como `(trimestre)` para escolas, porque o ensino escolar usa 1º, 2º e 3º trimestre. Se for mesmo semestre nas escolas, é trocar uma linha em `nomeDoPeriodo`.

## Decisões de design

- **Um único helper**, `src/lib/periodo.ts`: `periodoComTipo(tipo, { maiuscula, plural })` devolve `período (trimestre)`, `Período (semestre)`, `períodos (trimestres)`, etc.; `tipoEnsinoDaAcademia(nivel)` e `tipoEnsinoDoNivelTurma(nivelTurma)` dizem qual é o tipo. O arquivo documenta a regra no topo.
- **Num mesmo texto basta explicar uma vez.** Na frase "num período (trimestre), a nota do professor … nesse período …", o segundo "período" fica simples.
- **De onde vem o tipo:** academia → `user.academia.nivel`; telas do estudante → o nível da turma (`N_ano_superior` é superior; fundamental e médio são escola); modelos Excel → `contexto.nivel`; regras de avaliação final → o tipo fixo da própria tela; telas que só existem no superior (matérias com período, cursos) levam `(semestre)` direto.
- **Substitui a regra da Tarefa 26:** `PERIODO_EXPLICADO` foi removida e `tipoEnsinoDaAcademia` passou de `faltasConfiguracaoTextos.ts` para `periodo.ts`.
- **Não confundir com o período do ano letivo** (janela de meses, por exemplo setembro a julho): esse é outro conceito e não recebe trimestre/semestre.

## O que foi atualizado e onde

**14 arquivos alterados + 1 novo.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/periodo.ts` (**novo**) | `periodoComTipo` (linha 38) | O helper e a regra |
| `src/lib/faltasConfiguracaoTextos.ts` | `textosReprovacaoPorFaltas` (linha 19) | A frase da reprovação por faltas usa `período (trimestre)` ou `período (semestre)`; removidos `PERIODO_EXPLICADO` e `tipoEnsinoDaAcademia` (movidos) |
| `src/components/faltas/ConfiguracaoFaltas.tsx` | título (linha 84), descrição (86), rótulo do campo do limite (93) | Os três citam o tipo de período da academia |
| `src/app/(painel)/faltas/configuracoes/PageContent.tsx` | `tipoEnsinoDaAcademia` (linha 42) | Importa do novo helper |
| `src/app/(painel)/faltas/lancar/SelecaoContextoFaltas.tsx` | tipo (linha 52), instrução (222), rótulo (296), placeholder (301), mensagem sem sumário (333) | "Período *" vira `Período (trimestre) *` ou `Período (semestre) *`; "Selecione o período" idem |
| `src/app/(painel)/notas/lancar/SelecaoContextoNotas.tsx` | tipo (linha 52), instrução (222), rótulo (296), placeholder (301) | Idem |
| `src/app/(painel)/faltas/lancar/faltasTemplate.ts` | folha de informações (linha 7) | O rótulo "Período" do modelo Excel segue o tipo de período; as chaves técnicas `periodo` e `periodo_label` **não mudam** |
| `src/app/(painel)/notas/lancar/notasTemplate.ts` | folha de informações e instrução 3 (linha 8) | Idem, e a instrução passa a dizer "turma, período (trimestre), matéria ou categoria" |
| `src/components/faltas/FaltasEstudante.tsx` | "Selecione o período" (linha 500) | Pelo nível da turma |
| `src/components/notas/NotasEstudante.tsx` | "Selecione o período" (linha 634) | Pelo nível da turma |
| `src/components/paineis/MateriaPainel.tsx` | selo (linha 200), aviso (633), rótulo (662), opção (667) | Só matérias superiores: "Período/semestre" vira `Período (semestre)` e as outras menções ganham `(semestre)` |
| `src/components/paineis/SumarioPainel.tsx` | tipo (linha 50), mensagem (95), rótulo (143), opção (143), aviso (146), cabeçalho da coluna (151) | Seguem o tipo da academia |
| `src/components/paineis/CursosPainel.tsx` | texto do curso superior (linha 356) | "semestres/períodos" vira `períodos (semestres)` |
| `src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx` | tipo (linha 80), descrição (182), rótulo do seletor (188) e opção (188) | Seguem o tipo da tela |
| `src/hooks/useAcademiaConfiguracaoStatus.ts` | passo "matérias" (linha 60) | "…para cada período (semestre) do curso." |

## O que não foi alterado, e por quê

- **Período do ano letivo** em `configuracoes/AcademiaSection.tsx` ("Período:") e a mensagem "Configure o período para visualizar a janela de finalização" em `types/api.ts`: é a janela de meses do ano, não trimestre nem semestre.
- **Páginas de administração e de testes** (`AdminSection.tsx`, `testes/PageContent.tsx`): mostram todos os tipos de ensino ao mesmo tempo, sem uma academia.
- **Comunicação** ("período de testes" do módulo) e **página pública** (`data/landingProfiles.ts`, "trimestre ou semestre"): outro sentido e sem academia logada.
- **Mensagens do backend:** as 40 mensagens técnicas (por exemplo "periodo é obrigatório para matérias do tipo superior") não sabem o tipo da academia e não foram tocadas. Se quiser, vira tarefa própria.
- **Comentários e nomes de variáveis** (`periodo`, `draftPeriodo`, `formatarPeriodo`).

## Validação realizada

**Baseline (`main` @ `7fa995f`):** `npx tsc --noEmit` sem erros; `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos antigos e em arquivos que esta tarefa não toca (`verificar-email/[token]/page.tsx`, `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx`, `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`).

**Depois (clone novo de `main`, os 15 arquivos copiados por cima):** `tsc` sem nenhum erro e `eslint .` com saída **idêntica** à do baseline.

**Renderização real de `ConfiguracaoFaltas`** para escola e superior, mais testes do helper: 16 verificações, todas OK. Entre elas: a escola só mostra `período (trimestre)` e o superior só `período (semestre)`; não sobrou nenhum "trimestre/semestre" cru; todo "período" vem com o tipo, exceto o "nesse período" da mesma frase; as maiúsculas e o plural saem certos; o nível `2_ano_superior` é superior e `9_ano_fundamental` e `4_ano_medio` são escola.

**Verificação por árvore sintática** nos 15 arquivos: 24 chamadas a `periodoComTipo` e **0** textos literais com código dentro (isto é, nenhum `{periodoComTipo(…)}` ficou escrito por engano entre aspas ou como texto, onde apareceria literalmente na tela).

**Ciclo reverter → falhar → restaurar:** superior a dizer trimestre, academia superior tratada como escola, rótulos sem maiúscula, título de volta a "período" cru e nível `_ano_superior` não reconhecido: cada uma fez o teste correspondente falhar; depois de restaurar, tudo voltou a passar.

**Limites:** `next build` não foi executado (as fontes do Google não carregam neste ambiente). Só a página de configuração de faltas foi renderizada; as outras telas (seleção de contexto, sumários, matérias, cursos, regras de avaliação final, telas do estudante) exigem login e API e foram validadas por `tsc`, `eslint` e pela verificação por árvore sintática, não vistas num navegador.

## Como aplicar

1. **Confirme que a base não mudou.** Na raiz do repositório:
   ```bash
   git diff --stat 7fa995f HEAD -- "src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx" "src/app/(painel)/faltas/configuracoes/PageContent.tsx" "src/app/(painel)/faltas/lancar/SelecaoContextoFaltas.tsx" "src/app/(painel)/faltas/lancar/faltasTemplate.ts" "src/app/(painel)/notas/lancar/SelecaoContextoNotas.tsx" "src/app/(painel)/notas/lancar/notasTemplate.ts" "src/components/faltas/ConfiguracaoFaltas.tsx" "src/components/faltas/FaltasEstudante.tsx" "src/components/notas/NotasEstudante.tsx" "src/components/paineis/CursosPainel.tsx" "src/components/paineis/MateriaPainel.tsx" "src/components/paineis/SumarioPainel.tsx" "src/hooks/useAcademiaConfiguracaoStatus.ts" "src/lib/faltasConfiguracaoTextos.ts"
   ```
   Saída **vazia** = pode substituir. Se aparecer algum arquivo, ele mudou depois da base: não substitua e avise.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos. Os arquivos são completos e substituem os existentes por inteiro.
3. **Verifique** e **marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)**, exatamente os antigos listados acima. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração.

## Fora de escopo

- **Não** alterar o backend nem as mensagens de erro da API.
- **Não** mexer no período do ano letivo, nas páginas de administração, nos testes, na comunicação nem na página pública.
- **Não** renomear identificadores nem as chaves técnicas dos modelos Excel (`periodo`, `periodo_label`).
- **Não** aplicar a regra a textos que não citam "período" como trimestre ou semestre.

## Marcar como feito

1. Troque `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título.
2. Acrescente no fim uma secção **Resultado** com um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mova este documento de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, com o mesmo nome.

## Checklist

- [ ] Base conferida (`git diff --stat 7fa995f HEAD -- …` vazio)
- [ ] Pasta copiada (14 alterados, 1 novo)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos antigos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Numa escola, os textos dizem "período (trimestre)"; num superior, "período (semestre)"
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

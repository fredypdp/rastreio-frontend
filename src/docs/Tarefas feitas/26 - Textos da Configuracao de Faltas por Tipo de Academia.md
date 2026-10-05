# Tarefa 26 — Textos da configuração de faltas por tipo de academia (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `6e9b88f`
**Entrega:** apenas os arquivos novos ou atualizados, na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** a página `/faltas/configuracoes` depende das rotas `GET`/`PUT /academia/faltas/configuracao` (Tarefa 117 do `rastreio-backend`) **e** da tabela criada pela migration 130 (Tarefa 118 do `rastreio-backend`). Enquanto essa migration não estiver aplicada em produção, a página mostra erro ao carregar. Esta tarefa em si só mexe em textos e pode ir a qualquer momento.

---

## Contexto

Pedido sobre a página `/faltas/configuracoes`:

1. Na secção **"Reprovação por faltas"**, não explicar tudo diretamente: o conteúdo deve ser **relativo ao tipo de academia** (escola ou ensino superior).
2. Seguindo o padrão de explicações simples ao utilizador, a **primeira citação de "período"** ligada a falta/nota deve ser **"período (trimestre/semestre)"**.

Antes, a secção listava as duas regras (escola e superior) juntas, com o código `exame_final` e dois avisos, tudo de uma vez, e o título "Limite de faltas por período" não explicava o termo.

## Decisões de design

- **Tipo de academia:** vem de `user.academia.nivel` do perfil (`'escola'` ou `'superior'`). "Escola" inclui fundamental, médio e misto (todos usam a nota do professor). Sem valor, assume escola, o mesmo critério já usado em `FaltasAcademia`.
- **Texto curto sempre visível, resto em "Saber mais":** a frase principal diz só o que acontece na academia de quem está a ver; as notas extras ficam num `<details>` fechado.
- **A explicação "(trimestre/semestre)" aparece uma única vez**, no primeiro título da página; depois basta "período". Está numa constante (`PERIODO_EXPLICADO`) para reutilizar noutras telas.
- Os textos ficam num arquivo próprio (`faltasConfiguracaoTextos.ts`), sem JSX, para poderem ser testados sem abrir a página.

## O que foi atualizado e onde

**2 arquivos alterados + 1 novo.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/faltasConfiguracaoTextos.ts` (**novo**) | `PERIODO_EXPLICADO`, `tipoEnsinoDaAcademia`, `textosReprovacaoPorFaltas` | Os textos por tipo de academia e a regra do primeiro "período" |
| `src/components/faltas/ConfiguracaoFaltas.tsx` | prop `tipoEnsino` na função do componente; título da 1ª secção; descrição da 1ª secção; secção "Reprovação por faltas" | Título passa a "Limite de faltas por período (trimestre/semestre)"; a descrição diz só "em cada período"; a secção de reprovação mostra o resumo do tipo de academia e um "Saber mais" com as notas extras |
| `src/app/(painel)/faltas/configuracoes/PageContent.tsx` | `<ConfiguracaoFaltas … />` | Passa `tipoEnsino={tipoEnsinoDaAcademia(user.academia?.nivel)}` |

**O que cada tipo de academia vê em "Reprovação por faltas":**

| Academia | Frase sempre visível | Em "Saber mais" |
| --- | --- | --- |
| Escola (fundamental, médio, misto) | "Quando o estudante ultrapassa o limite de faltas numa matéria, num período, **a nota do professor** dessa matéria nesse período passa a valer 0 (zero) no cálculo da avaliação final automática." | As outras notas não são afetadas; a regra vale quando a avaliação final é calculada e avaliações já calculadas não mudam, mesmo com mais faltas depois |
| Ensino superior | Mesma frase, com **o exame final** dessa matéria nesse período | As outras notas não são afetadas; a categoria de nota do exame final precisa ter o código `exame_final`; a mesma nota sobre o momento do cálculo |

O checkbox "Aplicar reprovação por faltas", o campo do limite e o botão "Guardar configuração" não mudam.

## Validação realizada

**Baseline (`main` @ `6e9b88f`):** `npx tsc --noEmit` sem erros; `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos antigos e em arquivos que esta tarefa não toca: `verificar-email/[token]/page.tsx` (erro 29:7), `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx` (erro 102:13), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`.

**Depois (clone novo de `main`, só os 3 arquivos acima copiados por cima):** `tsc` sem nenhum erro e `eslint .` com saída **idêntica** à do baseline.

**Teste de renderização real do componente** (React em servidor, com os serviços de API simulados) para escola e superior, 9 verificações, todas OK:

- a escola fala da nota do professor e não menciona exame final;
- o superior fala do exame final e do código `exame_final`, e não da nota do professor;
- nas duas, a primeira citação de "período" é "período (trimestre/semestre)", e essa explicação aparece uma única vez;
- o texto antigo "trimestre ou semestre" desapareceu;
- a explicação extra fica em "Saber mais";
- `tipoEnsinoDaAcademia` devolve superior só para `'superior'` e escola para `'escola'`, `undefined` e `null`.

**Ciclo reverter → falhar → restaurar:** voltar o título a "por período" faz as 4 verificações de "período" falharem; fazer o superior mostrar o texto da escola faz a verificação do superior falhar; fazer a página passar sempre "escola" faz a verificação de `tipoEnsinoDaAcademia` falhar. Depois de restaurar, tudo voltou a passar.

**Nota para quem mantém o arquivo:** na primeira versão, calcular os textos no topo do componente, antes dos hooks, fez o ESLint acusar "Existing memoization could not be preserved" no `useCallback`. O cálculo dos textos fica **depois dos hooks, logo antes do `return`**; assim o arquivo passa limpo.

`next build` não foi executado neste ambiente (as fontes do Google não carregam aqui); não vi a página num navegador, a parte visual foi validada pelo teste de renderização e por `tsc`/`eslint`.

## Como aplicar

1. **Confirme que a base não mudou.** Na raiz do repositório:
   ```bash
   git diff --stat 6e9b88f HEAD -- "src/components/faltas/ConfiguracaoFaltas.tsx" "src/app/(painel)/faltas/configuracoes/PageContent.tsx"
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

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)**, exatamente os antigos listados acima; nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração (`git checkout -- yarn.lock package-lock.json`).

## Fora de escopo

- **Não** alterar a regra de negócio nem o backend: quem decide qual nota é zerada é o backend (Tarefa 117).
- **Não** mudar o limite, o checkbox, o botão nem as validações da página.
- A regra do primeiro "período (trimestre/semestre)" foi aplicada só nesta página. Os textos de outras telas de faltas e notas **não** foram revistos.
- Não acrescentar alertas de "limite excedido" nem configuração por matéria.

## Marcar como feito

1. Troque `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título.
2. Acrescente no fim uma secção **Resultado** com um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mova este documento de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, com o mesmo nome.

## Checklist

- [ ] Base conferida (`git diff --stat 6e9b88f HEAD -- …` vazio)
- [ ] Pasta copiada (2 alterados, 1 novo)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos antigos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Na conta de uma escola, a secção mostra a nota do professor; na de um superior, o exame final
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

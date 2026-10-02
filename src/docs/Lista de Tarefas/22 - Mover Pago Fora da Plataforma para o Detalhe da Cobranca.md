# Tarefa 22 — Mover "Pago fora da plataforma" para o Detalhe da cobrança

**Estado:** pendente

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (validado contra o commit `214aeeb`, já com a Tarefa 20 integrada)
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `22 - Mover Pago Fora da Plataforma para o Detalhe da Cobranca.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover os arquivos conforme o Passo 3.

**Ordem de deploy:** só frontend; nenhuma rota, tipo ou campo da API muda. Continua a depender da **Tarefa 114 do backend** (já integrada), como a Tarefa 20. É **independente da Tarefa 21** (`package-lock.json`): o patch não toca em nenhum lockfile e foi verificado tanto sobre `main` pura quanto sobre `main` + patch da Tarefa 21.

---

## 0. Prompt recomendado para executar

> Aplique o patch `22 - Mover Pago Fora da Plataforma para o Detalhe da Cobranca.patch` com `git apply`, rode `npx tsc --noEmit` e o ESLint conforme o Passo 2, confirme o resultado esperado, e depois execute o Passo 3 (marcar a tarefa como feita e movê-la para `src/docs/Tarefas feitas/`). Não replaneje, não altere o código do patch, não abra PR.

## Contexto

Pedido do produto: o botão "Pago fora da plataforma" (criado na Tarefa 20, na linha da tabela de cobranças) deve ficar na subtela **"Detalhe da cobrança"**, **sob o texto** "Essa [tipo da cobrança] foi paga fora da plataforma?", com o botão **"Clique aqui para definir como paga"**.

Resultado final na subtela de detalhe (último bloco da tela, depois de "Estudante vinculado"):

```
Essa mensalidade foi paga fora da plataforma?
[ Clique aqui para definir como paga ]
```

- **[tipo da cobrança]** vem do campo `origem` e sempre é um substantivo feminino, então "Essa" concorda: `matricula` → "matrícula", `mensalidade` → "mensalidade", `avulsa` → "cobrança" (o rótulo "Outros" mostrado na interface não cabe numa frase). Exemplos: "Essa matrícula foi paga fora da plataforma?", "Essa mensalidade foi paga fora da plataforma?", "Essa cobrança foi paga fora da plataforma?".
- Clicar no botão abre o **mesmo modal de confirmação da Tarefa 20** (referência do comprovativo e observação, ambos opcionais, com o aviso de que o item não poderá mais ser cancelado/anulado/reativado). O modal foi mantido de propósito: a ação não tem volta.
- Depois do **sucesso**, a lista é recarregada e a subtela de detalhe **fecha** (volta para a lista, onde a linha aparece com o selo "Pago fora da plataforma"). Se a pendência não tinha cobrança, ela é substituída pela cobrança nova já paga (id diferente), por isso o detalhe antigo não pode continuar aberto.
- Em caso de **erro** da API (ex.: 409 "já foi paga"), o modal fecha e a mensagem aparece em vermelho **abaixo do botão**; o botão continua disponível e reabrir o modal limpa o erro.

### Quando o bloco aparece
Mesma regra da Tarefa 20 (`podeMarcarComoPagoExterno`), mais a exigência de o chamador ser **academia**:
- cobrança real com `status === "aguardando_pagamento"`; ou
- pendência sintética de **uma** mensalidade (`status === "pendente"`, `origem === "mensalidade"`, com `codigo_estudante` e exatamente 1 item em `mensalidades`).

Pago, cancelado, expirado e falhado **nunca** mostram o bloco. Quem não é academia (ex.: admin FPP, estudante) não recebe a prop e não vê o bloco.

## O que o patch faz

**3 arquivos alterados, 0 novos** (86 linhas adicionadas, 43 removidas):

| Arquivo | Mudança |
|---|---|
| `src/components/paineis/financeiroShared.tsx` | Novo helper `tipoCobrancaNaFrase(origem)`; **remove** da `CobrancasTable` a prop `onPagoExternamente`, o botão "Pago fora da plataforma" da linha, os estados e o modal (o selo "Pago fora da plataforma" e o método "Fora da plataforma" **continuam** na linha); `SubtelaDetalheCobranca` ganha a prop opcional `onPagoExternamente`, o bloco (pergunta + botão + erro) e o `PagamentoExternoDialog` |
| `src/components/paineis/PagamentosShared.tsx` | `PagamentosCobrancasSubtela` deixa de passar `onPagoExternamente` à tabela e passa ao **detalhe**, somente quando `isAcademia`; após `registrarPagamentoExterno` → `carregar()` → `setSelecionada(null)` |
| `src/components/paineis/CancelarCobrancaPainel.tsx` | Idem: a ação sai da tabela e vai para o detalhe; `carregar(codigoEstudante)` já fecha o detalhe (`setSelecionada(null)` está dentro de `carregar`) |

### ⚠️ Não use `finally` no `onConfirm` do detalhe
O handler do modal em `SubtelaDetalheCobranca` usa `try/catch` seguido de `setMarcandoPago(false)` **sem `finally`, de propósito** (há um comentário no código). Foi **medido**: com `finally` a regra `react-hooks/set-state-in-effect` deixa de ser avaliada no `useEffect` já existente em `SubtelaDetalheCobranca`, o `eslint-disable` dela vira "diretiva sem uso" e o lint ganha **1 aviso novo** (10 → 11 problemas); sem `finally`, o aviso some. (A causa provável é o compilador do React, que alimenta essas regras, deixar de analisar o componente; isso não foi investigado a fundo.) Se o Passo 2 mostrar esse aviso, é porque o patch foi alterado — aplique-o exatamente como está.

## O que já foi validado pelo orquestrador

Ambiente: Node 22.22, React 19.2.1, dependências instaladas com `npm ci` a partir do lock da Tarefa 21, clone **novo e limpo** de `main` (commit `214aeeb`) com o patch aplicado exatamente como você vai aplicar (o estado do clone ficou **byte a byte igual** ao patch).

- **`npx tsc --noEmit`:** sem erros.
- **ESLint** (com as versões travadas do lock): os 3 arquivos tocados **sem nenhum problema**; projeto inteiro (`npx eslint .`) com **10 problemas (2 erros, 8 avisos)**, idêntico ao baseline medido na Tarefa 21 (todos em código que esta tarefa não toca).
- **`next build`:** `✓ Compiled successfully in 57s` e `✓ Generating static pages (66/66)`, com a fonte do Google desligada **temporariamente** em `src/app/layout.tsx` (só no sandbox do orquestrador, que bloqueia `fonts.googleapis.com`; revertido, **não** faz parte do patch).
- **Verificação de comportamento em DOM simulado (jsdom + React 19, cliques reais), com scripts temporários que NÃO fazem parte do repositório** (o projeto não tem framework de teste de UI): **50 verificações, todas passando**:
  - o texto exato da pergunta para `mensalidade`, `matricula` e `avulsa`, e o botão **sob** a pergunta, no mesmo bloco;
  - o bloco **não** aparece: sem a prop (não-academia), com status `Success`/`cancelada`/`expirada`/`falhada`, já pago fora da plataforma, pendência sem mês identificado e pendência com 2 meses;
  - clicar abre o modal (2 campos opcionais); confirmar chama a ação **uma vez** com o id da cobrança e os dados digitados; campos em branco viram `undefined`; "Voltar" fecha sem executar nada;
  - erro da API: a mensagem aparece sob o botão, o modal fecha, o botão volta a ficar habilitado e reabrir limpa o erro; durante a chamada o botão do modal mostra "Aguarde..." e fica desabilitado;
  - tabela: **nenhuma linha** tem o botão "Pago fora da plataforma"; "Ver detalhes" continua em todas; o selo aparece só na linha paga fora da plataforma; "Cancelar" só na cobrança aberta;
  - **chamadores reais** (`PagamentosCobrancasSubtela` e `CancelarCobrancaPainel`, com os serviços simulados): lista → "Ver detalhes" → confirmar → a rota correta é chamada (`pago-externamente` por cobrança para `aguardando_pagamento`; por mensalidade, com `codigo_estudante` e `meses: [{ano_letivo, mes}]`, para pendência) → a lista é **recarregada** → o detalhe **fecha** → a linha mostra o selo; para não-academia o detalhe não tem pergunta nem botão.
- **Ciclos revert → falha → reaplicar:** com o código **antigo** (`main`), as 9 verificações de texto/posição **falham**; removendo só o `setSelecionada(null)` do `PagamentosShared`, falham "detalhe fecha" e "selo exibido"; removendo só a passagem da ação ao detalhe, falha "detalhe abre com a pergunta"; restaurado, voltam a passar todas.
- **Não validado:** execução no navegador real contra um backend real, e o visual (espaçamentos/cores) — o bloco reutiliza as mesmas classes de borda/tipografia dos blocos vizinhos do detalhe.

### Fragilidades pré-existentes (não são desta tarefa)
- `npm ci` falha em `main` enquanto a **Tarefa 21** (sincronizar `package-lock.json`) não estiver integrada; e o npm **reescreve o `yarn.lock`** a cada `install`/`ci` (descarte com `git checkout -- yarn.lock`).
- Sem o lock da Tarefa 21, uma instalação com `npm install` resolve versões mais novas dos plugins e o ESLint do projeto passa a reportar ~170 problemas (inclusive 1 erro antigo em `PagamentosShared.tsx`, `setState` síncrono dentro de `useEffect`, num trecho que este patch não toca). Esse é o motivo de o critério abaixo ser relativo ao baseline.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/22 - Mover Pago Fora da Plataforma para o Detalhe da Cobranca.patch"
```

Deve **alterar 3 arquivos** (nenhum novo). Se `git apply` falhar, PARE — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm ci            # se a Tarefa 21 ainda não estiver integrada e falhar com EUSAGE, use: npm install
git checkout -- yarn.lock package-lock.json   # descarta qualquer reescrita feita pelo npm
git status --short
npx tsc --noEmit
npx eslint src/components/paineis/financeiroShared.tsx src/components/paineis/PagamentosShared.tsx src/components/paineis/CancelarCobrancaPainel.tsx
npx eslint .
```

- `git status --short`: deve mostrar **apenas** os 3 arquivos de `src/components/paineis/` (mais os `.md`/`.patch` desta tarefa, se já movidos). Nada em `package.json`, `package-lock.json` ou `yarn.lock`.
- `npx tsc --noEmit`: **nenhuma saída**.
- ESLint nos 3 arquivos: sem **nenhum problema novo**. Com o lock da Tarefa 21 a saída esperada é **vazia**. Sem esse lock, só é aceitável o **1 erro antigo** de `PagamentosShared.tsx` (`set-state-in-effect`); qualquer aviso "Unused eslint-disable directive" em `financeiroShared.tsx` indica que o patch foi alterado.
- `npx eslint .`: com o lock da Tarefa 21, total esperado **10 problemas (2 erros, 8 avisos)**; sem ele, o total é maior mas **não pode subir** em relação ao que você medir antes do patch (`git stash` → `npx eslint .` → `git stash pop`).
- **Não** rode `next build` como critério de aceite (pode falhar por rede/Google Fonts no seu ambiente).
- Se `npm install`/`npm ci` falhar por **rede**, PARE nesse ponto e reporte o erro exato: o patch já foi validado pelo orquestrador.

## O que NÃO fazer (fora de escopo)

- **Não** manter o botão na linha da tabela: ele foi **movido**, não duplicado. O selo "Pago fora da plataforma" na linha **permanece**.
- **Não** remover nem alterar o modal `PagamentoExternoDialog` (campos, textos, limites de 100/500 caracteres): só muda **onde** ele é aberto.
- **Não** adicionar o bloco em `EstudantePagamentosPainel.tsx` (o estudante nunca marca pagamento) nem em telas de admin FPP.
- **Não** alterar o backend, os tipos de `src/types/api.ts` nem `src/lib/api/services.ts`.
- **Não** criar fluxo de "pago fora da plataforma" para matrícula ou serviço extra **sem cobrança gerada** (o backend não suporta; fora do escopo da Tarefa 114).
- **Não** adicionar testes automatizados nem dependências (jsdom etc.): os scripts de verificação do orquestrador são temporários.
- **Não** mexer em `src/app/layout.tsx`, `package.json`, `package-lock.json` ou `yarn.lock`; **não** corrigir problemas de lint pré-existentes.
- **Não** abrir PR nem fazer merge — deixar o commit pronto para revisão.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema:

1. Neste documento, troque a linha `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título (`# (feito) Tarefa 22 — …`).
2. Acrescente, ao final, uma secção **Resultado** com um parágrafo curto descrevendo o que foi efetivamente feito e qualquer desvio pontual.
3. Mova este `.md` **e** o `.patch` de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome** (a numeração 22 não muda).
4. Não renumere nem altere nenhuma outra tarefa.

## Checklist de aceitação

- [ ] Patch aplicado (`git apply`) sem conflitos (3 arquivos alterados)
- [ ] `npx tsc --noEmit` limpo
- [ ] ESLint nos 3 arquivos sem problemas novos; `npx eslint .` sem aumento em relação ao baseline (com o lock da Tarefa 21: 10 = 2 erros + 8 avisos)
- [ ] `package.json`, `package-lock.json` e `yarn.lock` **sem** alterações no commit
- [ ] Na listagem, as linhas **não** têm mais o botão "Pago fora da plataforma" (o selo continua nas linhas pagas externamente)
- [ ] No "Detalhe da cobrança" da academia, só em cobrança `aguardando_pagamento` ou pendência `pendente` de mensalidade, aparece "Essa [matrícula|mensalidade|cobrança] foi paga fora da plataforma?" com o botão "Clique aqui para definir como paga" logo abaixo
- [ ] Após confirmar no modal com sucesso, o detalhe fecha e a lista recarregada mostra o selo "Pago fora da plataforma"; em erro, a mensagem aparece abaixo do botão
- [ ] Estado trocado para **feito**, título com `(feito)`, secção **Resultado** adicionada
- [ ] `.md` e `.patch` movidos para `src/docs/Tarefas feitas/` com o mesmo nome

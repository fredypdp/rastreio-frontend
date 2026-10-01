# (feito) Tarefa 20 — Marcar cobrança/pendência como paga fora da plataforma

**Estado:** feito

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (validado contra o commit `182e6da`)
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `20 - Marcar Cobranca como Paga Fora da Plataforma.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover os arquivos conforme o Passo 3.

**Ordem de deploy:** depende da **Tarefa 114 do `rastreio-backend`** já estar em produção (ver aviso abaixo).

---

## ⚠️ Dependência de outra tarefa

**Tarefa 114 do `rastreio-backend`** ("Pagamento Externo e Bloqueio de Anular Reativar Cancelar Cobranca Paga") cria as duas rotas novas que esta tarefa chama e os campos novos `pagamento_externo` e `referencia_externa` que esta tarefa lê.

- **Se esta tarefa for para produção antes da 114:** a listagem continua a funcionar normalmente (os campos novos são opcionais), mas o botão "Pago fora da plataforma" devolve erro (rota inexistente, 404) ao ser usado — a mensagem aparece no próprio quadro, sem quebrar a tela.
- **Se a 114 for primeiro (ordem recomendada):** nada quebra no frontend atual. A 114 só passa a devolver `409` ao anular/reativar/cancelar algo já pago, e esses erros já são exibidos pelo `formatApiError` das telas existentes.

---

## 0. Prompt recomendado para executar

> Aplique o patch `20 - Marcar Cobranca como Paga Fora da Plataforma.patch` com `git apply`, rode `npm install`, `npx tsc --noEmit` e `npx eslint .`, confirme o resultado esperado descrito no Passo 2, e depois execute o Passo 3 (marcar a tarefa como feita e movê-la para `src/docs/Tarefas feitas/`). Não replaneje, não altere o código do patch, não abra PR.

## Contexto do problema

Pedido: **poder definir manualmente que um pagamento foi feito fora da plataforma** — a academia marca a cobrança/pendência como paga e o sistema segue o mesmo processo de um pagamento validado dentro do ecossistema (a lógica toda está no backend, Tarefa 114). Esta tarefa é só a parte visual/de chamada de API:

- Na listagem de cobranças da academia, cada item elegível ganha o botão **"Pago fora da plataforma"**, que abre um modal de confirmação com dois campos opcionais (referência do comprovativo e observação).
- Itens já pagos fora da plataforma ganham o selo **"Pago fora da plataforma"** e o método passa a aparecer como "Fora da plataforma".
- O segundo pedido (só anular/reativar/cancelar o que nunca foi pago) é **aplicado pelo backend** (HTTP 409 com mensagem). O frontend **não precisa de mudança** nas telas de anular/reativar: elas já exibem a mensagem devolvida pela API via `formatApiError`. O botão "Cancelar" já não aparecia para cobranças pagas; agora também nunca aparece para as pagas fora da plataforma.

## O que o patch faz

**5 arquivos alterados, 0 novos** (187 linhas adicionadas, 7 removidas):

| Arquivo | Mudança |
|---|---|
| `src/types/api.ts` | `CobrancaResumo` ganha `pagamento_externo?: boolean` e `referencia_externa?: string`; `metodo_pagamento` passa a aceitar também `'EXTERNO'`; novos tipos `PagamentoExternoInput`, `PagamentoExternoMensalidadesInput`, `PagamentoExternoResultado` |
| `src/lib/api/services.ts` | `financeiroService.registrarPagamentoExternoCobranca(id, data?)` → `POST /financeiro/appypay/cobrancas/:id/pago-externamente` e `registrarPagamentoExternoMensalidades(data)` → `POST /financeiro/mensalidades/obrigacoes/pago-externamente` |
| `src/components/paineis/financeiroShared.tsx` | `rotuloMetodoCobranca()` (mostra "Fora da plataforma"); `podeMarcarComoPagoExterno()`; `registrarPagamentoExterno()` (escolhe a rota certa); componente `PagamentoExternoDialog` (modal); `CobrancasTable` ganha a prop opcional `onPagoExternamente`, o botão, o selo e o modal; `cancelavel` nunca é verdadeiro para `pagamento_externo`; o detalhe da cobrança mostra aviso e a referência do comprovativo |
| `src/components/paineis/PagamentosShared.tsx` | `PagamentosCobrancasSubtela` passa `onPagoExternamente` **somente** quando o usuário é academia (`useUserType().isAcademia`) |
| `src/components/paineis/CancelarCobrancaPainel.tsx` | Passa `onPagoExternamente` e recarrega as cobranças do estudante depois (a tela já é exclusiva da academia; o admin FPP é bloqueado) |

### Regra de quando o botão aparece (`podeMarcarComoPagoExterno`)

- Cobrança **real** com `status === "aguardando_pagamento"` → chama `…/cobrancas/:id/pago-externamente`.
- Pendência **sintética** de **uma** mensalidade (`status === "pendente"`, `origem === "mensalidade"`, com `codigo_estudante` e exatamente 1 item em `mensalidades`) → chama `…/mensalidades/obrigacoes/pago-externamente` com `{ codigo_estudante, meses: [{ ano_letivo, mes }] }`.
- Pago, cancelado, expirado e falhado **nunca** mostram o botão. O botão só é entregue à tabela quando o usuário é academia.

## O que já foi verificado noutras páginas

- `EstudantePagamentosPainel.tsx` também usa `CobrancasTable`, mas **sem** `onCancelar`/`onPagoExternamente` (o estudante só consulta) — por isso não recebe o botão. Nada a mudar lá; serviu de confirmação de que a prop é opcional e não afeta quem não a passa.
- `AnularReativarObrigacoesForm.tsx` já exibe o erro da API (`formatApiError`, linha 66); não precisa de mudança para mostrar o `409`.

## O que já foi validado pelo orquestrador

Ambiente: Node 22; dependências instaladas com `npm install --no-package-lock` (ver "Fragilidades pré-existentes").

- **`npx tsc --noEmit`:** baseline (antes do patch) sem erros; com o patch, sem erros — também num **clone novo e limpo de `main`** (commit `182e6da`) com o patch aplicado exatamente como você vai aplicar (o estado do clone ficou **byte a byte igual** ao patch).
- **`npx eslint src`:** baseline **170 problemas (162 erros, 8 avisos)** no projeto inteiro; com o patch, **170 problemas (162 erros, 8 avisos)** — idêntico, zero novos. Nos 5 arquivos tocados, erros/avisos iguais ao baseline arquivo a arquivo (o único é 1 erro pré-existente em `PagamentosShared.tsx`: `setState` síncrono dentro de `useEffect`, num trecho que este patch não toca).
- **`next build`:** o build padrão falha **só** por `fonts.googleapis.com` bloqueado no sandbox do orquestrador (`Failed to fetch Outfit from Google Fonts`) — limitação de rede do sandbox, **não** é erro de código. Para validar a compilação mesmo assim, o orquestrador desligou **temporariamente** a fonte do Google em `src/app/layout.tsx` (revertido, **não** faz parte do patch) e rodou o build: `✓ Compiled successfully in 42s` e `✓ Generating static pages (66/66)`.
- **Não validado no navegador:** não houve execução da interface contra um backend real. A cobertura é de tipos, lint e compilação; o comportamento do backend que a UI chama foi validado com PostgreSQL real na Tarefa 114.

### Fragilidades pré-existentes (não são desta tarefa)

- `npm ci` **falha**: `package.json` e `package-lock.json` estão fora de sincronia (faltam no lock `@emotion/react`, `@emotion/styled`, `@iconify/react`, `@mui/material`, entre outros). Por isso o Passo 2 usa `npm install`. **Não commite alterações em `package-lock.json`** — se o `npm install` modificar o lockfile, descarte essa mudança (`git checkout -- package-lock.json`).
- O `eslint` do projeto tem 170 problemas antigos (ver acima). O critério desta tarefa é **nenhum problema novo**, não zerar o lint.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/20 - Marcar Cobranca como Paga Fora da Plataforma.patch"
```

Deve **alterar 5 arquivos** (nenhum novo). Se `git apply` falhar, PARE — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

- `npx tsc --noEmit`: **nenhuma saída** (sem erros).
- `npx eslint .`: sem nenhum erro/aviso **novo**. Os problemas pré-existentes continuam (no `eslint src` do orquestrador o total é **170 problemas: 162 erros e 8 avisos**, antes e depois do patch). Se quiser confirmar nos arquivos tocados: `npx eslint src/components/paineis/financeiroShared.tsx src/components/paineis/CancelarCobrancaPainel.tsx src/lib/api/services.ts src/types/api.ts` deve terminar sem erros; `src/components/paineis/PagamentosShared.tsx` mostra **1** erro, que já existia.
- Se `npm install` alterar `package-lock.json`, descarte (`git checkout -- package-lock.json`).
- **Não** rode `next build` como critério de aceite: ele pode falhar por rede (Google Fonts) no seu ambiente, e isso não indica problema no patch.

## O que NÃO fazer (fora de escopo)

- **Não** alterar as telas de anular/reativar mensalidade ou serviço extra: o bloqueio é do backend (Tarefa 114) e a mensagem já aparece.
- **Não** adicionar o botão a `EstudantePagamentosPainel.tsx` (o estudante nunca marca pagamento) nem a nenhuma tela de admin FPP.
- **Não** criar fluxo de "pago fora da plataforma" para matrícula ou serviço extra **sem cobrança gerada** — o backend não os suporta (fora de escopo da 114).
- **Não** mexer em `src/app/layout.tsx` nem no carregamento da fonte Google.
- **Não** corrigir os problemas de lint pré-existentes nem sincronizar `package-lock.json`.
- **Não** abrir PR nem fazer merge — deixar o commit pronto para revisão.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema:

1. Neste documento, troque a linha `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título (`# (feito) Tarefa 20 — …`).
2. Acrescente, ao final, uma secção **Resultado** com um parágrafo curto descrevendo o que foi efetivamente feito e qualquer desvio pontual.
3. Mova este `.md` **e** o `.patch` de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome** (a numeração 20 não muda).
4. Não renumere nem altere nenhuma outra tarefa.

## Checklist de aceitação

- [ ] Patch aplicado (`git apply`) sem conflitos (5 arquivos alterados)
- [ ] `npx tsc --noEmit` limpo
- [ ] `npx eslint .` sem erros/avisos novos (total pré-existente: 170 problemas)
- [ ] `package-lock.json` sem alterações no commit
- [ ] Na listagem da academia, o botão "Pago fora da plataforma" só aparece em cobrança `aguardando_pagamento` e em pendência `pendente` de mensalidade
- [ ] O modal tem 2 campos opcionais (referência até 100 e observação até 500 caracteres) e o botão "Voltar" fecha sem executar nada
- [ ] Item pago fora da plataforma mostra o selo "Pago fora da plataforma", método "Fora da plataforma" e **não** mostra o botão "Cancelar"
- [ ] Estado trocado para **feito**, título com `(feito)`, secção **Resultado** adicionada
- [ ] `.md` e `.patch` movidos para `src/docs/Tarefas feitas/` com o mesmo nome


## Resultado

O patch foi aplicado sem conflitos, disponibilizando o fluxo de marcar cobranças e pendências de mensalidade elegíveis como pagas fora da plataforma. A verificação de tipos passou; o lint dos arquivos alterados passou e o lint global manteve apenas os problemas pré-existentes. `npm install` não concluiu por um erro 403 de acesso ao registo de pacotes, sem alterar o `package-lock.json`.

# Tarefa 10 — Serviços Extras: métodos de pagamento sumidos e exclusão de Categoria/Serviço

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Depende de:** Tarefa 107 do backend (`rastreio-backend`, "Deletar Categoria de Servico e Servico Extra") — os botões de "Excluir" desta tarefa chamam as rotas `DELETE /academia/categorias-servico/:id` e `DELETE /academia/servicos-extras/:id`, que só existem depois daquela tarefa. Aplique a Tarefa 107 do backend antes desta.
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `10 - Servicos Extras Metodos de Pagamento e Exclusao.patch`, nesta mesma pasta. Aplique o patch e rode as verificações do Passo 2. Se o patch não aplicar de primeira, PARE e reporte o conflito em vez de recriar as mudanças manualmente.

---

## Contexto do problema — dois bugs reais confirmados, não suspeita

### 1. Métodos de pagamento sumidos (bug bloqueante)

Em `src/components/paineis/ServicosExtrasPainel.tsx`, o formulário de criar/editar um serviço extra tem os campos "Serviço pago" e "Tem taxa de inscrição", e o código já monta o payload com `metodos_pagamento` e `metodos_pagamento_taxa_inscricao` — mas **não existe nenhum checkbox no JSX para o usuário escolher esses métodos**. A variável `const pay: MetodoPagamentoServico[] = ["GPO", "REF", "GPO_QR"]` estava declarada no topo do arquivo e **nunca era usada em lugar nenhum** — sinal claro de que a lista de checkboxes existia antes e foi removida ou nunca chegou a ser ligada à UI.

Confirmei no backend (`internal/domain/aggregates/servico_extra.go`, `validarCamposPagamentoServico`/`validarCamposTaxaInscricao`) que `metodos_pagamento` é **obrigatório** (não pode ser vazio) quando `pago=true`, e o mesmo vale para `metodos_pagamento_taxa_inscricao` quando `tem_taxa_inscricao=true`. Ou seja: **hoje é impossível criar um serviço pago ou com taxa de inscrição pela UI** — a submissão sempre falha com erro de validação do backend, porque o formulário nunca envia nenhum método.

### 2. Nem sequer existe Ativar/Desativar de Serviço Extra na lista (pré-requisito da exclusão)

Ao investigar a exclusão pedida, percebi que a lista de Serviços Extras (`ServicosExtrasPainel.tsx`, view "lista") só tinha o botão "Editar" — nenhuma coluna de status, nenhum botão de Ativar/Desativar, mesmo o backend (`desativarServicoExtra`/`reativarServicoExtra`) já existindo há tempos em `src/lib/api/services.ts` sem nenhuma tela chamando essas funções. Como a exclusão (Tarefa 107 do backend) **exige que o serviço já esteja inativo**, era preciso corrigir isso também — sem Ativar/Desativar funcionando na UI, o botão de Excluir nunca teria como ser habilitado.

### 3. Categoria de Serviço e Serviço Extra nunca podiam ser deletados

Confirmado nas rotas do backend (antes da Tarefa 107): só existiam `PUT .../desativar` e `PUT .../reativar`, nunca `DELETE`. A Tarefa 107 do backend adicionou as rotas; esta tarefa liga a UI a elas.

## O que o patch faz

### `src/lib/api/services.ts`
Duas funções novas, mesmo padrão das de desativar/reativar: `deletarCategoriaServico(id, motivo?, token?)` e `deletarServicoExtra(id, motivo?, token?)`, chamando `DELETE /academia/categorias-servico/:id` e `DELETE /academia/servicos-extras/:id` (ambas aceitam um `motivo` opcional no corpo, para auditoria).

### `src/components/paineis/ServicosExtrasPainel.tsx`
- Dentro de "Serviço pago", quando marcado: uma lista de checkboxes (usando os mesmos rótulos de `METODO_PAGAMENTO_LABEL`, já usados no resto do app, em vez de inventar texto novo) ligada a `form.metodos`.
- Dentro de "Tem taxa de inscrição", quando marcado: a mesma lista de checkboxes, ligada a `form.metodosTaxa`.
- Validação no cliente antes de enviar: se `pago` e `metodos` vazio (ou `taxa` e `metodosTaxa` vazio), mostra um aviso claro em vez de deixar a submissão falhar só no backend.
- Na lista de serviços: coluna "Status" nova, botão "Desativar"/"Reativar" (ligado às funções que já existiam em `services.ts` mas não eram usadas por nenhuma tela), e botão "Excluir" — só aparece quando o serviço já está inativo, com uma confirmação (`ConfirmDialog`, componente já existente em `financeiroShared.tsx`) explicando que só funciona sem inscrições pendentes/vinculadas.

### `src/components/paineis/CategoriasServicoPainel.tsx`
Botão "Excluir" na lista de categorias, só habilitado quando a categoria já está inativa, com a mesma confirmação explicando a pré-condição (sem serviços vinculados).

## O que já foi validado pelo orquestrador

- `npx tsc --noEmit` — sem erros, no repositório inteiro, depois de todas as mudanças.
- `npx eslint` nos dois arquivos alterados — **zero erros**; um warning (`react-hooks/exhaustive-deps`) permanece em cada um dos dois arquivos, mas já existia antes desta tarefa (confirmado comparando com o código antes do patch — nenhum dos dois `useEffect` apontados foi tocado por esta tarefa).
- Reli o `servicoExtraPayload`/validação completa do backend (`internal/handlers/servico_extra_handlers.go`) depois de adicionar os checkboxes, para confirmar que agora **todos** os campos que a API exige ou aceita para criar/editar um serviço têm um controle correspondente no formulário — não sobrou nenhum campo faltando.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/10 - Servicos Extras Metodos de Pagamento e Exclusao.patch"
```

Se o `git apply` falhar, PARE e reporte o conflito em vez de recriar as mudanças manualmente.

## Passo 2 — Verificação

```bash
npx tsc --noEmit
npx eslint src/components/paineis/ServicosExtrasPainel.tsx src/components/paineis/CategoriasServicoPainel.tsx src/lib/api/services.ts
```

Ambos devem terminar sem erro (o warning pré-existente de `react-hooks/exhaustive-deps` em cada arquivo pode continuar aparecendo — não é desta tarefa).

## O que NÃO fazer (fora de escopo)

- Não implemente o `DELETE` no backend aqui — isso é a Tarefa 107 do backend, que precisa já estar aplicada antes desta.
- Não altere a regra de que o botão "Excluir" só aparece quando o item já está inativo — é assim que a pré-condição do backend funciona.
- Não mude os rótulos dos métodos de pagamento — reaproveite `METODO_PAGAMENTO_LABEL` de `financeiroShared.tsx`, não crie um mapa de rótulos novo e diferente para serviços extras.
- Esta tarefa **não depende** da Tarefa 9 (Restruturação de Finanças &gt; Configurações) — pode ser aplicada e testada de forma independente dela, desde que a Tarefa 107 do backend já esteja pronta.

## Passo 3 — Marcar como feito

Depois que o Passo 2 passar sem problema:

1. Se a pasta `src/docs/Tarefas feitas/` ainda não existir (pode já ter sido criada pela Tarefa 9), crie-a.
2. Mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.
3. Marque os itens do checklist abaixo.

## Resumo das mudanças (checklist final)

- [x] Tarefa 107 do backend já aplicada (pré-requisito)
- [x] Patch aplicado sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint` sem novos erros
- [x] Criar um serviço marcado como "pago" sem escolher método de pagamento mostra aviso no cliente, não erro cru da API
- [x] Lista de Serviços Extras mostra Status + Desativar/Reativar + Excluir (Excluir só quando inativo)
- [x] Lista de Categorias de Serviço mostra Excluir (só quando inativa)
- [x] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

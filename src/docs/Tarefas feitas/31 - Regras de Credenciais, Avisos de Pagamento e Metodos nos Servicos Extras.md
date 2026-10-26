# Tarefa 31 — Regras de credenciais, avisos de pagamento indisponível e métodos por provedor nos serviços extras (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `df740f5` (commit completo `df740f5d66ad3196df5bbf5d0e7b2058e38f590c`, "documentação atualizada"). A Tarefa 30 já está aplicada nessa base (`/financas/configuracoes/provedor`, `ProvedorPagamentoPainel`). Conferido antes de entregar: `origin/main` continuava em `df740f5`.
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório (10 alterados, 1 novo: este documento). Nenhum arquivo é apagado, renomeado ou movido.
**Ordem de deploy:** depende da **Tarefa 121 — Job de reconciliação de cobranças, snapshot ao editar credenciais e métodos por pagador** do `rastreio-backend`, que deve ir **antes**. Sem ela este frontend continua a funcionar (todos os campos novos são opcionais e têm texto de reserva), mas não mostra o motivo específico quando a lista de métodos vem vazia nem o resultado detalhado da edição de credenciais, e o formulário de serviço extra passa a esconder métodos que o backend antigo ainda aceitaria.
**Antes de aplicar, confirme:** que o backend da Tarefa 121 está em produção.

---

## Contexto

Pedido desta tarefa (parte frontend da atualização que o backend entrega na Tarefa 121):

1. **Filtro de métodos de pagamento** também nos serviços extras e em qualquer outro módulo com pagamentos: na configuração (academia) e na tela de pagamento (estudante e candidato).
2. Quando a lista de métodos vem vazia por falta de provedor, **dizer isso** ao pagador.
3. **Representar as regras de negócio** da troca/atualização de credenciais na tela.

Decisões:

- **Uma regra, vários lugares.** Na configuração, só os métodos que o provedor ativo suporta podem ser escolhidos e só eles são enviados (o mesmo mecanismo da Tarefa 30, agora também nos serviços extras). No pagamento, o backend já devolve a lista filtrada e o frontend mostra **o motivo** quando ela vem vazia.
- **Nunca botões desabilitados sem explicação.** O componente `AvisoMetodosIndisponiveis` usa a `mensagem` do backend e, sem ela, um texto de reserva no vocabulário das telas do estudante ("instituição", "secretaria"). Substituiu o seletor e o botão de pagar nos quatro pontos do pagador.
- **A edição de credenciais deixou de exigir "remover e cadastrar de novo".** O backend arquiva as credenciais anteriores ao editar com pendentes; o aviso antigo ficou **errado** e foi reescrito. Antes de salvar, o formulário explica o que vai acontecer (com ou sem pendentes); depois de salvar, a mensagem descreve o que o backend fez (arquivou, não arquivou porque nada mudou ou porque as pendentes já usam credenciais arquivadas, ou simples substituição).
- **A visão da academia continua sem filtro**, mas **sinaliza** no detalhe do serviço extra o que o provedor atual não suporta, para ela corrigir.
- Dois defeitos antigos corrigidos por serem a mesma tela: no checkout da propina, com a lista vazia o método padrão continuava `GPO` e o botão "Confirmar pagamento" ficava ativo; na matrícula pública, com a taxa pendente e sem métodos, a tela dizia que nenhum pagamento estava pendente.

## O que foi atualizado e onde

**10 arquivos alterados + 1 novo (este documento).** Nenhum arquivo é apagado, renomeado ou movido.

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/types/api.ts` (44 linhas adicionadas, 0 removidas) | FinanceiroCredencial (l. 1528); FinanceiroAvisoMetodosCodigo (l. 1554); FinanceiroAvisoMetodos (l. 1563); avisos em ServicoExtra (l. 1368); aviso da taxa em inscrição (l. 1414); avisos por academia (propina) (l. 1809); aviso no status da matrícula (l. 2018) | Tipos novos `FinanceiroAvisoMetodosCodigo` e `FinanceiroAvisoMetodos`; `snapshot_criado` e `cobrancas_pendentes` (só na resposta de uma edição) em `FinanceiroCredencial`; campos de aviso (todos opcionais) nas respostas do serviço extra, da inscrição, das propinas do estudante e do status da matrícula. |
| `src/components/paineis/financeiroShared.tsx` (20 linhas adicionadas, 1 removidas) | AvisoMetodosIndisponiveis (l. 381) | Componente `AvisoMetodosIndisponiveis`: explica ao pagador por que não há como pagar online (mensagem do backend, com texto de reserva), em vez de botões desabilitados. |
| `src/components/paineis/financeiroNivelShared.tsx` (21 linhas adicionadas, 1 removidas) | MetodosPagamentoCheckboxes (l. 237); useMetodosDoProvedor (l. 210) | Hook `useMetodosDoProvedor` (métodos do provedor ativo da academia, `null` enquanto carrega) para telas que não usam o contexto financeiro; `MetodosPagamentoCheckboxes` passa a aceitar `servico` e `taxa_inscricao`. |
| `src/components/paineis/ProvedorPagamentoPainel.tsx` (33 linhas adicionadas, 4 removidas) | alertaDaEdicao (l. 101); resultado da edição (handleSubmit) (l. 271); alerta "Cobranças pendentes protegidas" (l. 551); alerta "Sem cobranças pendentes" (l. 553); cartão do provedor (arquivadas) (l. 458); manual (editar/trocar de conta) (l. 389) | Regras de edição e troca de conta: o alerta antigo mandava "remover e cadastrar de novo", o que deixou de ser verdade; agora o formulário explica o que acontece com e sem pendentes, o resultado da edição descreve o que o backend fez (arquivou, não arquivou, substituiu), o cartão e o manual falam em credenciais arquivadas por remoção ou edição. |
| `src/components/paineis/ServicoExtraFormPainel.tsx` (26 linhas adicionadas, 30 removidas) | valor (l. 93); hook de métodos (l. 206); validação (l. 243); checkboxes do serviço (l. 314); checkboxes da taxa (l. 331) | Só os métodos do provedor ativo podem ser escolhidos (os já salvos e não suportados vêm sinalizados), só eles vão no payload e a validação "ao menos um método" vale sobre eles. Saem a lista fixa de métodos e o rótulo que ficaram sem uso. |
| `src/components/paineis/ServicosExtrasPainel.tsx` (23 linhas adicionadas, 1 removidas) | hook e naoSuportados (l. 71); aviso no detalhe (l. 144) | Detalhe do serviço na visão da academia (que não é filtrada): aviso com os métodos configurados que o provedor atual não suporta, ou de que não há provedor ativo. |
| `src/components/paineis/ServicoExtraPagamento.tsx` (5 linhas adicionadas, 3 removidas) | ServicoExtraPagamento (prop aviso) (l. 7); estado sem métodos (l. 12) | Nova prop opcional `aviso`; sem métodos disponíveis mostra o aviso em vez do seletor e do botão. |
| `src/components/paineis/MinhasInscricoesServicoExtraPainel.tsx` (1 linhas adicionadas, 1 removidas) | props aviso (taxa e serviço) (l. 3) | Passa os avisos da taxa de inscrição e do serviço ao componente de pagamento. |
| `src/components/paineis/EstudantePagamentosPainel.tsx` (8 linhas adicionadas, 0 removidas) | aviso do checkout (l. 406); render sem métodos (l. 443) | Checkout da propina: sem método utilizável mostra o aviso (por academia) e não o seletor nem o botão "Confirmar pagamento" (antes ficava ativo com `GPO` padrão e o erro só aparecia depois do envio). |
| `src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx` (2 linhas adicionadas, 2 removidas) | import (l. 12); bloco de pagamento da taxa (l. 558) | Com taxa pendente e sem métodos disponíveis, mostra o motivo; antes dizia "Nenhum pagamento de matrícula está pendente", o que era enganoso. O seletor existente já usa a lista filtrada pelo backend. |
| `src/docs/Lista de Tarefas/31 - Regras de Credenciais, Avisos de Pagamento e Metodos nos Servicos Extras.md` (**novo**) | — | Este documento. |

## Validação realizada

**Ambiente:** Node 22.22.2, npm 10.9.7, dependências por `npm ci` (o `yarn.lock` que o `npm ci` alterou localmente foi descartado e não está na entrega). Baseline e verificação em **clones novos** de `main` (`df740f5`), o segundo com a pasta `rastreio-frontend/` copiada por cima.

| | `main` @ `df740f5` | clone novo de `main` + este pacote |
|---|---|---|
| `npx tsc --noEmit` | sem erros | sem erros |
| `npx eslint .` | 10 problemas (2 erros, 8 avisos) | 10 problemas (2 erros, 8 avisos), **os mesmos** |
| `next build` | falha só por rede (Google Fonts)* | compila e gera 67/67 páginas* |

\* O sandbox não alcança `fonts.googleapis.com`; sem ajuste o `next build` falha só por isso (limitação de rede do ambiente de validação, não erro de código). Numa cópia descartável com a fonte substituída, o build compila e gera **67/67 páginas**, com `/financas/configuracoes/provedor` presente e `/financas/credenciais` ausente (coberta pelo redirect).

Os 10 problemas antigos do baseline, idênticos com o pacote (só mudam de linha nos dois arquivos que esta tarefa tocou):

- `app/(full-width-pages)/verificar-email/[token]/page.tsx:29` — erro `react-hooks/set-state-in-effect`
- `app/(painel)/estudantes/cadastrar/SelecaoContextoMassa.tsx:80` e `:115` — avisos
- `components/calendar/Calendar.tsx:102` — erro `react-hooks/purity`
- `components/paineis/CategoriasServicoPainel.tsx:33` — aviso `react-hooks/exhaustive-deps`
- `components/paineis/MinhasInscricoesServicoExtraPainel.tsx:3` — aviso `react-hooks/exhaustive-deps` (arquivo desta tarefa; linha igual)
- `components/paineis/ServicosExtrasPainel.tsx:69` — aviso `react-hooks/exhaustive-deps` (arquivo desta tarefa; passa a estar na linha 75 pelas linhas acrescentadas)
- `components/paineis/ServicosExtrasSolicitacoesPainel.tsx:13` — aviso `react-hooks/exhaustive-deps`
- `layout/AppSidebar.tsx:160` e `:162` — avisos

**O que não foi validado:** nenhuma tela foi aberta num navegador (nem com dados reais), e o frontend não tem testes automatizados. A lógica e os textos foram verificados por tipos, `eslint`, build e leitura; os campos que a tela consome foram conferidos contra o backend da Tarefa 121, cujos testes de handlers rodam contra PostgreSQL real. Vale abrir as telas listadas na verificação.

## Falha antiga que não é desta tarefa

Os 10 problemas de `eslint` listados acima (2 erros e 8 avisos) já existem em `main`; nenhum é desta tarefa.

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch && git diff --stat df740f5 origin/main -- src next.config.ts`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base e deve ser mesclado, não substituído.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos. **Não há arquivo a apagar.**
3. **Verifique** (abaixo).
4. **Faça o deploy depois do backend da Tarefa 121.**
5. **Marque como feito** (abaixo).

## Verificação

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

`tsc` sem erros; `eslint` com os mesmos 10 problemas de `main` (2 erros, 8 avisos), nenhum novo; `build` compila (sem acesso ao Google Fonts, só a busca da fonte falha). No navegador, com o backend da Tarefa 121:

1. **Financeiro › Configurações › Provedor de pagamento:** editar uma credencial de um provedor **com** cobranças pendentes mostra o alerta "Cobranças pendentes protegidas"; salvar com valores diferentes mostra o aviso de que as anteriores ficaram arquivadas; salvar sem pendentes mostra "Credencial atualizada com sucesso".
2. **Serviços extras › novo/editar:** só aparecem os métodos do provedor ativo; os já salvos e não suportados vêm sinalizados e não são enviados.
3. **Serviços extras › detalhe:** com um método não suportado, aparece o aviso amarelo.
4. **Estudante › Pagamentos (propina), Minhas inscrições e Matrícula pública:** numa academia **sem provedor ativo**, o pagador vê "Pagamento online indisponível" com o motivo, e não botões desabilitados.

## Fora de escopo

Intelize e PayPay; qualquer mudança de backend (Tarefa 121 do `rastreio-backend`); a cópia da `Documentação da API.md` dentro do frontend (versão 2.3.0), que continua desatualizada e não foi tocada.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Backend da Tarefa 121 em produção
- [ ] Base conferida (`df740f5`)
- [ ] Pasta copiada por inteiro (10 alterados, 1 documento); nada a apagar
- [ ] `tsc` sem erros; `eslint` sem problemas novos; build compila
- [ ] Verificadas no navegador as 4 telas acima
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

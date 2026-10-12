# Tarefa 29 — Provedor de pagamento e credenciais por provedor (frontend)

**Estado:** pendente
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `33a215f` (commit completo `33a215f5d8dbc9cdfeda7864c82ea2d60ed860ad`)
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** depende da **Tarefa 119 do `rastreio-backend` já em produção**. Sem ela, a tela de provedor e credenciais não carrega (as rotas `GET /financeiro/provedores`, `GET`/`PUT /financeiro/provedor` e `/financeiro/credenciais` não existem) e a criação de cobrança, consulta e cancelamento chamam rotas neutras que ainda não existem. O backend novo continua atendendo o frontend antigo (aliases `/financeiro/appypay/*`), então o backend vai primeiro e o frontend depois.

---

## Contexto

A tela `/financas/credenciais` só sabia configurar a AppyPay: campos fixos (`client_id`, `client_secret`, métodos GPO/REF), textos e nota de adesão da AppyPay, tipos `FinanceiroCredencial` com `client_id_mask` etc. Com a Tarefa 119 do `rastreio-backend`, o módulo de pagamentos passa a funcionar por provedores: o Spuri e cada academia escolhem **um único provedor** e informam as credenciais dele; o formulário muda conforme o provedor; cobranças já emitidas continuam seguindo o provedor que as emitiu.

Esta tarefa faz a tela e a camada de API refletirem isso. Os provedores previstos são AppyPay, Intelize e PayPay; só a AppyPay existe no backend hoje, e a tela já funciona para qualquer provedor que o catálogo devolver.

## O que foi atualizado e onde

**10 arquivos alterados + 0 novos.** Nenhum arquivo é apagado, renomeado ou movido. A rota da tela (`/financas/credenciais`) e os guards **não mudaram**.

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/types/api.ts` | bloco "FINANCEIRO / PROVEDORES DE PAGAMENTO (PSP)" (linha 1474): `FinanceiroCampoCredencial` (l. 1486), `FinanceiroProvedor` (l. 1499), `FinanceiroCredencial` (l. 1518), `CriarFinanceiroCredencialRequest` (l. 1542), `RemoverFinanceiroCredencialRequest` (l. 1568), `FinanceiroCredencialCriada` (l. 1583), `FinanceiroProvedorDoContexto` (l. 1600), `FinanceiroProvedorContexto` (l. 1614), `DefinirFinanceiroProvedorRequest` (l. 1628) e `DefinirFinanceiroProvedorResponse` (l. 1634); `ChargeResult` (l. 1757) e `CobrancaResumo` (l. 1795) | Os tipos de credencial deixam de ter campos da AppyPay: `credenciais` e `credenciais_mascaradas` passam a ser mapas indexados pelas chaves que o provedor declara; `FinanceiroCredencial` ganha `provedor` e `ativo`; entram os tipos do catálogo, do estado do contexto e da definição de provedor; `ChargeResult` e `CobrancaResumo` ganham `provedor` (opcional). |
| `src/lib/api/services.ts` | `financeiroService`: `listarProvedores` (l. 907), `consultarProvedor` (l. 911), `definirProvedor` (l. 923), `listarCredenciais` (l. 926), `criarCredencial` (l. 939), `atualizarCredencial` (l. 946), `removerCredencial` (l. 959), `consultarSegredoWebhook` (l. 967), `rotacionarSegredoWebhook` (l. 974); rotas de cobrança (l. 1030–1040) | Funções novas de catálogo, provedor do contexto e definição; credenciais passam para `/financeiro/credenciais` (com `provedor` no corpo, no filtro e na remoção); consulta, cancelamento e pagamento externo de cobrança passam para `/financeiro/cobrancas/…`. Nenhuma chamada usa mais `/financeiro/appypay/*`. |
| `src/lib/api/index.ts` | lista de tipos exportados (l. 169) | Exporta os tipos novos. |
| `src/components/paineis/FinanceiroCredenciaisPainel.tsx` | `FinanceiroCredenciaisPainel` (l. 87); `contextoBase` (l. 142); `carregarTudo` (l. 149); `handleSubmit` (l. 226); `handleRemover` (l. 265); `handleDefinirProvedor` (l. 280); confirmações (l. 318 e 327); cartões "Provedores disponíveis" (l. 380); formulário dinâmico (l. 80, `emptyForm`, e blocos do formulário); `NovoWebhookSecretAlert` (l. 543); `WebhookSecretPanel` (l. 580); `AdesaoProvedorInfo` (l. 653); `PasswordField` (l. 710) | Reescrita da tela. Ver "Comportamento resultante". |
| `src/components/paineis/financeiroNivelShared.tsx` | `temCredenciais` (l. 117); aviso (l. 153) | O bloqueio por "sem credenciais" passa a exigir um provedor **ativo** com credenciais (`some(c => c.ativo)`); texto do aviso fala em escolher o provedor. |
| `src/components/paineis/PagamentosShared.tsx` | `temCredenciais` (l. 189); aviso | Idem, para a tela de pagamentos. |
| `src/components/paineis/financeiroShared.tsx` | `NOME_PROVEDOR` (l. 171); rótulo do detalhe da cobrança (l. 954); comentários | Nomes de exibição dos provedores; o campo "Referência AppyPay" passa a "Referência <nome do provedor>" (ou "Referência do provedor" para provedor desconhecido ou pagamento externo). Provedor desconhecido aparece pelo próprio id, nunca quebra. |
| `src/components/paineis/CancelarCobrancaPainel.tsx` | comentário (l. 20) | Texto neutro. |
| `src/components/paineis/GestaoCobrancasPainel.tsx` | manual de funcionamento (l. 30) | "…junto ao provedor de pagamento…" em vez de "…junto à AppyPay…". |
| `src/app/(painel)/financas/credenciais/page.tsx` | metadata (l. 5) | Título "Finanças - Provedor de pagamento" e descrição neutra. |

### Comportamento resultante

- **Academia** (no próprio contexto) e **admin FPP** (no contexto `Spuri (Global)`; nos demais só consulta, como antes) veem, no topo, o provedor atual e uma nota de adesão.
- **Provedores disponíveis.** Com um contexto único selecionado (academia, ou FPP com filtro `Spuri` ou uma academia), aparece um cartão por provedor do catálogo: nome, "Provedor ativo", "Credenciais configuradas" ou "Sem credenciais", métodos suportados e quantas cobranças pendentes aguardam aquele provedor. Quem pode escrever vê **Configurar credenciais** (provedor sem credenciais) ou **Definir como provedor** (provedor com credenciais que não é o ativo). Trocar de provedor pede confirmação e explica que as cobranças já criadas continuam sendo acompanhadas no provedor anterior (mostrando quantas estão pendentes) e que as credenciais dele são mantidas. Com o filtro "Todas" não há um contexto único, então só a tabela é exibida.
- **Formulário.** Escolhe-se o provedor (fixo ao editar) e os campos vêm do catálogo: obrigatórios marcados, campos `secreto` com o botão de mostrar/ocultar, texto de ajuda de cada campo. A validação do front é só "obrigatório"; o formato (ex.: prefixos da AppyPay) é validado pelo backend e o erro aparece dentro do formulário. O aviso do segredo de webhook só aparece para provedores que o usam; o texto avisa que, sem provedor definido no contexto, o provedor configurado agora passa a ser o ativo.
- **Tabela de credenciais.** Passa a mostrar o provedor (com a etiqueta "Ativo"), as credenciais mascaradas com os rótulos do catálogo e a coluna do segredo de webhook (para provedores sem segredo mostra "Não utiliza"). Editar e remover continuam respeitando o escopo por linha.
- **Remoção.** O diálogo avisa quando o provedor é o ativo (nenhuma cobrança nova até definir outro). Se o backend recusar porque há cobranças pendentes (`409`), a mensagem dele aparece no alerta da tela.
- **Nota de adesão.** O texto geral vale para qualquer provedor; as orientações específicas da AppyPay (parceria BAI/BCS/Standard Bank e comissões) só aparecem quando a AppyPay é o provedor em foco.
- **Bloqueios por "sem credenciais"** (configuração de propina, matrícula, serviços extras e a tela de pagamentos): agora só liberam quando o contexto tem um provedor **ativo** com credenciais.
- **Detalhe da cobrança** mostra o nome do provedor que a emitiu na referência.

## Validação realizada

**Ambiente.** Node 22.22.2, npm 10.9.7. Dependências instaladas com `npm ci` (o registro derrubou a conexão na primeira tentativa; funcionou com `--maxsockets=4 --fetch-retries=6`). O `npm ci` alterou o `yarn.lock` localmente; a alteração foi descartada com `git checkout` e **não faz parte da entrega**.

**Baseline (`main`, sem a mudança):**

- `npx tsc --noEmit` → saída 0, nenhum erro.
- `npx eslint .` → **10 problemas (2 erros, 8 avisos), todos já existentes**, nenhum em arquivo desta tarefa:
  - erros: `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` (29:7, setState síncrono dentro de effect) e `src/components/calendar/Calendar.tsx` (102:13, função impura durante o render);
  - avisos: `CategoriasServicoPainel.tsx` (33:38), `MinhasInscricoesServicoExtraPainel.tsx` (3:769), `ServicosExtrasPainel.tsx` (69:38), `ServicosExtrasSolicitacoesPainel.tsx` (13:507), `AppSidebar.tsx` (161:5 e 163:6), `estudantes/cadastrar/SelecaoContextoMassa.tsx` (80:5 e 115:5).

**Depois (clone novo de `main` @ `33a215f`, pasta copiada por cima):**

- `npx tsc --noEmit` → saída 0, nenhum erro.
- `npx eslint .` → **os mesmos 10 problemas (2 erros, 8 avisos)**; a comparação arquivo a arquivo com o baseline é idêntica; nenhum problema novo.
- `package.json`, `package-lock.json` e `yarn.lock` intactos.
- `next build` **sem alterar nada**: falha somente por rede — não consegue baixar a fonte `Outfit` do Google Fonts (`Failed to fetch Outfit from Google Fonts`, em `src/app/layout.tsx`, arquivo que esta tarefa não toca; o mesmo ocorre em `main`). Para validar o resto, numa **cópia descartável** troquei apenas o `import` da fonte por uma stub e rodei o build: `✓ Compiled successfully`, `✓ Generating static pages (67/67)`, saída 0. A stub foi revertida e não faz parte da entrega.

**Não validado:** a tela em navegador contra o backend real (não há ambiente de browser aqui) e o comportamento com um segundo provedor, que ainda não existe no backend. A lógica da tela foi verificada por tipos, lint e build; o contrato com o backend foi conferido contra os testes da Tarefa 119 (catálogo, estado do contexto, definição, credenciais, `409` na remoção).

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch && git diff --stat 33a215f origin/main -- src`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Confirme que a Tarefa 119 do `rastreio-backend` já está em produção.**
3. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
4. **Verifique** (abaixo).
5. **Marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem erros; `eslint` com exatamente os 10 problemas antigos listados acima e nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração. `next build` só passa com acesso ao Google Fonts.

## Fora de escopo

- **Backend** (provedores, migration, rotas, mecanismo retroativo): **Tarefa 119 do `rastreio-backend`**.
- Implementação de **Intelize e PayPay**: ficam para tarefas próprias no backend; a tela já os exibirá se o catálogo os devolver (o `NOME_PROVEDOR` já tem os nomes de exibição).
- **Filtrar, nas telas de configuração de propina e matrícula, os métodos de pagamento pelo que o provedor ativo suporta:** não feito. Hoje a AppyPay suporta os três e o backend já recusa método não suportado (`400`); com um segundo provedor que suporte menos métodos, o seletor deve passar a usar `metodos` do provedor ativo.
- **Renomear a rota** `/financas/credenciais` ou o item do menu lateral: mantidos (guards e navegação intactos).
- Cópia da `Documentação da API.md` em `src/` (versão 2.3.0, desatualizada): não tocada.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida (`33a215f`)
- [ ] Tarefa 119 do `rastreio-backend` já em produção
- [ ] Pasta copiada por inteiro (10 alterados, 0 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos (os 10 antigos permanecem)
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

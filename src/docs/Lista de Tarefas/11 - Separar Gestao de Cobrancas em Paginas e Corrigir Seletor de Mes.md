# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `11 - Separar Gestao de Cobrancas em Paginas e Corrigir Seletor de Mes.patch`, nesta mesma pasta. Sua tarefa é aplicar o patch e rodar as verificações do Passo 2. Se o patch não aplicar de primeira (`git apply` reclamar de conflito), PARE e reporte a diferença em vez de tentar recriar as mudanças manualmente.

Esta é a primeira de **quatro tarefas de frontend** derivadas do mesmo pedido do usuário (as outras três — configurações de mensalidade/taxa de matrícula, navegação de pagamentos, e serviços extras — vêm em documentos numerados 12, 13 e 14, cada um independente deste). O item de backend correspondente à parte financeira já foi entregue e aplicado como Tarefa 108 no `rastreio-backend`.

---

## Contexto do problema

A página `/financas/gestao-cobrancas` tinha um único card ("Anular ou reativar obrigações") que abria uma subtela local (sem rota própria) com um formulário que fazia as duas ações ao mesmo tempo. O usuário pediu para:

1. Separar em duas rotas próprias: `/financas/gestao-cobrancas/anular-mensalidade` e `/financas/gestao-cobrancas/reativar-mensalidade`.
2. Adicionar uma terceira, nova: `/financas/gestao-cobrancas/cancelar-cobranca`.
3. Corrigir o seletor de meses desse formulário, que tinha três problemas reais confirmados no código:
   - O placeholder aparecia preto no tema escuro.
   - O dropdown não tinha rolagem.
   - Permitia selecionar vários meses ao mesmo tempo (o pedido é permitir só um).

### O que eu confirmei lendo o código (causa raiz dos bugs do seletor)

O componente usado era `src/components/form/MultiSelect.tsx`, usado **só** neste formulário (a única outra referência no projeto é a vitrine de componentes `SelectInputs.tsx`, fora de escopo — não toquei em nenhum dos dois arquivos). Dois bugs reais, confirmados por leitura direta do componente:

- O "placeholder" na verdade é um `value="Select option"` fixo no `<input readOnly>` — como o campo **sempre** tem um valor (nunca fica vazio), o texto nunca é renderizado pelo `::placeholder` do navegador (que é o que tem a cor certa por tema); ele aparece com a cor de texto normal do input, que não tem nenhuma classe de tema definida — daí sair preto no escuro.
- O dropdown usa a classe Tailwind `max-h-select`, que **não existe em lugar nenhum do projeto** (não está no `tailwind.config`, não está em nenhum CSS) — é uma classe morta, então não há limite de altura e o `overflow-y-auto` não tem o que fazer.

Em vez de tentar consertar o `MultiSelect` (que ninguém mais usa, então corrigi-lo não beneficiaria nada além deste formulário), troquei o uso aqui pelo `SearchableSelect` — o mesmo componente já usado para "Ano letivo" neste mesmo formulário, já correto de tema (usa `useTheme()`, cor de placeholder certa nos dois temas) e com rolagem nativa (react-select). Isso também resolve o pedido de permitir só um mês: a seleção passou de `meses: string[]` (array) para `mes: string` (um valor só), enviado ao backend como array de um elemento só (`meses: [Number(mes)]`) — o contrato da API não mudou, só a UI ficou mais restrita.

### O que é "Cancelar cobrança" (item novo, não existia antes)

Diferente de "Anular obrigação" (que anula uma mensalidade mesmo que nenhuma cobrança real tenha sido gerada ainda), "Cancelar cobrança" cancela uma cobrança **real** já gerada/tentada junto à AppyPay (referência, QR code etc.) — a mesma ação que já existe em Finanças → Pagamentos (por trás de `CobrancasTable`), só que aqui isolada por estudante para um acesso mais direto a partir da gestão de cobranças. Não criei nenhum componente de tabela ou de detalhe novo — reaproveitei `CobrancasTable` (já sabe quais status são canceláveis e já tem o modal de confirmação com motivo) e `SubtelaDetalheCobranca` (mesma subtela de detalhe já usada em Finanças → Pagamentos), chamando o endpoint que já existe, `financeiroService.consultarCobrancasEstudante` (`GET /financeiro/cobrancas/estudante/:codigo`) — confirmei no backend (`internal/handlers/financeiro_handlers.go`, função `ConsultarCobrancasEstudante`) que uma academia já pode chamar essa rota para os próprios estudantes, então não precisei de nenhuma mudança de backend para isto.

## O que o patch faz

Arquivos alterados (3) e novos (5) — nenhuma mudança de backend, nenhuma migration:

1. **`src/components/paineis/AnularReativarObrigacoesForm.tsx`** (alterado) — passou a receber uma prop `acao: "anular" | "reativar"` e renderiza só a ação pedida (um botão só, motivo só aparece para "anular"). Seletor de mês trocado de `MultiSelect` para `SearchableSelect` (único, com "Selecione o mês" como placeholder, ordenado Janeiro→Dezembro via `MES_NOME_OPCOES`, já existente em `financeiroNivelShared.tsx` — não criei uma lista de meses nova).
2. **`src/components/paineis/AnularReativarMensalidadePainel.tsx`** (novo) — painel compartilhado pelas duas novas páginas (`acao="anular"` / `acao="reativar"`), com a guarda de permissão (`academia` ou `admin fpp`) e `SubtelaPanel` com botão "Voltar" para `/financas/gestao-cobrancas`.
3. **`src/components/paineis/CancelarCobrancaPainel.tsx`** (novo) — busca de estudante → lista de cobranças (`CobrancasTable`) → cancelar (reaproveita o fluxo já existente).
4. **`src/components/paineis/GestaoCobrancasPainel.tsx`** (alterado) — de um card com subtela local para 3 cards com `href` (mesmo padrão de navegação por página já usado em `/financas/configuracoes` desde a Tarefa 9), e o texto do manual de funcionamento atualizado para explicar as 3 ações (incluindo a diferença entre "anular obrigação" e "cancelar cobrança").
5. **`src/app/(painel)/financas/gestao-cobrancas/anular-mensalidade/page.tsx`** (novo)
6. **`src/app/(painel)/financas/gestao-cobrancas/reativar-mensalidade/page.tsx`** (novo)
7. **`src/app/(painel)/financas/gestao-cobrancas/cancelar-cobranca/page.tsx`** (novo)
8. **`src/lib/route-guards.ts`** (alterado) — 3 novas entradas (`admin`, `academia`), mesmo padrão das rotas de `/financas/configuracoes/*` já existentes.

Nenhuma rota nova foi adicionada à barra lateral (`AppSidebar.tsx`) — assim como as sub-páginas de `/financas/configuracoes`, elas só são alcançáveis pelos cards de `/financas/gestao-cobrancas`, que continua sendo o único item de menu.

## O que já foi validado pelo orquestrador

Você (Codex) não tem PostgreSQL/Docker neste ambiente, mas isso não é necessário aqui — este repositório não roda testes de integração com banco, só verificação de tipos, lint e build. Ainda assim, já rodei tudo isto por você, num ambiente com Node 22 real:

- **Baseline antes de tocar em qualquer código:** `npx tsc --noEmit` limpo.
- Depois de implementar as mudanças: `npx tsc --noEmit` limpo de novo, `npx eslint` nos 8 arquivos tocados/criados — **0 erros, 0 avisos**.
- `npx next build` — chega a compilar e gerar todas as rotas (incluindo as 3 novas); o único erro que aparece é a tentativa de baixar a fonte `Outfit` do Google Fonts (`fonts.googleapis.com`), bloqueada neste sandbox sem internet irrestrita — **mesmo comportamento já documentado na Tarefa 9** (`docs/Tarefas feitas/9 - ...md`), não é um problema do código.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` direto do GitHub, apliquei o `.patch` exatamente como você vai aplicar (`git apply`), confirmei que aplica sem conflito, rodei `npm install` + `npx tsc --noEmit` + `npx eslint src/` + `npx next build` de novo — mesmíssimo resultado (tsc limpo; eslint com os mesmos 2 erros/8 avisos pré-existentes em arquivos que este patch não toca — `Calendar.tsx`, `verificar-email/[token]/page.tsx`, `AppSidebar.tsx` etc. — confirmei isso rodando eslint no repositório original, sem patch nenhum, e o resultado é idêntico; build para no mesmo ponto da fonte do Google).
- Confirmei em `src/lib/api/services.ts` e no backend (`ConfigurarMensalidade`/rotas de `financeiro/cobrancas/estudante`) que nenhuma chamada de API mudou de contrato — só a UI.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/11 - Separar Gestao de Cobrancas em Paginas e Corrigir Seletor de Mes.patch"
```

Deve alterar 3 arquivos e criar 5 novos (contando as 3 pastas de página). Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

Na raiz do repositório:

```bash
npm install
npx tsc --noEmit
npx eslint src/
npx next build
```

- `tsc` deve terminar sem nenhum erro.
- `eslint` pode mostrar os mesmos 2 erros/8 avisos pré-existentes (arquivos não tocados por este patch — `Calendar.tsx`, `verificar-email/[token]/page.tsx`, `SelecaoContextoMassa.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `AppSidebar.tsx`, `CategoriasServicoPainel.tsx`); nenhum dos 8 arquivos deste patch deve aparecer na saída.
- `next build` deve falhar **só** no download da fonte `Outfit` do Google Fonts (mensagem "Failed to fetch `Outfit` from Google Fonts" / erro de TLS ao contatar `fonts.googleapis.com`) — se o erro for qualquer outro (erro de tipo, rota, import), PARE e reporte, porque não é esse o erro esperado.

## O que NÃO fazer (fora de escopo)

- Não toque em `src/components/form/MultiSelect.tsx` nem em `src/components/form/form-elements/SelectInputs.tsx` (vitrine de componentes) — o `MultiSelect` continua existindo no projeto, só deixou de ser usado neste formulário.
- Não adicione as 3 novas rotas à barra lateral (`AppSidebar.tsx`) — elas são alcançáveis só pelos cards de `/financas/gestao-cobrancas`, de propósito.
- Não mude o contrato de `anularObrigacoes`/`reativarObrigacoes`/`cancelarCobranca` em `services.ts` nem os tipos em `types/api.ts` — nenhum deles precisou mudar.
- Nenhuma mudança de backend faz parte desta tarefa — o `rastreio-backend` já está correto para tudo isto (a Tarefa 108, já aplicada, cobre a parte de configuração financeira; anular/reativar/cancelar cobrança já existiam e não precisaram de nenhuma mudança).
- As outras 3 tarefas de frontend (configurações de mensalidade/taxa de matrícula, navegação de pagamentos, serviços extras) são documentos separados — não adiante nem misture com este.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint src/` sem novos erros/avisos nos arquivos deste patch
- [x] `npx next build` chega até o erro conhecido da fonte do Google (nenhum outro erro)
- [x] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

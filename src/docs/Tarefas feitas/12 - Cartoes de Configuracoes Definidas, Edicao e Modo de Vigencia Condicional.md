# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `12 - Cartoes de Configuracoes Definidas, Edicao e Modo de Vigencia Condicional.patch`, nesta mesma pasta. Sua tarefa é aplicar o patch e rodar as verificações do Passo 2. Se o patch não aplicar de primeira (`git apply` reclamar de conflito), PARE e reporte a diferença em vez de tentar recriar as mudanças manualmente.

Esta é a segunda de **quatro tarefas de frontend**; é **independente das outras três** (Tarefa 11, gestão de cobranças; Tarefas 13 e 14, ainda por vir) — não toca em nenhum arquivo que elas tocam, pode ser aplicada em qualquer ordem em relação a elas. Depende do backend já corrigido na Tarefa 108 (`rastreio-backend`, já aplicada).

---

## Contexto do problema

Esta tarefa cobre as páginas `/financas/configuracoes/taxa-matricula` e `/financas/configuracoes/mensalidade` (incluindo `/criar` e `/inicio-cobranca`). O pedido do usuário tinha 4 partes:

### 1. "O que acontece com quem já está pendente?" só na edição

Já resolvido no backend (Tarefa 108): a primeira configuração de um escopo (nível+ano+curso) não precisa mais informar `modo_vigencia` — só a edição de um escopo que já tem configuração vigente. Esta tarefa é a contrapartida de frontend: os formulários de criação **sempre perguntavam** isso, mesmo na primeira configuração. Corrigido criando `existeConfiguracaoParaEscopo(linhas, form)` (nova função central em `financeiroNivelShared.tsx`) que verifica se já existe, entre as configurações já carregadas, uma com o mesmo nível+ano+curso do formulário — usada tanto para decidir se a pergunta aparece quanto para decidir se a chamada vai por `POST` (criar) ou `PUT` (atualizar), que já era a mesma condição, só que antes calculada separadamente (e incompleta) dentro de cada formulário.

### 2. "Configurações já feitas" virou cartões clicáveis com edição

A antiga tabela (`ConfiguracoesSalvasTable`) virou `ConfiguracoesDefinidasCards`: cartões `"{ano/classe} - {valor} Kz"` (ex.: "6ª Classe - 15.000 Kz"), agrupados em secções — todo o Ensino Primário/Iº Ciclo junto numa secção só, e uma secção por curso para médio/superior. Clicar num cartão abre uma subtela com todos os detalhes (valor, métodos, mês de encerramento quando aplicável, vigente desde) e dois botões: **Editar** e **Remover** (remover reaproveita exatamente o mesmo fluxo de confirmação que já existia na tabela antiga — não mudou).

**Como "Editar" foi resolvido:** o backend nunca teve um endpoint de "editar" separado — criar e atualizar sempre foram a mesma operação (`POST`/`PUT` na mesma rota, cada chamada só adiciona uma nova versão). Então "Editar" navega para a mesma página `/criar`, mas com `?nivel=&ano_academico=&curso_id=` na URL. Quando esses parâmetros estão presentes, a página trava nível/curso/ano (mostrados como texto, não como campos — ver `NivelCamposFields` com a prop `escopoFixo`), pré-preenche valor/métodos/mês de encerramento com a configuração atual, e a pergunta "o que acontece com quem já está pendente?" aparece (porque, por definição, chegar em "Editar" a partir de um cartão significa que já existe uma configuração vigente para aquele escopo).

**Assunção que registro aqui, porque o pedido original era ambíguo nesse ponto exato:** o usuário escreveu duas frases seguidas — "'Configurações já feitas' só aparece quando tiver mais de um item na lista" e, logo em seguida, "substituído por 'Taxas definidas': exibe vários cartões...". Interpretei a primeira frase como a observação do problema (o cabeçalho da tabela antiga aparecia mesmo com a lista vazia, parecendo quebrado) que a segunda frase resolve com o redesenho completo. Implementei como: a secção "Mensalidades definidas"/"Taxas definidas" (cabeçalho + cartões) só aparece quando há **pelo menos 1** configuração — não exigi "mais de uma" (2+) porque isso esconderia do usuário a única configuração existente, impedindo editá-la ou removê-la pela interface. Se a intenção era realmente "só com 2 ou mais", é a troca de um único `> 0` por `> 1` em `MensalidadeListaPainel.tsx`/`TaxaMatriculaListaPainel.tsx` — mudança pequena, mas decidi não assumir isso sem confirmar, já que causaria uma tela sem nenhuma forma de gerenciar uma configuração legitimamente única.

### 3. Botões "Voltar" e "Voltar para a lista..."

- `/financas/configuracoes/mensalidade` e `/taxa-matricula`: adicionado um botão "Voltar" (estilo já usado no resto do app para navegação secundária) para `/financas/configuracoes`.
- Nos formulários de criação: "Voltar para a lista de mensalidades"/"...de taxas" deixou de ser um `<Link>` sublinhado (texto decorado) e virou um link com a mesma aparência visual de um `Button variant="outline"` (o componente `Button` do projeto não sabe navegar — não renderiza um `<a>` — então, como em outros lugares do código, é um `<Link>` do Next com as classes do botão aplicadas manualmente).

### 4. "Propina / Mensalidade" → "Mensalidade"

Renomeado em todos os lugares onde aparecia: o card em `/financas/configuracoes`, e o `<title>` da página de `/financas/configuracoes/mensalidade`.

### 5. Início de cobrança: texto e ordenação do seletor de mês

- **Texto:** o manual desta página dizia "Use isto só se o ano letivo começou fora do mês habitual" — o usuário apontou que isso é enganoso; a funcionalidade real é definir a partir de que mês a cobrança passa a valer quando a academia é integrada à plataforma com o ano letivo já em andamento. Reescrevi as 4 explicações desta página (e ajustei também a menção mais curta da mesma ideia na lista de mensalidade) para descrever isso corretamente.
- **Ordenação/restrição do seletor:** antes listava Janeiro→Dezembro, incluindo meses que nunca fazem parte de nenhum ano letivo (ex.: agosto). Reescrevi para listar só os meses do período letivo, do mês natural de início (setembro para escola, outubro para superior) até o `mes_fim_cobranca` mais restritivo já configurado — **a mesma regra, com a mesma matemática de posição cíclica, que corrigi no backend na Tarefa 108** (incluindo o mesmo teto padrão de julho quando a academia ainda não tem nenhuma mensalidade configurada). Isso não introduz nenhuma chamada de API nova — uso a lista de configurações que `useFinanceiroNivelContext` já carrega.

## O que o patch faz

11 arquivos, todos já existentes (nenhum arquivo novo nesta tarefa) — nenhuma migration, nenhuma mudança de contrato de API que quebre compatibilidade (só tornei `modo_vigencia` opcional nos tipos, refletindo o que o backend já aceita):

1. **`src/components/paineis/financeiroNivelShared.tsx`** — reescrita da parte central: `existeConfiguracaoParaEscopo` (nova), `validarValorEAno` (agora recebe `existeConfiguracaoParaEscopo: boolean`), `NivelCamposFields` (novas props `escopoFixo` e `existeConfiguracaoParaEscopo`), `labelAnoAcademicoCurto` (nova, rótulo sem o sufixo "(Médio)/(Superior)" para os cartões), `ConfiguracoesDefinidasCards` (substitui `ConfiguracoesSalvasTable` — cartões + subtela de detalhe com Editar/Remover).
2. **`src/types/api.ts`** — `modo_vigencia` tornou-se opcional em `MensalidadeConfiguracaoInput` e `MatriculaConfiguracaoInput`, com comentário explicando por quê.
3. **`src/components/paineis/MensalidadeCriarPainel.tsx`** e **`TaxaMatriculaCriarPainel.tsx`** — leem `?nivel=&ano_academico=&curso_id=` da URL (`useSearchParams`), pré-preenchem e travam o escopo quando presentes, usam `existeConfiguracaoParaEscopo` para decidir POST/PUT e para exigir (ou não) `modo_vigencia`. Botão "Voltar para a lista..." convertido em link com aparência de botão.
4. **`src/components/paineis/MensalidadeListaPainel.tsx`** e **`TaxaMatriculaListaPainel.tsx`** — botão "Voltar" adicionado; tabela trocada por `ConfiguracoesDefinidasCards`; secção só renderiza com ≥1 configuração (ver a nota de interpretação acima).
5. **`src/components/paineis/FinanceiroConfiguracoesRootPainel.tsx`** — "Propina / Mensalidade" → "Mensalidade".
6. **`src/components/paineis/InicioCobrancaPainel.tsx`** — texto do manual corrigido; seletor de mês reescrito (ordenado e restrito ao período letivo).
7. **`src/app/(painel)/financas/configuracoes/mensalidade/page.tsx`** — `<title>` "Propina / Mensalidade" → "Mensalidade".
8. **`src/app/(painel)/financas/configuracoes/mensalidade/criar/page.tsx`** e **`taxa-matricula/criar/page.tsx`** — envolvidos em `<Suspense>` (exigido pelo Next.js sempre que uma página usa `useSearchParams()` — mesmo padrão já usado em `src/app/page.tsx` para `LandingPageClient`); título da mensalidade também corrigido.

## O que já foi validado pelo orquestrador

- **Baseline** (antes de qualquer mudança desta tarefa, sobre o estado já validado da Tarefa 11): `npx tsc --noEmit` limpo.
- Depois de implementar: `npx tsc --noEmit` limpo; `npx eslint` nos 11 arquivos — **0 erros, 0 avisos** (dois problemas reais surgiram durante o desenvolvimento e foram corrigidos antes de fechar a tarefa: um `setState` síncrono dentro de `useEffect` no seletor de mês do início de cobrança, refeito como valor derivado em vez de estado sincronizado por efeito; e duas dependências de `useMemo` instáveis nos formulários de criação, corrigidas memoizando a lista de configurações).
- `npx next build` chega a compilar e gerar todas as rotas; para só no download da fonte `Outfit` do Google Fonts, o mesmo ponto documentado desde a Tarefa 9 — não é um problema do código.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` (sem a Tarefa 11 aplicada, para confirmar que esta tarefa é mesmo independente), apliquei o `.patch` exatamente como você vai aplicar, confirmei que aplica sem conflito, rodei `npm install` + `npx tsc --noEmit` + `npx eslint src/` + `npx next build` de novo — mesmíssimo resultado (tsc limpo; eslint com os mesmos 2 erros/8 avisos pré-existentes de sempre, em arquivos que este patch não toca; build para no mesmo ponto da fonte do Google).
- Conferi em `src/lib/api/services.ts` e no backend (`internal/handlers/financeiro_handlers.go`, rotas `POST`/`PUT` de `/financeiro/mensalidades/configuracoes` e `/financeiro/matriculas/configuracoes`) que as duas chamadas (criar e atualizar) já batem no mesmo handler — por isso reaproveitar a página `/criar` para editar (em vez de criar uma página `/editar` nova) é seguro e não exige nenhum endpoint novo.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/12 - Cartoes de Configuracoes Definidas, Edicao e Modo de Vigencia Condicional.patch"
```

Deve alterar exatamente 11 arquivos, nenhum novo. Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

Na raiz do repositório:

```bash
npm install
npx tsc --noEmit
npx eslint src/
npx next build
```

- `tsc` sem nenhum erro.
- `eslint` só pode mostrar os mesmos problemas pré-existentes de sempre (arquivos não tocados por este patch); nenhum dos 11 arquivos listados acima deve aparecer na saída.
- `next build` deve parar só no erro conhecido da fonte `Outfit`/`fonts.googleapis.com` — qualquer outro erro, PARE e reporte.

## O que NÃO fazer (fora de escopo)

- Não crie uma rota `/editar` separada — "Editar" reaproveita `/criar` com parâmetros de URL, de propósito (ver contexto acima).
- Não mude a decisão de mostrar a secção de cartões só com ≥1 item para "só com ≥2 itens" sem confirmar com o usuário — é uma interpretação registrada explicitamente acima, não um bug.
- Não toque nas páginas de `/financas/gestao-cobrancas` nem em `AnularReativarObrigacoesForm.tsx`/`GestaoCobrancasPainel.tsx`/`route-guards.ts` — são da Tarefa 11, já aplicada separadamente.
- Não toque em `/financas/pagamentos` nem em `/servicos-extras` — são as Tarefas 13 e 14, documentos separados, ainda não entregues.
- Nenhuma mudança de backend faz parte desta tarefa — o `rastreio-backend` já está correto (Tarefa 108, já aplicada).

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint src/` sem novos erros/avisos nos 11 arquivos deste patch
- [x] `npx next build` chega até o erro conhecido da fonte do Google (nenhum outro erro)
- [x] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

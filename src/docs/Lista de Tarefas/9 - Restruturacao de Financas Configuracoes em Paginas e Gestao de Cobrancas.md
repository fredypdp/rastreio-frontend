# Tarefa 9 — Restruturação de Finanças &gt; Configurações em páginas, Início de Cobrança, valor em Kz e Gestão de Cobranças

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Depende de:** nada (não depende de nenhuma tarefa de backend — todos os endpoints usados aqui já existem e não mudaram).
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `9 - Restruturacao de Financas Configuracoes em Paginas e Gestao de Cobrancas.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch e rodar as verificações do Passo 2. Se o patch não aplicar de primeira, PARE e reporte o conflito em vez de recriar as mudanças manualmente.

---

## Contexto do problema

A página `/financas/configuracoes` era um único componente gigante (`FinanceiroConfiguracoesPainel.tsx`, ~700 linhas) que trocava de "tela" via estado local (`useState<"menu" | "mensalidade" | "matricula" | "inicio-cobranca" | "anular-reativar" | "regras">`) em vez de navegar entre páginas de verdade. Isso tinha vários efeitos colaterais pedidos para corrigir:

1. "Início de cobrança fora do padrão" era um card no menu principal, junto de mensalidade/matrícula/anular-reativar — mas conceitualmente só faz sentido dentro de mensalidade.
2. A subtela "mensalidade" misturava, numa tela só, o formulário de criação **e** a lista de configurações já feitas — sem URL própria para cada coisa.
3. "Ano letivo" era um `<select>` deixando escolher qualquer ano letivo da academia (passado ou futuro) para definir o início de cobrança — mas o pedido era sempre usar o ano letivo atual, inferido automaticamente, sem exigir essa escolha.
4. "Regras de funcionamento" era uma única tela genérica compartilhada por tudo, alinhada à direita.
5. "O que acontece com quem já está pendente?" tinha uma frase só por opção, misturando resumo e explicação.
6. O campo "Valor (Kz)" era um `<input type="number">` nativo — não respeita "." como separador de milhares (comportamento de locale do navegador, inconsistente) e a UX de digitar um valor grande em Kwanzas é ruim.
7. "Anular ou reativar obrigações" estava dentro de Finanças &gt; Configurações, misturado com as configurações de valor, mas conceitualmente é uma ação diferente (mexe numa cobrança pontual já gerada, não define quanto cobrar de todo mundo).
8. Alguns textos de erro usavam `text-error-500` sem a variante `dark:`, ficando com contraste ruim no modo escuro.

**Confirmei antes de escrever qualquer código** (não é suposição) que o backend **já resolve sozinho** a qual ano civil um mês pertence dentro do ano letivo — `internal/finance/mensalidade.go`, funções `mesNaturalInicioAnoLetivo` (setembro para academias de nível "escola", outubro para "superior") e `posicaoNoAnoLetivo`. A API de início de cobrança (`MesInicioCobrancaInput`) só recebe `mes_inicio` (1–12) e `ano_letivo` (ex.: `"2026_2027"`) — nunca um ano civil separado. Ou seja: **isto é tarefa só de frontend**, não precisa de nenhuma mudança de backend — só precisa mostrar, ao lado de cada mês no seletor, a que ano civil ele corresponde, usando a mesma fórmula.

## O que o patch faz

### Arquivo novo: `src/components/paineis/financeiroNivelShared.tsx`
Concentra tudo que as páginas novas de mensalidade/taxa-matrícula precisam em comum, para não duplicar lógica:
- `useFinanceiroNivelContext()` — hook com usuário/tipo, `codigoAcademia`, níveis disponíveis, cursos, e os dados de mensalidade/matrícula/credenciais (substitui o estado que antes vivia dentro do componente único).
- `FinanceiroAcessoGuard` — mesma checagem de acesso que já existia (carregando → sem permissão → admin FPP indisponível → conteúdo real).
- `ManualDeFuncionamento` — **substitui a antiga tela "Regras de funcionamento"** por um painel que abre/fecha inline, alinhado à esquerda. Cada página nova tem o seu próprio conteúdo (nenhum texto técnico, nenhuma menção a como o sistema funciona por dentro).
- `NivelCamposFields` — os campos de nível/curso/ano/valor/"o que acontece com quem já está pendente", compartilhados pelos formulários de mensalidade e taxa de matrícula (sempre foram idênticos nos dois).
- `ConfiguracoesSalvasTable` — a tabela de "Configurações já feitas" (existia antes, só foi extraída para ser reutilizável).
- `ValorKzInput` (em `financeiroShared.tsx`) — campo de valor com máscara de milhares/centavos (formato angolano: "." separa milhares, "," separa centavos — ex.: `45.000,00`). O usuário digita só números, sempre interpretados como centavos (padrão comum em apps bancários), o que elimina de vez a ambiguidade do `<input type="number">` nativo. O estado do formulário continua guardando o valor "puro" (`"45000.00"`), exatamente como antes — só a apresentação do campo muda.

### Páginas novas (antes eram "telas" dentro do componente único)
| Página | Vem de | Cards / conteúdo |
|---|---|---|
| `/financas/configuracoes` | menu principal | 2 cards: Propina/Mensalidade → `/mensalidade`, Taxa de Matrícula → `/taxa-matricula` |
| `/financas/configuracoes/mensalidade` | subtela "mensalidade" (parte de listagem) | Lista de mensalidades já configuradas + 2 cards: Início de Cobrança, Definir Nova Mensalidade |
| `/financas/configuracoes/mensalidade/criar` | subtela "mensalidade" (parte de formulário) | Formulário "Definir Nova Mensalidade" |
| `/financas/configuracoes/mensalidade/inicio-cobranca` | subtela "inicio-cobranca" | Formulário de início de cobrança (ver mudanças abaixo) |
| `/financas/configuracoes/taxa-matricula` | subtela "matricula" (parte de listagem) | Lista de taxas já configuradas + 1 card: Definir Nova Taxa (taxa de matrícula não tem "início de cobrança" — isso é conceito exclusivo de mensalidade) |
| `/financas/configuracoes/taxa-matricula/criar` | subtela "matricula" (parte de formulário) | Formulário "Definir Nova Taxa" |
| `/financas/gestao-cobrancas` **(nova, fora de Configurações)** | subtela "anular-reativar" | Card "Anular ou reativar obrigações" → mesma subtela de sempre (`AnularReativarObrigacoesForm`, sem alterações) |

Nenhuma dessas páginas (exceto a raiz `/financas/configuracoes` e a nova `/financas/gestao-cobrancas`) aparece na barra lateral — só são alcançáveis pelos cards, exatamente como pedido. Adicionei `/financas/gestao-cobrancas` na barra lateral (`src/layout/AppSidebar.tsx`) e em `src/lib/route-guards.ts` (mesmo `allowedTypes: ['admin', 'academia']` das outras rotas de finanças), junto com todas as rotas novas de configurações.

**Suposição registada:** o documento original menciona "/mensalidade ... Tem 3 cards" mas só descreve 2 explicitamente (Início de Cobrança e Definir Nova Mensalidade). Considerei o 3º "card" como sendo a listagem de mensalidades já configuradas — que a própria frase anterior do documento já descreve como existente ("Já exibe as mensalidades já existentes") — e mantive essa listagem **inline** na página (não como card de navegação), igual ao comportamento atual. Se havia um terceiro card pretendido além desses, precisa ser especificado.

### Início de Cobrança (`InicioCobrancaPainel.tsx`)
- Removido o `<select>` de "Ano letivo" — agora sempre usa o ano letivo atual da academia (buscado via `academiaService.getAnoLetivo`, sem deixar escolher outro).
- O seletor de mês agora mostra o ano civil ao lado do nome do mês (ex.: "Setembro de 2026", "Março de 2027"), calculado no frontend com a mesma fórmula do backend (mês natural = setembro para nível "escola", outubro para "superior"; meses a partir do natural pertencem ao primeiro ano civil do ano letivo, os anteriores ao segundo). Isso é só apresentação — continua enviando à API somente o número do mês, porque o backend já resolve sozinho o ano civil a partir do `ano_letivo`.
- Um texto pequeno acima do formulário deixa claro que a mudança vale para o ano letivo atual, mostrando qual é.

### "O que acontece com quem já está pendente?" (`NivelCamposFields`)
Cada opção agora tem um resumo curto em negrito ("Aplicar retroativamente" / "Aplicar só daqui para frente") e, abaixo, uma frase explicando o efeito — com texto ligeiramente diferente para mensalidade vs. taxa de matrícula, já que o efeito é análogo mas não idêntico (mensalidades em atraso vs. matrículas já aprovadas).

### "Mês de encerramento da cobrança" (`MensalidadeCriarPainel.tsx`)
Adicionado um texto abaixo do seletor explicando por que essa escolha existe (níveis académicos diferentes terminam em meses diferentes).

### Correções de paleta de cores (dark mode)
`text-error-500` sem a variante `dark:text-error-400` corrigido em: `src/components/form/input/InputField.tsx` (texto de hint/erro abaixo de qualquer campo), `src/components/form/input/TextArea.tsx`, `financeiroShared.tsx`, `FinanceiroCredenciaisPainel.tsx` (2 lugares). Não toquei em `Alert.tsx` nem `EcommerceMetrics.tsx`, que também usam `text-error-500` sem `dark:` — são componentes fora do escopo desta tarefa (ícone genérico de alerta e um componente de dashboard de e-commerce não relacionado a finanças).

### Componentes de UI ampliados (retrocompatíveis)
- `Radio` (`src/components/form/input/Radio.tsx`): `label` passou de `string` para `React.ReactNode`, para suportar o resumo+explicação acima. Só 2 lugares no repositório usam `<Radio>`; o outro (`RadioButtons.tsx`, uma vitrine de componentes) continua passando string, que ainda é um `ReactNode` válido — nada quebra.
- `SubtelaCard`/`SubtelasMenu` (`financeiroShared.tsx`): ganharam uma prop `href` opcional, que faz o card navegar via `next/link` em vez de `onClick` — usado pelas páginas novas. Quem ainda usa `onClick` (ex.: `FinanceiroPagamentosPainel.tsx`) continua funcionando sem nenhuma mudança.
- `SubtelaPanel` (`financeiroShared.tsx`): `onVoltar` passou a aceitar uma rota (`string`) além da função de sempre — internamente usa `useRouter().push(...)` quando é string.

## O que já foi validado pelo orquestrador

- `npx tsc --noEmit` — sem erros, no repositório inteiro, depois de todas as mudanças.
- `npx eslint` nos arquivos alterados/novos — **zero erros**; só restaram 2 warnings (`react-hooks/exhaustive-deps`) que já existiam antes desta tarefa em `useEffect`s que esta tarefa não tocou (em `CategoriasServicoPainel.tsx` e `AppSidebar.tsx` — confirmado comparando com o código antes do patch).
- `npx next build` (Turbopack) — passou por toda a checagem de tipos e geração de rotas; só falhou na etapa final de otimização por não conseguir baixar a fonte `Outfit` do Google Fonts (`fonts.googleapis.com`), porque o sandbox onde rodei este teste bloqueia esse domínio. Isso é uma limitação de rede do ambiente de teste, não um problema do código — se o seu ambiente tiver acesso normal à internet, o build deve terminar sem erro. Se por acaso este mesmo erro de fonte aparecer no seu ambiente também, é ambiental, não relacionado a esta tarefa — não tente "corrigir" isso alterando código de fontes.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/9 - Restruturacao de Financas Configuracoes em Paginas e Gestao de Cobrancas.patch"
```

Isso deve criar as páginas/arquivos novos, apagar `src/components/paineis/FinanceiroConfiguracoesPainel.tsx` (totalmente substituído pelos arquivos novos) e alterar os demais arquivos listados acima. Se o `git apply` falhar, PARE e reporte o conflito.

## Passo 2 — Verificação

```bash
npx tsc --noEmit
npx eslint src/components/paineis src/app/\(painel\)/financas src/lib/route-guards.ts src/layout/AppSidebar.tsx
npx next build
```

`tsc` e `eslint` devem terminar sem erro (os 2 warnings pré-existentes mencionados acima podem continuar aparecendo — não são desta tarefa). Se o `next build` falhar por causa de `fonts.googleapis.com`, é a mesma limitação de rede descrita acima; qualquer outro erro deve ser investigado.

## O que NÃO fazer (fora de escopo)

- Não recriar `FinanceiroConfiguracoesPainel.tsx` — ele foi deliberadamente removido, todo o conteúdo dele foi migrado para os arquivos novos.
- Não adicionar as páginas novas (`mensalidade`, `taxa-matricula`, `criar`, `inicio-cobranca`) à barra lateral — o pedido explícito é que só sejam alcançáveis pelos cards.
- Não alterar `AnularReativarObrigacoesForm.tsx` — só mudou de página, o formulário em si não foi tocado.
- Não mexer em `text-error-500` de `Alert.tsx` ou `EcommerceMetrics.tsx` — fora de escopo, ver seção de dark mode acima.
- Esta tarefa **não depende** da Tarefa 10 (Serviços Extras) nem da Tarefa 107 do backend — pode ser aplicada e testada de forma independente.

## Passo 3 — Marcar como feito

Depois que o Passo 2 passar sem problema:

1. Se a pasta `src/docs/Tarefas feitas/` ainda não existir, crie-a (não existia nenhuma tarefa de frontend marcada como feita até agora — esta é a primeira).
2. Mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.
3. Marque os itens do checklist abaixo.

## Resumo das mudanças (checklist final)

- [ ] Patch aplicado sem conflitos
- [ ] `npx tsc --noEmit` limpo
- [ ] `npx eslint` sem novos erros
- [ ] `npx next build` conclui a checagem de tipos/rotas (falha de `fonts.googleapis.com`, se ocorrer, é ambiental)
- [ ] `/financas/configuracoes`, `/financas/configuracoes/mensalidade`, `/mensalidade/criar`, `/mensalidade/inicio-cobranca`, `/taxa-matricula`, `/taxa-matricula/criar` e `/financas/gestao-cobrancas` abrem sem erro
- [ ] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`

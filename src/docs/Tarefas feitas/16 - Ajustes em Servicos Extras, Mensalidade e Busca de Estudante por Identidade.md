# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `16 - Ajustes em Servicos Extras, Mensalidade e Busca de Estudante por Identidade.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover/renomear os arquivos conforme o Passo 3.

**Pré-requisito de deploy:** esta tarefa depende de duas rotas novas do backend (`GET /financeiro/mensalidades/inicio-cobranca` e o parâmetro `busca` em `GET /estudantes`), da Tarefa 111 do `rastreio-backend`. **Confirme que a Tarefa 111 já foi implantada em produção antes de implantar esta** — sem ela, a seção 3 (início de cobrança) e a seção 5 (busca de estudante) desta tarefa vão falhar (404 / busca sempre vazia).

Esta tarefa cobre 5 pedidos independentes, cada um descrito na sua própria seção numerada abaixo (a numeração é a mesma usada no pedido original). Um único patch cobre os 5, mas cada seção pode ser lida e conferida separadamente.

---

## Contexto do problema

Cinco pontos foram reportados, todos girando em torno da inscrição/gestão financeira do estudante numa academia:

1. Na tela de gerenciar serviços extras, a "Disponibilidade" era um texto corrido (não usava badges) e, quando o serviço estava restrito a cursos específicos, mostrava o **ID** do curso em vez do nome — e "Personalizações" booleanas apareciam como `true`/`false` cru.
2. A tela de categorias de serviço usava tabela + uma subtela "Ver mais" só para mostrar status/datas/ações.
3. A tela de início de cobrança permitia clicar em "Remover" mesmo quando não havia nenhuma exceção definida para o ano letivo.
4. Na configuração de mensalidade: criar e editar viviam na mesma rota (`/criar`, com um `?nivel=` opcional); ao editar, os métodos de pagamento já aceites não vinham marcados no checkbox; e o rótulo "MCX Express via número de telefone" precisava virar só "MCX Express".
5. Várias telas de gestão de cobranças buscavam o estudante através de um `<select>` alimentado por uma lista travada em até 300 estudantes, sem busca real por código/nome/BI/telefone/e-mail.

## O que já foi investigado e decidido

- **Item 1** — o próprio repositório já resolvia os dois problemas em outro lugar: `ServicoExtraFormPainel.tsx` (tela de criar/editar serviço) já resolve nome de curso a partir do id, e `ServicosExtrasCatalogoPainel.tsx` (tela do estudante) já traduz booleano para "Sim"/"Não". A correção aqui é trazer `ServicosExtrasPainel.tsx` (a listagem/gerenciamento) para o mesmo padrão que os dois já seguem — não inventa nada novo. Usei o componente `Badge` que já existe em `src/components/ui/badge/Badge.tsx` (já usado em outras telas do projeto).
- **Item 5** — investiguei os 17 lugares do projeto que chamam `listarEstudantes` e confirmei que só 2 têm exatamente o padrão descrito (um seletor de UM estudante específico, alimentado por uma lista travada, sem busca real): `AnularReativarObrigacoesForm.tsx` (usado por `/financas/gestao-cobrancas/anular-mensalidade` e `/reativar-mensalidade`) e `CancelarCobrancaPainel.tsx` (`/financas/gestao-cobrancas/cancelar-cobranca`). Os outros 15 são listagens/filtros por turma, curso, ano ou contexto de lançamento em massa — um conceito diferente (navegar/filtrar vários estudantes, não identificar um só) e não foram tocados.
- **Item 4.2** (checkbox de métodos de pagamento) — **bug reproduzido num sandbox isolado com React 19 antes de escrever a correção**, não só por leitura de código: é uma *race condition* determinística (acontece sempre, não às vezes) em `MensalidadeCriarPainel.tsx` — o efeito que pré-preenche o formulário a partir da URL usava `ctx.mensalidadesApi.loading` como trava; esse valor ainda está desatualizado (`false`) no exato momento em que o efeito roda pela primeira vez, porque a chamada que dispara o carregamento real (dentro de `useFinanceiroNivelContext`, chamada antes no mesmo componente) só atualiza esse valor depois que todos os efeitos daquele ciclo de renderização terminam. O efeito então roda com a lista de configurações vazia, aplica os valores padrão do formulário e nunca mais tenta de novo. **Isso também quebrava o campo "valor" e o mês de encerramento, não só o checkbox** — e como o pedido original dizia "mensalidade**/Taxa**", confirmei o mesmo bug, com a mesma causa, em `TaxaMatriculaCriarPainel.tsx`. A correção (comprovada no mesmo sandbox) troca a trava de `.loading` para `.data` — só roda depois que os dados de fato chegaram, não quando o carregamento "não está mais em andamento" no sentido errado.
- **Item 4.1** (rota de criar/editar) — separado em duas rotas só para **mensalidade**, como pedido; taxa de matrícula não foi mencionada nesse item e continua na rota antiga (`/taxa-matricula/criar?nivel=...`), para não misturar uma mudança estrutural não pedida.
- **Item 3** — como o próprio código já documentava em comentário, não havia como a tela saber de antemão se existia uma exceção definida (não existia consulta dedicada) — por isso dependia da Tarefa 111 do backend (`GET /financeiro/mensalidades/inicio-cobranca`, ver pré-requisito de deploy acima).

## O que o patch faz

16 arquivos — 13 modificados, 3 novos.

### 1. `/servicos-extras/gerenciar-servicos` — badges de disponibilidade, nome de curso, booleano traduzido

- **`src/components/paineis/ServicosExtrasPainel.tsx`** — a subtela de detalhe (`selecionado`) passa a buscar a lista de cursos da academia (`cursosApi`, incluída em `recarregar()`) e usa um `nomeCurso(id)` para resolver nome a partir do id, no mesmo padrão já usado em `ServicoExtraFormPainel.tsx`. "Disponibilidade" saiu da grade de 2 colunas e virou um bloco próprio, com badges (componente `Badge` já existente no projeto) agrupados em duas seções — "Ensino Primário e Iº Ciclo" (anos soltos) e "Cursos (Médio / Superior)" (pares curso+ano, no formato `[nome do curso] - Nº Ano`) — ou o texto "Todos os estudantes" quando o serviço não tem nenhuma restrição. "Personalizações" booleanas passam a mostrar "Sim"/"Não" em vez de `true`/`false`, tanto na subtela quanto no `title` (tooltip) da linha da tabela.

### 2. `/servicos-extras/categorias-servico` — cards em grid, sem subtela

- **`src/components/paineis/CategoriasServicoPainel.tsx`** — reescrito por completo: tabela + subtela "Ver mais" viraram uma grade de cards (2 colunas em telas médias, 3 em telas largas), cada um já mostrando nome, badge de status (Ativo/Inativo), datas de criação/edição e as ações (Editar, Desativar/Reativar, Excluir quando inativo) diretamente no card — nenhuma tela adicional necessária. Criação e edição continuam nas rotas próprias já existentes (`/criar`, `/editar/[id]`), que não foram tocadas.

### 3. `/financas/configuracoes/mensalidade/inicio-cobranca` — remover só quando existe algo

- **`src/components/paineis/InicioCobrancaPainel.tsx`** — passa a chamar `financeiroService.consultarInicioCobranca` (nova, ver abaixo) sempre que a academia/ano letivo muda, e reconsulta depois de definir ou remover uma exceção. O botão "Remover início de cobrança" só fica habilitado quando a consulta confirma que existe uma exceção definida (`existeExcecao === true`); um texto acima do botão explica o estado atual — já definido (com o mês), ainda não definido, ou "verificando..." enquanto a consulta está em andamento. O tratamento de 404 que já existia em `removerException` (`ApiError` com `status === 404`) foi mantido como uma rede de segurança para o caso raro de a exceção ter sido removida por outra aba entre a verificação e o clique — não é mais o mecanismo principal.
- **`src/lib/api/services.ts`** e **`src/types/api.ts`** — nova função `financeiroService.consultarInicioCobranca` e novo tipo `ConsultarMesInicioCobrancaResponse`, espelhando exatamente a rota nova do backend (Tarefa 111).

### 4. `/financas/configuracoes/mensalidade` — rotas separadas, checkbox pré-preenchido, rótulo "MCX Express"

- **`src/components/paineis/MensalidadeCriarPainel.tsx`** — simplificado para ser só criação: removido tudo relacionado a `?nivel=` na URL (a rota de editar é outra agora). Continua permitindo que o usuário escolha manualmente um nível/ano/curso que já tenha configuração (nesse caso o formulário se comporta como uma nova versão da configuração existente, exatamente como já se comportava antes) — só a chegada *a partir do link "Editar"* é que mudou de rota.
- **`src/components/paineis/MensalidadeEditarPainel.tsx`** (novo) — a tela de editar propriamente dita, sempre com nível/ano/curso travados a partir da URL. Contém a correção da *race condition* do item 4.2 (trava em `ctx.mensalidadesApi.data`, não `.loading`) — comentário no próprio código explica a causa raiz, para quem for mexer nisso depois.
- **`src/app/(painel)/financas/configuracoes/mensalidade/criar/page.tsx`** — simplificado (não usa mais `useSearchParams`, então não precisa mais do `<Suspense>` ao redor).
- **`src/app/(painel)/financas/configuracoes/mensalidade/editar/page.tsx`** (novo) — mesma estrutura que `/criar` tinha antes (com `<Suspense>`, necessário porque usa `useSearchParams`), agora renderizando `MensalidadeEditarPainel`.
- **`src/components/paineis/financeiroNivelShared.tsx`** — `ConfiguracoesDefinidasCards` (usado tanto por mensalidade quanto por taxa de matrícula) teve sua função de montar o link "Editar" renomeada (`criarHref` → `editarHref`) e ajustada para apontar para `/mensalidade/editar?...` quando `kind === "mensalidade"`; taxa de matrícula continua apontando para `/taxa-matricula/criar?...`, sem nenhuma mudança de comportamento (não foi pedido separar a rota dela).
- **`src/components/paineis/TaxaMatriculaCriarPainel.tsx`** — só a correção da *race condition* do item 4.2 (mesma troca de `.loading` para `.data`, mesmo comentário explicando por quê); a estrutura de rota (continua uma só, com `?nivel=` opcional) não foi tocada.
- **`src/components/paineis/financeiroShared.tsx`** — `METODO_PAGAMENTO_LABEL.GPO` alterado de `"MCX Express via número de telefone"` para `"MCX Express"`. É a única fonte desse rótulo no projeto inteiro (usado por mensalidade, taxa de matrícula e serviços extras) — a mudança propaga sozinha para todas as telas que o mostram.

### 5. Busca de estudante por identidade

- **`src/components/form/BuscarEstudanteSelect.tsx`** (novo) — componente reutilizável de busca assíncrona (usa `AsyncSelect`, de `react-select/async`, já uma dependência do projeto — nenhum pacote novo instalado), com debounce de 300 ms e mínimo de 2 caracteres antes de consultar. Reaproveita o estilo visual já usado por `SearchableSelect` (import de `createStyles`/`selectThemeColors`, que passaram a ser exportados desse arquivo — únicas duas linhas alteradas em `src/components/form/SearchableSelect.tsx`).
- **`src/lib/api/services.ts`** — `consultasService.listarEstudantes` passa a aceitar um parâmetro opcional `busca`, repassado para `GET /estudantes?busca=...` (rota nova da Tarefa 111 do backend).
- **`src/components/paineis/AnularReativarObrigacoesForm.tsx`** e **`src/components/paineis/CancelarCobrancaPainel.tsx`** — o `<select>` alimentado por uma lista travada em 300 estudantes foi trocado por `<BuscarEstudanteSelect />`; o `useEffect`/estado que carregava essa lista (e o import de `consultasService`, que ficou sem uso nesses dois arquivos) foram removidos.

## O que já foi validado pelo orquestrador

- `npx tsc --noEmit` (projeto inteiro) — limpo, sem nenhum erro, com os 16 arquivos desta tarefa.
- `npx eslint .` (projeto inteiro) — **zero erros novos**. Sobraram só os mesmos 2 erros e 8 avisos que já existiam antes desta tarefa, em arquivos que este patch não toca (`src/app/(full-width-pages)/verificar-email/[token]/page.tsx` e `src/components/calendar/Calendar.tsx` — confirmei isso comparando com o `git status` antes de qualquer mudança; ambos são falhas de uma regra de lint nova do projeto, `react-hooks/set-state-in-effect`/`react-hooks/purity`, sobre código que esta tarefa não tem relação nenhuma). Durante a validação, essa mesma regra pegou um problema real que eu mesmo tinha introduzido em `BuscarEstudanteSelect.tsx` (um `setState` síncrono dentro de um `useEffect`) — já corrigido antes de fechar o patch, usando o padrão que o próprio React recomenda para ajustar estado a partir de uma prop, sem `useEffect`.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` direto do GitHub, apliquei o `.patch` exatamente como você vai aplicar (`git apply`), `npm install` do zero, e rodei de novo `npx tsc --noEmit` e `npx eslint .` — mesmo resultado: 100% limpo, com as mesmas 2 falhas pré-existentes de sempre, em arquivos não relacionados.
- `npm run build` não foi usado para validar (é uma limitação conhecida e já documentada do ambiente do orquestrador — bloqueio de rede ao domínio de fontes do Google — não relacionada ao código desta tarefa).

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "docs/Lista de Tarefas/16 - Ajustes em Servicos Extras, Mensalidade e Busca de Estudante por Identidade.patch"
```

Deve alterar 13 arquivos e criar 3 novos. Se `git apply` falhar, PARE — não recrie as mudanças manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` deve terminar sem nenhum erro. `eslint` deve mostrar, no máximo, os mesmos problemas pré-existentes descritos acima (2 erros em `verificar-email/[token]/page.tsx` e `Calendar.tsx`, mais os avisos de `exhaustive-deps` já documentados) — nenhum erro novo, em nenhum arquivo diferente desses dois.

## O que NÃO fazer (fora de escopo)

- Não troque o `<select>` de estudante em nenhuma outra tela além das duas listadas na seção 5 — os outros 15 lugares que usam `listarEstudantes` são listagens/filtros, não seletores de um estudante específico, e não foram mencionados no pedido.
- Não separe a rota de criar/editar de taxa de matrícula — só mensalidade foi pedida no item 4.1.
- Não corrija os dois erros de lint pré-existentes (`verificar-email/[token]/page.tsx`, `Calendar.tsx`) — não têm relação com esta tarefa; se quiser, sinalize para uma tarefa futura dedicada, mas não altere esses arquivos aqui.
- Não mude `mesInicioEfetivo` nem nenhuma lógica de cálculo de cobrança no backend — a seção 3 desta tarefa é só a tela consumindo a rota nova da Tarefa 111.
- Não adicione um componente equivalente a `BuscarEstudanteSelect` para outra entidade (professor, turma etc.) — só estudante foi pedido.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `docs/Lista de Tarefas/` para `docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npm install` sem erros
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint .` sem erros novos (só os 2 pré-existentes, não relacionados)
- [x] Confirmado que a Tarefa 111 do `rastreio-backend` já está em produção antes de implantar esta
- [x] Arquivos desta tarefa movidos para `docs/Tarefas feitas/`

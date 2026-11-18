# Tarefa 38 — Remover a matrícula pública e a taxa de matrícula (Parte 1 do Plano de Atualizações) (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `bee765b`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório. **10 arquivos precisam ser apagados** (lista em "Como aplicar").
**Ordem de deploy:** esta tarefa vai para produção **antes** da Tarefa 128 do `rastreio-backend`. Ela só remove telas e chamadas; com o backend atual continua tudo funcionando (o filtro de cobranças por `servico_extra` que ela passa a oferecer já existe no backend). Se o backend (Tarefa 128) for primeiro, as telas antigas (`/matricula`, solicitações de matrícula, taxa de matrícula) recebem `404` até este deploy.

---

## Contexto

A Parte 1 do Plano de Atualizações remove a matrícula pública: o estudante deixa de pedir matrícula pelo site e a academia deixa de gerir solicitações de matrícula e de configurar ou receber taxa de matrícula. O estudante passa a ser cadastrado só pela academia (`/estudantes/cadastrar`). Este documento cobre a parte visual; as rotas saem na Tarefa 128 do `rastreio-backend`.

A página `/configuracoes/matricula` **não foi removida**: ela configura os documentos extra usados no cadastro feito pela academia.

## O que foi atualizado e onde

**18 arquivos alterados + 0 novos + 10 a apagar.** Números de linha são os do arquivo entregue.

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/api/services.ts` | linhas 156, 194, 199, 403, 463, 491, 988, 1226, 1311, 1630, 2399 (remoções) | Saem o `solicitacaoMatriculaService` (criar, buscar, status, pagamento), os auxiliares de formulário e de query dessa solicitação, as chamadas de configuração da taxa de matrícula (`financeiroService`), de gestão da solicitação (`academiaService`, `adminService`), o download de documento da solicitação (`documentosService`) e a listagem pública de documentos extra. |
| `src/lib/api/index.ts` | 19, 144, 158 | Saem as exportações de tipos e do serviço da solicitação de matrícula. |
| `src/types/api.ts` | 71, 317, 327, 551-552, 1789, 1806, 1883, 1955, 2013 | Saem os tipos da solicitação e da taxa de matrícula. `SolicitacaoMatriculaDocumento` (usado pelos estudantes) passa a se chamar `DocumentoMatricula`. A origem de cobrança passa a ser `mensalidade`, `servico_extra` ou `avulsa`; sai `codigo_solicitacao` do resumo de cobrança. |
| `src/lib/route-guards.ts` | linhas 25, 73, 152, 182 (remoções) | Saem as rotas protegidas/públicas `/matricula`, `/solicitacoes-matricula`, `/financas/configuracoes/taxa-matricula` (+ `/criar`) e `/financas/pagamentos/taxas-matricula`. |
| `src/layout/AppSidebar.tsx` | linha 76 | Sai o item "Matrículas" do menu Estudantes (ficam "Listar" e "Cadastrar"). |
| `src/components/auth/LoginForm.tsx` | linha 351 | Sai o botão "Fazer matrícula" da tela de login. |
| `src/data/landingProfiles.ts` | linhas 31-55 e 178-179 | O perfil "Estudante / Encarregado" da landing deixa de prometer matrícula online: novo título e texto, botão "Entrar" apontando para `/login`, e passos "a instituição regista a sua matrícula → entre com o acesso → acompanhe pagamentos, notas e faltas". O cartão "Matrículas 100% digitais" passa a falar da academia (registar matrículas e guardar documentos) e deixa de aparecer no perfil do estudante. **Os textos são uma proposta minha: revise.** |
| `src/app/(painel)/configuracoes/AdminSection.tsx` | linha 80 | Sai `solicitacoes_matricula` da lista de projeções que o admin pode reconstruir (depois da Tarefa 128 essa projeção não existe). |
| `src/app/(painel)/configuracoes/GuiaConfiguracoesSection.tsx` | linha 12 | Sai o link "Ver solicitações de matrículas" do guia. |
| `src/app/(painel)/financas/configuracoes/page.tsx` | linha 6 | Texto da página deixa de citar a taxa de matrícula. |
| `src/components/paineis/FinanceiroConfiguracoesRootPainel.tsx` | linhas 10, 14-15, 31, 44, 45 e 53 | Sai o cartão "Taxa de Matrícula" e os textos que a mencionavam (inclusive "sem configuração, a matrícula é gratuita"). |
| `src/components/paineis/FinanceiroPagamentosPainel.tsx` | linhas 8-12 e 36 | Sai o cartão "Taxas de matrícula" de `/financas/pagamentos`; fica "Mensalidade / Propina". |
| `src/components/paineis/financeiroNivelShared.tsx` | linhas 4-9, 27, 68-69, 85, 91, 119, 126, 148, 228, 233, 296, 306, 319-320, 342 e demais | Saem `matriculasApi`, a remoção de configuração de matrícula, o ramo `kind="matricula"` dos formulários e cartões, e os textos de vigência/remoção da matrícula. O formulário e os cartões ficam só para mensalidade. |
| `src/components/paineis/financeiroShared.tsx` | 17, 100, 102, 193, 195, 982 | Rótulos de origem: sai "Matrícula", entra "Serviço extra"; sai a linha "Solicitação de matrícula" do detalhe da cobrança. |
| `src/components/paineis/EstudantePagamentosPainel.tsx` | 50, 340 | O filtro por tipo do estudante troca "Matrícula" por "Serviço extra". |
| `src/components/paineis/PagamentosShared.tsx`, `InicioCobrancaPainel.tsx`, `ProvedorPagamentoPainel.tsx` | 6-7 e 57; 16; 92 | Só comentários: deixam de citar a taxa de matrícula. |

**Apagados (10):** a página pública `/matricula` (2 arquivos), `solicitacoes-matricula` (2), as duas páginas de taxa de matrícula (2), a página de pagamentos de taxas de matrícula (1) e os painéis `PagamentosTaxasMatriculaPainel`, `TaxaMatriculaCriarPainel` e `TaxaMatriculaListaPainel` (3).

**Resultado para cada perfil:** o visitante não vê mais "Fazer matrícula" no login nem a rota `/matricula`; a academia deixa de ver "Matrículas" no menu, "Taxa de Matrícula" nas configurações financeiras e "Taxas de matrícula" nos pagamentos; o estudante vê o filtro "Serviço extra" no lugar de "Matrícula" no seu histórico de pagamentos.

## Validação realizada

**Ambiente:** Node 22.23.4, dependências instaladas com `npm ci`. O `npm ci` alterou o `yarn.lock` no sandbox; essa alteração foi descartada e **não** faz parte da entrega.

**Baseline de `main` @ `bee765b`** (sem a mudança): `npx tsc --noEmit` sem erros; `npx eslint .` com **10 problemas antigos (2 erros, 8 avisos)**:

- `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` 29:7 — erro (setState dentro de efeito)
- `src/components/calendar/Calendar.tsx` 102:13 — erro (função impura durante o render)
- `src/app/(painel)/estudantes/cadastrar/SelecaoContextoMassa.tsx` 80:5 e 115:5 — aviso (diretiva eslint-disable sem uso)
- `src/components/paineis/CategoriasServicoPainel.tsx` 33:38, `ServicosExtrasPainel.tsx` 75:38, `MinhasInscricoesServicoExtraPainel.tsx` 3:769, `ServicosExtrasSolicitacoesPainel.tsx` 13:507 — aviso (dependência de `useEffect`)
- `src/layout/AppSidebar.tsx` 159:5 e 161:6 — aviso (diretiva sem uso; dependência `closeMobileSidebar`)

**Clone novo de `main` @ `bee765b` com a pasta copiada por cima e os 10 arquivos apagados:**

```
npx tsc --noEmit  -> rc=0, sem saída
npx eslint .      -> os mesmos 10 problemas (2 erros, 8 avisos)
```

A única diferença na saída do `eslint` é a numeração de linha dos dois avisos de `AppSidebar.tsx` (159→158 e 161→160), porque uma linha do menu foi removida acima deles. Nenhum problema novo.

**`next build`:** no ambiente de validação falha só por rede (`Failed to fetch Outfit from Google Fonts`, `fonts.googleapis.com`) — limitação do ambiente, não erro de código. Para ver o resto do build, foi feita uma cópia **temporária** trocando a fonte do Google por uma fonte local (essa cópia não faz parte da entrega): o build terminou com `rc=0`, a lista de rotas já não contém `/matricula`, `/solicitacoes-matricula`, `/financas/configuracoes/taxa-matricula` nem `/financas/pagamentos/taxas-matricula`, e `/configuracoes/matricula` continua presente.

**Não foi validado:** a parte visual num navegador (nenhuma tela foi aberta), e o repositório `rastreio-frontend` deixou de responder a acesso anônimo durante a sessão, então não consegui reconfirmar o `HEAD` de `main` perto da entrega — use o comando de divergência abaixo.

## Como aplicar

1. **Confirme que a base não mudou:** `git diff --stat bee765b HEAD -- src package.json`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Apague** estes 10 arquivos:
   - `src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx`
   - `src/app/(full-width-pages)/(auth)/matricula/page.tsx`
   - `src/app/(painel)/financas/configuracoes/taxa-matricula/criar/page.tsx`
   - `src/app/(painel)/financas/configuracoes/taxa-matricula/page.tsx`
   - `src/app/(painel)/financas/pagamentos/taxas-matricula/page.tsx`
   - `src/app/(painel)/solicitacoes-matricula/PageContent.tsx`
   - `src/app/(painel)/solicitacoes-matricula/page.tsx`
   - `src/components/paineis/PagamentosTaxasMatriculaPainel.tsx`
   - `src/components/paineis/TaxaMatriculaCriarPainel.tsx`
   - `src/components/paineis/TaxaMatriculaListaPainel.tsx`
   (as pastas `matricula`, `solicitacoes-matricula`, `taxa-matricula` e `taxas-matricula` ficam vazias e podem ser apagadas.)
3. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
4. **Verifique** (abaixo) e **marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Esperado: `tsc` sem erros; `eslint` com exatamente os 10 problemas antigos listados acima e nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração.

## Fora de escopo

- Backend: coberto pela Tarefa 128 do `rastreio-backend`.
- Os textos de marketing que falam de matrículas feitas pela academia (perfis Colégio e Superior da landing, "matrículas digitais" nos destaques) ficam como estão: referem-se ao processo feito pela academia.
- A página `/configuracoes/matricula` (documentos extra do cadastro) e a listagem pública de serviços extras.
- Apagar ou reescrever documentos de tarefas antigos em `src/docs/` que citam a matrícula pública (são histórico).
- Qualquer item das Partes seguintes do plano.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida (`bee765b`)
- [ ] 10 arquivos apagados; pasta copiada por inteiro (18 alterados, 0 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos (os mesmos 10 de antes)
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Textos da landing do perfil Estudante revistos
- [ ] Deploy feito antes da Tarefa 128 do `rastreio-backend`
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

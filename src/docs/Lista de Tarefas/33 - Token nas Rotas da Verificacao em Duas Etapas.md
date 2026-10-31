# Tarefa 33 — Token nas rotas da Verificação em Duas Etapas (frontend)

**Estado:** pendente
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `77ef4cf`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** nenhuma dependência do `rastreio-backend` — o backend (`main` @ `4759474`, Tarefa 122) **não muda**; basta publicar o frontend.

---

## Contexto

**O que o utilizador vê:** em `/configuracoes/seguranca`, o cartão "Verificação em duas etapas" mostra a mensagem **"token não fornecido"** e o botão "Tentar novamente"; não é possível ativar a verificação.

**Causa raiz (frontend):** o pedido `GET /dois-fatores` sai **sem o cabeçalho `Authorization`** (confirmado no HAR enviado: só `Content-Type` e `Origin`), e o backend responde 401 `token não fornecido`.

- `src/lib/api/client.ts` (`fetchApi`, linhas 209–211): o cabeçalho `Authorization` só é enviado quando o chamador passa `token` nas opções. O cliente **não** lê o cookie sozinho.
- Todos os serviços autenticados passam `token || tokenStorage.get() || undefined` (padrão de `perfilService` e dos demais).
- `src/lib/api/services.ts`, `doisFatoresService` (criado na Tarefa 32): **nenhum dos 5 métodos** passava o token. Por isso falhavam todas as ações do cartão (carregar o estado, ativar, desativar), não só o carregamento inicial.

**O backend está correto:** as 5 rotas `/dois-fatores/*` estão no grupo autenticado (`cmd/server/main.go`, linhas 417–421) e o `AuthMiddleware` (`internal/middleware/auth.go`, linha 131) só devolve esse texto quando o cabeçalho não vem.

**Varredura de chamadas semelhantes:** em `services.ts`, das 15 chamadas `api.*` sem `token`, só as 5 de `/dois-fatores/*` eram de rotas autenticadas; as outras são públicas (matrícula pública, cadastro, login, login com código, recuperação de senha).

## O que foi atualizado e onde

**1 arquivo alterado + 0 novos** (além deste documento).

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/api/services.ts` | `doisFatoresService` (linhas 624–666), comentário de abertura (625–627) | Comentário explicando por que cada método recebe o token e qual o padrão seguido. |
| `src/lib/api/services.ts` | `obter` (linha 630) | Passa a aceitar `token` opcional e a enviá-lo; sem ele, usa o token do cookie de sessão. |
| `src/lib/api/services.ts` | `solicitarAtivacao` (linha 636) | Idem. |
| `src/lib/api/services.ts` | `confirmarAtivacao` (linha 644) | Idem (o `token` vem depois dos dados). |
| `src/lib/api/services.ts` | `solicitarDesativacao` (linha 652) | Idem. |
| `src/lib/api/services.ts` | `confirmarDesativacao` (linha 660) | Idem. |

O restante de `services.ts` (2.623 linhas no original) está idêntico ao de `main`; a diferença é só o bloco de `doisFatoresService`.

**Comportamento resultante:** com a sessão aberta, o cartão carrega o estado do 2FA, envia o código para o e-mail, confirma a ativação e a desativação normalmente. As assinaturas continuam compatíveis: `DoisFatoresSettingsCard.tsx` e os demais chamadores **não foram alterados** (o novo parâmetro é opcional e vem sempre por último). Sem sessão (sem cookie e sem token), o backend continua a recusar com 401, como deve.

## Validação realizada

Ambiente: Ubuntu 24.04, PostgreSQL 16.15, Go 1.24.13 (pacote do Ubuntu; o `go.mod` pede o toolchain 1.24.12, usei `GOTOOLCHAIN=local`), Node 22. O `proxy.golang.org` é bloqueado no ambiente, então os módulos do backend foram obtidos por espelhos do GitHub através de um `go.mod` alternativo **fora do repositório** (o `go.mod`/`go.sum` do projeto não foram tocados).

**1. Frontend — baseline de `main` @ `77ef4cf`** (clone novo, `npm install`; o `yarn.lock` alterado pelo `npm install` foi descartado):

- `npx tsc --noEmit`: sem erros.
- `npx eslint .`: **10 problemas antigos (2 erros, 8 avisos)**, nenhum em `services.ts`:
  - `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` — 1 erro (`react-hooks/set-state-in-effect`, 29:7).
  - `src/components/calendar/Calendar.tsx` — 1 erro (`react-hooks/purity`, 102:13).
  - `src/app/(painel)/estudantes/cadastrar/SelecaoContextoMassa.tsx` — 2 avisos (80:5 e 115:5, diretiva `eslint-disable` sem uso).
  - `src/components/paineis/CategoriasServicoPainel.tsx` — 1 aviso (33:38, `exhaustive-deps`).
  - `src/components/paineis/MinhasInscricoesServicoExtraPainel.tsx` — 1 aviso (3:769, `exhaustive-deps`).
  - `src/components/paineis/ServicosExtrasPainel.tsx` — 1 aviso (75:38, `exhaustive-deps`).
  - `src/components/paineis/ServicosExtrasSolicitacoesPainel.tsx` — 1 aviso (13:507, `exhaustive-deps`).
  - `src/layout/AppSidebar.tsx` — 2 avisos (160:5 e 162:6).
- `next build`: falha **só** por rede — `Failed to fetch 'Outfit' from Google Fonts` (`src/app/layout.tsx`); limitação do ambiente de validação, não erro de código.

**2. Frontend — com a mudança** (clone novo de `main` @ `77ef4cf` + a pasta `rastreio-frontend/` copiada por cima; `git status` mostrou apenas `src/lib/api/services.ts`):

- `npx tsc --noEmit`: sem erros.
- `npx eslint .`: saída **idêntica** ao baseline (os mesmos 10 problemas, comparada com `diff`). `npx eslint src/lib/api/services.ts` isolado: 0 problemas.
- `next build`: o mesmo erro de Google Fonts do baseline (sem nenhum erro de compilação ou de tipos).

**3. Teste de ponta a ponta com o código real** (backend de `main` + PostgreSQL reais; o teste executa o `services.ts` verdadeiro, empacotado com esbuild, e só simula o `document.cookie` para o `tokenStorage.get()` real funcionar; o e-mail do administrador foi verificado pelo fluxo real `POST /email/verificar-email/:token`, e o código de 6 dígitos foi lido do log de desenvolvimento do servidor):

| | `main` (antes) | `main` + correção (depois) |
| --- | --- | --- |
| `obter()` com sessão aberta | **FAIL — HTTP 401 "token não fornecido"** (o erro da sua tela; fluxo interrompido) | PASS — estado `ativo:false, pode_ativar:true` |
| `obter(token)` explícito, sem cookie | — | PASS |
| `obter()` sem cookie e sem token | — | PASS — continua 401 "token não fornecido" |
| `solicitarAtivacao()` → `confirmarAtivacao()` | — | PASS — 2FA ativo |
| `obter()` depois da ativação | — | PASS — `ativo:true` (a projeção aplicou o evento em ~56 ms) |
| Login com 2FA ativo | — | PASS — pede o código e **não** devolve token |
| `verificarDoisFatores()` | — | PASS — token emitido |
| `solicitarDesativacao({senha})` → `confirmarDesativacao()` | — | PASS — 2FA desativado |
| `obter()` depois da desativação | — | PASS — `ativo:false` (~53 ms) |

Resultado do "depois": **11 verificações, 0 falhas.**

**4. Desfazer a regra, ver falhar, restaurar:** revertendo **um método de cada vez** ao código original de `main` (numa cópia; a versão entregue ficou intacta), o teste de ponta a ponta **falhou nas 5 vezes** com `token não fornecido` (`obter`, `solicitarAtivacao`, `confirmarAtivacao`, `solicitarDesativacao`, `confirmarDesativacao`). Com a versão entregue, passa.

**5. Backend — baseline de `main` @ `4759474`** (o backend não muda; serve para provar que a base está sã):

- `gofmt -l .` sem saída; `go build ./...` e `go vet ./...` sem erros.
- `go test ./...` sem integração: todos os pacotes `ok`.
- `RUN_POSTGRES_INTEGRATION=1` com PostgreSQL real: todos os pacotes `ok`, e uma **segunda execução no mesmo banco** também `ok`. Os testes de 2FA: 48 `PASS`, 0 ignorados, 0 falhas.
- Servidor real subiu em banco novo e aplicou todas as migrations do zero (até `134_dois_fatores.sql`).

**Sem falhas pré-existentes em `main`** além dos 10 problemas de `eslint` listados acima e do `next build` bloqueado por rede.

**O que ficou sem validar:** a parte visual (o cartão num navegador) não foi vista; as chamadas HTTP que o cartão faz foram executadas com o código real do serviço. O `next build` não completou por rede (Google Fonts). O envio real do e-mail (Brevo) não foi exercido: usei o log de desenvolvimento do servidor para ler o código.

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch origin && git diff --stat 77ef4cf origin/main -- src/lib/api/services.ts`. Vazio = pode substituir; se aparecer o arquivo, ele mudou depois da base — não substitua e avise.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos (substitui `src/lib/api/services.ts` por inteiro e cria este documento em `src/docs/Lista de Tarefas/`). Nenhum arquivo precisa ser apagado, movido ou renomeado.
3. **Verifique** (abaixo).
4. **Marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Esperado: `tsc` sem erros; `eslint` com exatamente os 10 problemas antigos (2 erros, 8 avisos) listados acima e nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descartar essa alteração. Depois, com sessão aberta, em `/configuracoes/seguranca`: o cartão deve carregar o estado sem a mensagem "token não fornecido".

## Fora de escopo

- **Backend:** nenhuma alteração; as rotas e a Tarefa 122 do `rastreio-backend` estão corretas.
- **Cliente HTTP (`client.ts`):** não passa a anexar o token automaticamente — isso afetaria também as rotas públicas (login, cadastro, recuperação) e muda o contrato de todos os serviços.
- **Sessão expirada na interface:** se não houver sessão de verdade, o cartão continua a mostrar a mensagem devolvida pelo backend; um tratamento amigável ou redirecionamento ao login não faz parte desta tarefa.
- **`gerarTokenVerificacao` e `gerarTokenRecuperacao` em `services.ts`:** não têm chamadores; a rota `/email/gerar-token/verificacao` do backend é autenticada e essas funções também não enviam token. Hoje não causa erro; não foi tocado.
- **Atraso da projeção após ativar/desativar (observação, não alterada):** o login lê `dois_fatores_ativo` das tabelas de projeção, que são atualizadas de forma assíncrona (~55 ms medidos). Numa execução de teste em que chamei o login ~70 ms depois de confirmar a ativação, ele ainda não pediu o código. Se quiser fechar essa janela, é uma tarefa própria de backend.
- Os 10 problemas de `eslint` antigos e a falha de `next build` por rede.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida
- [ ] Pasta copiada por inteiro (1 alterado, 0 novos além deste documento)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Cartão em `/configuracoes/seguranca` carrega sem "token não fornecido"
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

# Tarefa 37 — Correção dos achados da verificação de segurança SEC-01 a SEC-15 (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `14a635c`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório (nenhum arquivo a apagar)
**Ordem de deploy:** **antes** da Tarefa 127 do `rastreio-backend`. O frontend novo funciona com o backend atual (sem o `token` novo na troca de senha mantém o token que já tem; sem o código `SESSAO_INVALIDA` não termina a sessão). O inverso quebra: o backend novo encerra as sessões antigas na primeira troca da senha temporária e só este frontend guarda o token novo e trata o `401`.

---

## Contexto

A verificação independente de 14/11/2026 encontrou, no frontend (achado R-10 do relatório):

- sem tratamento global do `401`: quando o servidor encerra a sessão (reset de senha, troca da senha temporária, conta apagada ou desativada) o utilizador fica numa interface em que todos os pedidos falham, sem voltar ao login;
- o `403 CONTA_DESVINCULADA` do estudante desvinculado aparecia como erro genérico, sem explicação prévia;
- o filtro "Tipo de vínculo" só existia para o admin, embora quem usa `vinculo=anterior` seja a **academia** (não tinha como listar os seus ex-estudantes); no admin, "Vínculo anterior" falhava; o campo `vinculo` de cada linha era tratado como relação real quando o servidor devolvia o eco do filtro;
- sem o aviso de exclusão de conta previsto no plano (6.5.2): perda de acesso e dívidas que ficam;
- parâmetros mortos `isRestrictedFinance` da sessão financeira restrita já eliminada;
- a cópia da `Documentação da API.md` do frontend tinha sido apagada (9692 linhas) no commit da Tarefa 36, sem constar da tarefa.

## Decisões de design

1. **A sessão só termina por `401` com `code: "SESSAO_INVALIDA"`.** O `401` de negócio (por exemplo, a senha atual errada em `PUT /alterar-senha`) não traz esse código e não pode deslogar o utilizador por engano. O código chega do servidor na Tarefa 127; com o backend antigo o comportamento atual mantém-se.
2. **Só reage quem enviou token.** Um `401` numa chamada pública não redireciona; na própria página de login não redireciona (evita laço).
3. **Troca da senha temporária:** a resposta pode trazer `token` novo; se vier, substitui o da sessão. Na troca normal a resposta não o traz e nada muda.
4. **Linhas reduzidas na lista.** Estudante que já seguiu para outra academia vem com `acesso: "reduzido"`: a tabela mostra "-" no género, nascimento e contactos e o estado "Desvinculado". O perfil reduzido (consulta por código) continua a abrir.
5. **Aviso de exclusão sem bloquear às cegas.** Se as mensalidades em aberto puderem ser consultadas, o botão só ativa depois de uma caixa de confirmação; se a consulta falhar, o aviso geral fica visível e a ação **não** é bloqueada (a verificação é informativa, não uma regra do servidor).
6. **`Documentação da API.md` restaurada** tal como estava em `4431e1e` (versão anterior à remoção). A cópia está desatualizada em relação ao backend; sincronizá-la é outra tarefa (ver "Fora de escopo"). Se a remoção foi intencional, basta apagar o arquivo de novo.

## O que foi atualizado e onde

**12 arquivos alterados + 3 novos + este documento.** Números de linha referem-se aos arquivos entregues.

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/api/client.ts` | `CODIGO_SESSAO_INVALIDA`, `CODIGO_CONTA_DESVINCULADA`, `ROTA_LOGIN_SESSAO_ENCERRADA` (95-105), `tratarSessaoInvalida` (107), chamada em `fetchApi` e `fetchApiBlob` (301) | Tratamento global: `401` com `SESSAO_INVALIDA` numa chamada com token limpa a sessão local e leva a `/login?motivo=sessao-encerrada`. |
| `src/components/auth/LoginForm.tsx` | estado `sessaoEncerrada` (26) e aviso azul acima dos erros | Mostra "A sua sessão foi encerrada. Entre novamente para continuar." quando chega com `?motivo=sessao-encerrada` (lê `window.location`, sem `useSearchParams`, para não exigir `Suspense` no build). |
| `src/lib/api/services.ts` | `perfilService.alterarSenha` (679) | O tipo de resposta passa a `{ message, token? }`. |
| `src/app/(full-width-pages)/trocar-senha/page.tsx` | envio do formulário (76) | Guarda o `token` novo devolvido pela troca da senha temporária. |
| `src/components/estudante/AvisoContaDesvinculada.tsx` (**novo**) | componente (11) | Faixa que explica ao estudante desvinculado o que pode e não pode fazer. |
| `src/app/(painel)/layout.tsx` | acima de `{children}` (104) | Mostra a faixa quando `user.tipo === 'estudante'` e `user.estudante.status === 'inativo'`. |
| `src/components/estudante/AvisoExclusaoConta.tsx` (**novo**) | componente (31) | Aviso de exclusão (estudante e academia): consulta as mensalidades em aberto, mostra quantidade e total em Kz e exige confirmar quando há dívida. |
| `src/app/(painel)/perfil/PageContent.tsx` | zona de perigo do estudante (105 e botão) | Usa o aviso; o botão "Deletar conta" só ativa depois da confirmação. |
| `src/app/(painel)/estudantes/PageContent.tsx` | modal de exclusão (772 e botão), select "Tipo de vínculo" (269), montagem dos parâmetros (963) | Aviso de exclusão para a academia; o filtro de vínculo passa a existir para **academia e admin** (Todos, Vínculo atual, Vínculo anterior) e envia só `atual`/`anterior` (o padrão do servidor é `todos`). |
| `src/components/estudantes/estudantesEscalaShared.tsx` | filtro do cliente (124), `formatarStatusEstudante` (168), tabela (281-300) | O filtro do cliente só compara quando é `atual`/`anterior`; selo "Vínculo anterior" ao lado do nome; linhas `reduzido` sem género, nascimento e ações de documentação e com o estado "Desvinculado". |
| `src/types/api.ts` | `EstudanteDetalhado` (2153) | Documenta `vinculo` como relação real e acrescenta `acesso?: 'reduzido'`. |
| `src/lib/route-guards.ts` · `src/components/guards/RouteGuard.tsx` · `src/hooks/useRoutePermission.ts` | `checkRoutePermission` (364), chamadas (45, 19) | Removido o parâmetro morto `isRestrictedFinance` (sessão financeira restrita eliminada na Tarefa 36); `deveAlterarSenha` passa a ser o 4.º argumento. Comportamento igual ao anterior. |
| `src/docs/Documentação da API.md` (**restaurado**) | arquivo inteiro | Volta a existir, igual ao de `4431e1e`. |

**Contrato consumido do backend (Tarefa 127):** `401` com `"code": "SESSAO_INVALIDA"`; `200 {"message", "token"}` em `PUT /alterar-senha` quando a conta tinha senha temporária; `GET /estudantes` com `vinculo=atual|anterior` e linhas com `vinculo` real e `acesso: "reduzido"`; perfil reduzido do `GET /consultar-estudante` sem `codigo_academia`, estado escolar e com `status: "desvinculado"`.

## Validação realizada

Ambiente: Node com `npm ci` limpo a partir do `package-lock.json`.

**Baseline de `main` (`14a635c`):** `npx tsc --noEmit` → 0 erros; `npx eslint .` → 10 problemas (2 erros e 8 avisos, todos pré-existentes, em `verificar-email/[token]/page.tsx`, `Calendar.tsx` e outros arquivos que esta tarefa não toca).

**Com a mudança (clone novo de `main` + pasta copiada por cima):**

```
npx tsc --noEmit -p tsconfig.json   → 0 erros
npx eslint .                        → 10 problemas (os mesmos 10, nenhum novo)
npx next build                      → compila e gera as 71 rotas (ver nota)
```

Nota sobre o `next build`: neste ambiente o Google Fonts é inacessível e o build falha **só** por isso (`Failed to fetch Outfit from Google Fonts`). Para validar o resto, o `layout.tsx` raiz foi trocado **temporariamente** por uma fonte local, o build foi corrido (saída 0, todas as rotas geradas) e o arquivo foi restaurado; esse arquivo **não** faz parte da entrega.

**Guarda de rotas (executada de verdade):** transpilada e corrida em Node, antes e depois da mudança de assinatura: com senha temporária pendente qualquer rota → `/trocar-senha` e `/trocar-senha` é permitida; sem ela `/painel` é permitido ao estudante; `deveAlterarSenha` omitido equivale a `false`; `/recuperar-senha/<token>` é pública; rota privada sem login continua a redirecionar para `/` (igual ao `main`).

**O que não foi validado:** o frontend não tem suíte de testes e não houve ensaio no navegador. Ficam por testar à mão: (1) cadastrar um estudante, entrar com a senha temporária e trocá-la (deve seguir para o painel sem nova autenticação); (2) com a sessão aberta em dois navegadores, redefinir a senha por link num e ver o outro voltar ao login com o aviso; (3) listar estudantes como academia com "Vínculo anterior"; (4) abrir "Deletar conta" com e sem mensalidades em aberto; (5) entrar como estudante desvinculado e ver a faixa. Os itens 1, 2 e 3 dependem do backend da Tarefa 127.

## Como aplicar

1. **Confirme que a base não mudou:** `git diff --stat 14a635c HEAD -- src` (vazio = pode substituir).
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
3. **Verifique** (abaixo).
4. **Deploy do frontend primeiro**, depois o backend da Tarefa 127.
5. **Marque como feito** (abaixo).

## Verificação

```bash
npm ci
npx tsc --noEmit
npx eslint .            # esperado: 10 problemas (os mesmos de antes, nenhum novo)
npm run build           # com acesso ao Google Fonts
```

## Fora de escopo

- Os **2 erros e 8 avisos de ESLint já existentes** (`verificar-email/[token]/page.tsx`, `Calendar.tsx`, etc.): não têm relação com segurança e ficam como estão.
- **Sincronizar** `src/docs/Documentação da API.md` com a documentação do backend: tarefa à parte.
- **D4 para academias** (entrar em qualquer estado) e a tela de conta restrita que exigiria: ver Tarefa 127, decisão 1.
- **Rate limit** de login e recuperação: Tarefa 127, decisão 6.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida (`14a635c`)
- [ ] Pasta copiada (12 alterados, 3 novos); a `Documentação da API.md` restaurada mantida ou apagada de propósito
- [ ] `tsc` 0 erros; `eslint` 10 problemas (os mesmos); `build` ok com acesso ao Google Fonts
- [ ] Testes manuais 1 a 5 feitos (1 a 3 depois do backend da Tarefa 127)
- [ ] Deploy do frontend feito **antes** do backend da Tarefa 127
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

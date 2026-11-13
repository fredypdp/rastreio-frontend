# Tarefa 34 — Segurança SEC-01 a SEC-07: troca obrigatória da senha temporária e recuperação por link (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `35aea1a` (`35aea1a`, a Tarefa 33 já está aplicada em `main`; o documento dela ainda está em "Lista de Tarefas" e não foi tocado)
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** **depende da Tarefa 123 do `rastreio-backend` já em produção** (campo `deve_alterar_senha` no login e no perfil, `403` com `code: "SENHA_TEMPORARIA"`, objeto `credenciais` nas respostas de cadastro, rotas `…/credenciais/reenviar`, recuperação por link em `POST /email/recuperar-senha/*`). Sem ela: o login nunca devolve `deve_alterar_senha`, a tela `/trocar-senha` fica inalcançável, os botões "Reenviar credenciais" recebem 404, o aviso de credenciais não aparece nos cadastros e o `esqueci-senha` mostraria uma mensagem de "link" enquanto o backend antigo ainda trocaria a senha na hora. **Publicar logo depois do backend, na mesma janela** (ver Tarefa 123: entre os dois deploys não se devem criar contas nem rodar o comando de migração).

---

## Contexto

Parte de frontend dos itens **SEC-01 a SEC-07** do plano `seguranca-e-migracao-brevo.md` (a parte de backend é a **Tarefa 123 do `rastreio-backend`**):

- **SEC-01** — os wrappers `gerarTokenVerificacao` e `gerarTokenRecuperacao` (mortos: nada os chamava) deixam de existir junto com as rotas do backend.
- **SEC-03** — a recuperação de senha passa a ser **por link**: o e-mail leva para `/recuperar-senha/<token>`, página nova onde o titular escolhe a nova senha. Antes, o pedido já trocava a senha.
- **SEC-04** — contas criadas por terceiros nascem com **senha temporária** enviada por SMS (estudante, academia) ou e-mail (administrador). O frontend leva o titular a uma tela de **troca obrigatória** (`/trocar-senha`) e deixa de mostrar "senha padrão = código" em qualquer ecrã.
- **SEC-05** — as quatro senhas públicas antigas (`SenhasPadrao`, `SenhaPadrao`, `getSenhaPadrao`) saem do código; o único arquivo do repositório que ainda as mostrava (um documento de tarefa antigo) foi higienizado.
- **SEC-06** — `esqueci-senha` (estudante/academia e admin) deixa de distinguir "conta não encontrada" e "e-mail não verificado": a mensagem é sempre a do servidor.

**Descobertas que moldaram o desenho:**

- O cliente de API descartava campos desconhecidos do envelope de erro; sem `code` não havia como reconhecer o `403 SENHA_TEMPORARIA`. O envelope passou a aceitar `code` e `retry_after_segundos`.
- Não há proxy/middleware do Next: a navegação protegida vive no `RouteGuard` (cliente). A flag da senha temporária é um cookie de **conveniência de navegação**; quem impõe a regra é o servidor.
- O estudante inativo recebe sessão restrita ao financeiro (`/pagamentos`). Se também tiver senha temporária, a troca vem antes; depois da troca segue para `/pagamentos`.
- O `PasswordSettingsCard` habilitava o botão a partir de 6 caracteres enquanto o backend (e a validação do próprio cartão) exige 8.
- A lista de estudantes não tem um `id` por linha (só o código); o botão de reenvio ficou na **tela de detalhes** do estudante, onde o código está sempre à mão. O mesmo para a academia (subtela de detalhes) e, na lista de administradores, o botão está em cada linha.
- `src/docs/Documentação da API.md` é uma cópia própria que já diferia da do backend; **não** foi sincronizada (ver "Fora de escopo").

## Interpretações adotadas

1. A tela `/trocar-senha` fica fora do `RouteGuard` (como `verificar-email`): ao abrir, pergunta ao servidor (`GET /meu-perfil`) se a troca ainda é necessária, porque o servidor é a fonte da verdade — se não for, volta ao painel; se a sessão estiver encerrada (por exemplo, credenciais reenviadas), limpa a sessão local e vai ao login.
2. O `esqueci-senha` de estudante/academia continua sem pedir o tipo de conta (o backend tenta estudante, academia e admin).
3. O cadastro de administrador deixou de pedir "Senha inicial" e passou a exigir **telefone** (9 dígitos iniciados por 9) — o backend já o exigia e o formulário não o pedia.
4. O botão "Reenviar credenciais" mostra-se para quem pode pedir (academia dona e admin na tela de estudante; admin `fpp` na de academia e de administrador); o backend decide e devolve 403/429 com mensagem, que a interface mostra.
5. Os textos dos formulários de cadastro foram trocados de "senha padrão = código" para "senha temporária enviada por SMS", e o ecrã de sucesso mostra o resultado do envio (enviada, ambiente sem SMS, provedor não configurado, falha) em vez de exibir uma senha.

## O que foi atualizado e onde

**21 arquivos alterados + 4 novos** (mais este documento). Nenhum arquivo apagado, renomeado ou movido. `package.json`, `package-lock.json` e `yarn.lock` intactos.

### Cliente de API, guards e sessão

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/api/client.ts` | `ApiErrorEnvelope` (53) e `asApiErrorEnvelope` (77); `CODIGO_SENHA_TEMPORARIA` (83); `ROTA_TROCAR_SENHA` (86); `fetchApi` (265); `tokenStorage.deveAlterarSenha` (410) e `setDeveAlterarSenha` (415); `tokenStorage.remove` (388, 420) | Envelope aceita `code` e `retry_after_segundos`. Um `403` com `SENHA_TEMPORARIA` marca a flag (cookie `deve_alterar_senha`, mesma validade do token) e leva à troca obrigatória, seja qual for a tela que fez a chamada. `remove()` apaga também o cookie da flag. |
| `src/lib/route-guards.ts` | rotas públicas (48); rota `/trocar-senha` (343); `checkRoutePermission` (369, 381) | `/recuperar-senha/[token]` pública (não redireciona quem já está autenticado); `/trocar-senha` exige sessão; novo parâmetro `deveAlterarSenha`: com a flag ligada, qualquer outra rota redireciona para `/trocar-senha` (antes da regra do estudante restrito). |
| `src/components/guards/RouteGuard.tsx` | cálculo da permissão (45) | Passa a flag ao `checkRoutePermission`. |
| `src/hooks/useRoutePermission.ts` | cálculo da permissão (24) | Idem. |
| `src/components/auth/LoginForm.tsx` | `concluirLogin` (47, 51, 63, 66) | Grava a flag a partir de `deve_alterar_senha` e segue para `/trocar-senha` em vez de `/painel` (ou `/pagamentos`, no estudante restrito). Cobre o login normal e o passo do 2FA (ambos passam por `concluirLogin`). |

### Tipos e serviços

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/types/api.ts` | `deve_alterar_senha` (1194, 2106, 2139); `CredenciaisEnvio` (1202); `ReenviarCredenciaisResponse` (1215); `CriarAdminRequest` (507); `credenciais` na aprovação de matrícula (419); `SolicitarRecuperacaoRequest.tipo` (783); `AuthResponse` e `MeuPerfilResponse` | Campo `deve_alterar_senha` em login, perfil, administrador, estudante e academia (listas); tipos do resultado do envio e do reenvio; `CriarAdminRequest` sem `senha` e com `telefone` obrigatório; `tipo` passa a opcional na recuperação (como no backend). |
| `src/types/email-auth.ts` | `RecuperarSenhaRequest` (9); `ResetarSenhaRequest` (18) | **SEC-05:** removidos `SenhasPadrao`, `SenhaPadrao` e `getSenhaPadrao` (as quatro senhas públicas). `GerarTokenRecuperacaoRequest` renomeado para `RecuperarSenhaRequest` (não gera token nenhum); comentários atualizados (a resposta da recuperação é sempre a mesma). |
| `src/lib/api/services.ts` | `emailService` (670, 683, 687); `estudanteService.reenviarCredenciais` (1161); `adminService.criarAdmin` (2414), `reenviarCredenciaisAdmin` (2426), `reenviarCredenciaisAcademia` (2437); resposta de `registrarAcademia` (2463) e do cadastro de estudante (1404) | **SEC-01:** removidos `gerarTokenVerificacao` e `gerarTokenRecuperacao`; `solicitarVerificacaoEmail` passa a não enviar payload (o backend usa o JWT); novo `resetarSenha(token, …)`. Funções de reenvio dos três tipos. As respostas de criação passam a tipar `credenciais`. |
| `src/lib/api/services/email.service.ts` | `solicitarRecuperacaoSenha` (41); `resetarSenha` (52) | Documentação corrigida (já não troca senha nem envia senha); novo `resetarSenha` para a página do link. |
| `src/lib/utils/email.ts` | `ResetarSenhaComToken` (45) | Função nova usada pela página do link; comentário da recuperação atualizado. |
| `src/lib/utils/senha.ts` (**novo**) | `SENHA_TAMANHO_MINIMO` (4); `validarNovaSenha` (12) | Validação compartilhada da nova senha: 8 a 128, confirmação igual e, na troca obrigatória, diferente da atual. |

### Telas novas

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/app/(full-width-pages)/recuperar-senha/[token]/page.tsx` (**novo**) | `RecuperarSenhaPage` (20); `handleSubmit` (31) | Página pública aberta pelo link do e-mail: nova senha + confirmação, mensagens do servidor (link expirado/usado → sugere pedir outro) e, ao concluir, limpa a sessão local (as sessões antigas deixam de valer no servidor) e oferece o login. |
| `src/app/(full-width-pages)/trocar-senha/page.tsx` (**novo**) | `TrocarSenhaPage` (22); `handleSubmit` (64); `sair` (86) | Troca obrigatória: senha temporária + nova senha + confirmação; confere no servidor se a troca ainda é necessária; ao concluir apaga a flag e segue para `/painel` (ou `/pagamentos` no estudante restrito); botão "Sair". |
| `src/components/common/CredenciaisEnvioAviso.tsx` (**novo**) | `descreverEnvioCredenciais` (11); componente (29) | Texto único do resultado do envio das credenciais, usado nos cadastros e na aprovação; nunca mostra senha. |

### Telas alteradas

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/app/(full-width-pages)/(auth)/esqueci-senha/PageContent.tsx` | estado `MensagemSucesso` (20, 81, 105); chamada (80); botão (101) | **SEC-06:** sem ramos "não encontrado" / "e-mail não verificado"; mostra sempre a mensagem do servidor; erro só para falha de serviço ou de rede; texto do botão "Enviar link de recuperação". |
| `src/app/(full-width-pages)/(auth)/dominis/esqueci-senha/PageContent.tsx` | idem (20, 89, 113; chamada 88; botão 109) | Idem para o administrador; removido o aviso de e-mail não verificado. |
| `src/app/(painel)/administradores/PageContent.tsx` | `reenviar` (28); `handleCriar` (48); `handleReenviar` (62); `canResend` (43, 87); indicador (87); campo Telefone (89) | Modal de criação sem "Senha inicial" e com **Telefone**; feedback diz se o e-mail com as credenciais foi enviado; botão "Reenviar credenciais" (somente `fpp`, nunca para si próprio) e distintivo "Credenciais por confirmar". |
| `src/app/(painel)/estudantes/PageContent.tsx` | tela de detalhes: `reenviarCredenciais` (475); `handleReenviarCredenciais` (479, 639); secção "Credenciais de acesso" (632) | Indicador do estado das credenciais e botão "Reenviar credenciais" com confirmação; mensagem de retorno (inclusive 429 do intervalo de 10 minutos). |
| `src/app/(painel)/academias/PageContent.tsx` | subtela de detalhes: `reenviarCredenciaisAcademia` (138); `handleReenviarCredenciais` (142, 193); secção "Credenciais de acesso" (186) | Idem para a academia (admin). |
| `src/app/(painel)/academias/cadastrar/PageContent.tsx` | sucesso (30, 52); nota informativa (64) | Deixa de exibir "Senha padrão"; mostra o resultado do envio por SMS; texto atualizado. |
| `src/components/academia/AcademiaCadastroForm.tsx` | validação do telefone (107) | O telefone, que recebe as credenciais por SMS, deve ser móvel de 9 dígitos iniciado por 9 (antes: 9 dígitos quaisquer). |
| `src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx` | sucesso (147); resultado (541); nota informativa (831) | Deixa de exibir "Senha padrão = código"; mostra o resultado do envio; texto atualizado. |
| `src/app/(painel)/solicitacoes-matricula/PageContent.tsx` | `aprovar` (176); aviso (109, 281) | Mostra o resultado do envio das credenciais quando a aprovação (sem taxa) já cria a conta. |
| `src/app/(painel)/configuracoes/PasswordSettingsCard.tsx` | habilitação do botão (20) | Mínimo de 8 caracteres (antes 6), igual ao backend. |
| `src/docs/Tarefas feitas/1 - Remover Envio de E-mails pelo Frontend e Notificacao Duplicada.md` | bloco "Senhas padrão" | **SEC-05:** os quatro valores literais substituídos por `[REMOVIDO]` (era o único arquivo restante que os exibia). |

## Validação realizada

**Ambiente:** Node 22.23.4, npm 10.9.9, `npm ci` do projeto.

| Comando | `main` (baseline) | Clone novo de `main` + a pasta entregue |
| --- | --- | --- |
| `npx tsc --noEmit -p tsconfig.json` | 0 erros | 0 erros |
| `npx eslint .` | 10 problemas (2 erros, 8 avisos) | **os mesmos 10** (2 erros, 8 avisos); conjunto idêntico ao baseline, nenhum problema novo |
| `npx next build` | falha só por rede (Google Fonts) | falha só por rede: `Failed to fetch 'Outfit' from Google Fonts` |
| `npx next build` com a fonte desligada **só no sandbox** | — | `✓ Compiled successfully`, exit 0, e as rotas novas `/recuperar-senha/[token]` e `/trocar-senha` são geradas; o `layout.tsx` foi restaurado e o `git status` dele ficou vazio |

Os 10 problemas antigos do `eslint` (2 erros e 8 avisos) já existiam em `main`: o erro das páginas de verificação de e-mail e o do `Calendar`, mais avisos de `react-hooks/exhaustive-deps` e similares, **nenhum em arquivo alterado por esta tarefa**.

**Não foi validado:** o repositório **não tem testes automatizados de frontend**, e o sandbox não tem navegador nem o backend rodando junto: os fluxos de tela (login → troca obrigatória, link de recuperação, botões de reenvio) foram verificados por tipos, lint e build, e a lógica correspondente do servidor está coberta pelos testes de integração da Tarefa 123. Recomenda-se um teste manual dos fluxos abaixo depois do deploy.

Roteiro de teste manual (com o backend novo): (1) criar um estudante e abrir o login com a senha do SMS → cai em `/trocar-senha`; (2) tentar abrir `/painel` antes de trocar → volta para `/trocar-senha`; (3) trocar a senha → segue para o painel; (4) pedir recuperação de senha para um e-mail inexistente e para um existente → mesma mensagem; (5) abrir o link do e-mail e definir a senha; (6) reenviar credenciais na tela de detalhes e confirmar que a sessão aberta anterior é encerrada.

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch && git diff --stat 35aea1a origin/main -- src` (vazio = pode substituir). Para ver só os arquivos que esta tarefa toca: `git diff --stat 35aea1a HEAD -- src/app src/components src/hooks src/lib src/types src/docs`.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos (substitui cada arquivo por inteiro).
3. **Verifique** (abaixo).
4. **Marque como feito** (abaixo).

## Verificação

```bash
npm install            # não deve alterar package.json, package-lock.json nem yarn.lock
npx tsc --noEmit -p tsconfig.json
npx eslint .
npx next build         # só falha por rede se não alcançar o Google Fonts
```

Esperado: `tsc` sem erros; `eslint` com exatamente os 10 problemas antigos (2 erros, 8 avisos), nenhum novo. Conferir com `git status` que `yarn.lock` não aparece modificado (um `npm install`/`npm ci` pode alterá-lo; se acontecer, descarte com `git checkout yarn.lock`).

## Fora de escopo

- **Backend:** Tarefa 123 do `rastreio-backend`.
- **SEC-08 a SEC-15** e as Partes 6 a 8 do plano (login por estado da conta, vínculo, serviços ao sair, etc.).
- **`src/docs/Documentação da API.md`:** é uma cópia própria que já diferia da do backend; não foi sincronizada. Se quiser mantê-la espelhada, copie a versão 2.10.0 da Tarefa 123.
- **Botão de reenvio nas linhas das listas de estudantes e academias:** fica na tela de detalhes (a lista de estudantes não expõe um identificador por linha além do código); apenas a lista de administradores tem o botão por linha.
- **Reescrita do histórico do Git e rotação das senhas públicas em produção:** ver a Tarefa 123; o único arquivo do repositório que ainda mostrava as senhas (o documento da Tarefa 1) já foi higienizado, mas o histórico só muda com a reescrita.
- **Teste de interface automatizado** (o repositório não tem runner de testes).

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Tarefa 123 do `rastreio-backend` já em produção
- [ ] Base conferida (`35aea1a`)
- [ ] 25 arquivos copiados (21 alterados, 4 novos); nenhum apagado
- [ ] `npx tsc --noEmit -p tsconfig.json` sem erros
- [ ] `npx eslint .` com os mesmos 10 problemas antigos
- [ ] `next build` (só falha por rede, se for o caso)
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Teste manual do roteiro acima
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

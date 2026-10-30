# Tarefa 32 — Verificação em duas etapas (2FA) por e-mail (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `e1616fa` (`e1616fa95c68546dbc72f75080cde65a53f08c09`, tarefa 31 já aplicada)
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** **depende da Tarefa 122 do `rastreio-backend` já em produção** (rotas `/dois-fatores/*`, `/login/dois-fatores/*` e a nova resposta de `POST /login`). Sem ela: o login normal continua igual (ninguém tem 2FA ainda), mas o cartão "Verificação em duas etapas" da página Segurança mostra o erro "Não foi possível carregar…" porque a rota `GET /dois-fatores` não existe. Publique primeiro o backend, depois este frontend.

---

## Contexto

Pedido: verificação de duas etapas por e-mail, com código numérico de 6 dígitos (parte de backend na Tarefa 122 do `rastreio-backend`).

- **Ativar:** o usuário (admin, academia ou estudante) abre Configurações › Segurança, pede o código, recebe-o no e-mail e digita-o.
- **Desativar:** semelhante, mas exige também a **senha atual** (decisão do dono do projeto).
- **Entrar:** com o 2FA ativo, depois de usuário e senha corretos a tela de login passa a pedir o código de 6 dígitos enviado ao e-mail; só então o acesso é concedido.

Antes desta tarefa o `LoginForm` assumia que `POST /login` sempre devolve o token. Agora o backend pode devolver `requer_dois_fatores` **sem token**; sem tratar isso a tela quebraria para quem ativar o 2FA.

## O que foi atualizado e onde

**5 arquivos alterados + 4 novos** (mais este documento).

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/types/dois-fatores.ts` (**novo**) | tipos (linhas 9–72); `exigeDoisFatores` (31); `TAMANHO_CODIGO_DOIS_FATORES` (74) | Contratos das rotas novas e a resposta do login em duas formas (`AuthResponse` ou pedido de código), com um *type guard* que distingue as duas. |
| `src/lib/api/services.ts` | imports (7–16); `authService.login` (585); `verificarDoisFatores` (592); `reenviarDoisFatores` (599); novo `doisFatoresService` (624–643) | `login` passa a tipar a resposta como "token **ou** pedido de código"; novas chamadas de verificação e reenvio no login; novo serviço com `obter`, `solicitarAtivacao`, `confirmarAtivacao`, `solicitarDesativacao`, `confirmarDesativacao`. |
| `src/lib/api/index.ts` | export (linha 10) | Exporta `doisFatoresService`. |
| `src/hooks/useContagemRegressiva.ts` (**novo**) | `useContagemRegressiva` (9) | Contagem regressiva em segundos para o botão "Reenviar código"; baseada no relógio (`Date.now`), por isso continua certa com a aba em segundo plano. |
| `src/components/auth/CodigoVerificacaoInput.tsx` (**novo**) | `CodigoVerificacaoInput` (21); `somenteDigitosDoCodigo` (7) | Campo do código: só dígitos, até 6 (aceita colar "123 456"), teclado numérico no celular, preenchimento automático do código recebido (`one-time-code`), foco ao aparecer. Componente próprio para não alterar o `InputField` compartilhado. |
| `src/components/auth/LoginForm.tsx` | imports (11–15); estados da segunda etapa (25–34); `concluirLogin` (47); `abrirEtapaDoCodigo` (66); `handleLogin` (75, ramo do 2FA na 90); `handleVerificarCodigo` (101); `handleReenviarCodigo` (126); `handleVoltarParaCredenciais` (142); cabeçalho e formulário do código (175–253) | O fluxo de guardar o token e entrar (inclusive o ramo do estudante inativo → `/pagamentos`) foi movido sem mudança de comportamento para `concluirLogin`, usado pelo login normal e pela segunda etapa. Nova tela do código; a tela de usuário/senha ficou igual. |
| `src/app/(painel)/configuracoes/DoisFatoresSettingsCard.tsx` (**novo**) | `DoisFatoresSettingsCard` (70); `carregar` (84); ativação (119, 132); desativação (156, 175); `reenviarCodigo` (203); fases na tela (299–384) | Cartão "Verificação em duas etapas" da página Segurança (visual igual ao cartão "Alterar senha"). |
| `src/app/(painel)/configuracoes/PageContent.tsx` | import (10); render de Segurança para academia e estudante (35–43) | Mostra o cartão novo abaixo do cartão de senha. |
| `src/app/(painel)/configuracoes/AdminSection.tsx` | import (12); bloco de Segurança (841–846) | Idem para admin (o bloco já agrupava o cartão de senha). |

### Comportamento resultante (o que cada perfil vê)

Vale para **admin, academia e estudante** — o cartão fica em Configurações › Segurança, que já era liberada para os três perfis (nenhum guard de rota precisou mudar).

- **Entrar com 2FA ativo:** depois de usuário e senha aparece "Verificação em duas etapas", com o e-mail mascarado (ex.: `a***a@exemplo.com`) e a validade do código. O usuário digita os 6 dígitos e clica em "Verificar e entrar" (ou Enter). "Reenviar código em Ns" só habilita depois do intervalo informado pelo backend (60 s); o reenvio invalida o código anterior. "Voltar" limpa tudo e leva de volta a usuário/senha. Erros (código incorreto com tentativas restantes, expirado, já usado, substituído, tentativas esgotadas, sessão de login expirada, e-mail indisponível) aparecem na própria tela com a mensagem do backend. Estudante inativo continua indo para `/pagamentos` depois do código, como antes.
- **2FA desativado:** o cartão mostra "Desativada". Se o e-mail estiver verificado, o botão "Ativar verificação em duas etapas" envia o código; digita-se o código e confirma-se. Se o e-mail não estiver verificado, o botão fica desabilitado e o cartão explica o motivo.
- **2FA ativo:** o cartão mostra "Ativada", o e-mail que recebe os códigos e o aviso de que, enquanto estiver ativa, o e-mail da conta não pode ser alterado. "Desativar" pede a **senha atual**, envia o código e só desativa com a senha e o código corretos. A senha fica apenas na memória do componente durante o fluxo e é descartada ao concluir ou cancelar.
- Sem preenchimento automático ao completar os 6 dígitos (o envio é sempre uma ação explícita), para evitar envios duplicados.
- Decisões de UI: reaproveitados o padrão visual e os ícones do `PasswordSettingsCard`, os avisos de erro/sucesso no mesmo estilo e o botão e o campo do `LoginForm`.
- O cliente HTTP (`client.ts`) **não foi alterado**: ele descarta campos extras do erro (`tentativas_restantes`, `retry_after_segundos`), mas a mensagem do backend já traz a informação ("Restam 3 tentativas", "Aguarde N segundos"); o tempo do botão de reenvio vem de `reenvio_em_segundos`, devolvido a cada envio.

## Validação realizada

**Ambiente:** Node 22 e dependências instaladas de verdade com `npm ci` (797 pacotes). O `npm ci` reescreve o `yarn.lock` localmente; essa alteração foi descartada (nada de `package.json`, `package-lock.json` ou `yarn.lock` está na entrega).

**Baseline (`main` @ `e1616fa`, clone novo):**

```
npx tsc --noEmit  → exit 0 (sem erros)
npx eslint .      → exit 1: 10 problemas (2 erros, 8 avisos) — todos antigos, em arquivos que esta tarefa não toca
```

Problemas antigos do `eslint` (arquivo → linha): `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` 29:7 (**erro**, setState síncrono em efeito); `src/components/calendar/Calendar.tsx` 102:13 (**erro**, função impura na renderização); avisos em `src/app/(painel)/estudantes/cadastrar/SelecaoContextoMassa.tsx` 80:5 e 115:5 (diretiva eslint-disable sem efeito); `src/components/paineis/CategoriasServicoPainel.tsx` 33:38, `MinhasInscricoesServicoExtraPainel.tsx` 3:769, `ServicosExtrasPainel.tsx` 75:38, `ServicosExtrasSolicitacoesPainel.tsx` 13:507 (dependência faltando em `useEffect`); `src/layout/AppSidebar.tsx` 160:5 (diretiva sem efeito) e 162:6 (dependência faltando).

**Com a mudança (clone novo de `main` @ `e1616fa` + a pasta `rastreio-frontend/` copiada por cima):**

```
git status --short → 5 arquivos alterados + 4 novos; package.json / package-lock.json / yarn.lock intactos
npx tsc --noEmit   → exit 0 (sem erros)
npx eslint .       → exit 1: 10 problemas (2 erros, 8 avisos) — saída idêntica ao baseline, nenhum problema novo
```

**`next build`:** falha **apenas por rede**: o ambiente de validação não alcança `fonts.googleapis.com` (`Failed to fetch 'Outfit' from Google Fonts`) — limitação do ambiente, não erro de código; ele falha igual em `main`. Para provar que o restante compila, o build foi repetido com a fonte do `layout.tsx` trocada por um valor local **apenas durante o teste** (o `layout.tsx` foi restaurado depois; não faz parte da entrega): `✓ Compiled successfully`, 67/67 páginas geradas, incluindo `/login` e `/configuracoes/seguranca`, exit 0.

**O que NÃO foi validado:**

- A parte visual **não foi vista num navegador** (não há navegador no ambiente de validação): as telas foram verificadas por tipos, lint e compilação, não por inspeção visual.
- O repositório não tem executor de testes de frontend (sem Jest/Vitest/Playwright), então não há testes automatizados desta tarefa; o contrato com o backend está coberto pelos testes de integração da Tarefa 122.
- Integração real com o backend de produção (e-mail do Brevo) não foi exercitada.

## Como aplicar

1. **Confirme que a base não mudou** (vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise):
   ```bash
   git diff --stat e1616fa HEAD -- "src/app/(painel)/configuracoes/AdminSection.tsx" "src/app/(painel)/configuracoes/PageContent.tsx" src/components/auth/LoginForm.tsx src/lib/api/index.ts src/lib/api/services.ts
   git ls-remote https://github.com/fredypdp/rastreio-frontend.git refs/heads/main   # deve ser e1616fa95c68…
   ```
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos. Nenhum arquivo é apagado, movido ou renomeado.
3. **Verifique** (abaixo).
4. **Publique só depois** de a Tarefa 122 do `rastreio-backend` estar em produção.
5. **Marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Esperado: `tsc` sem erros; `eslint` com exatamente os 10 problemas antigos listados acima e nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração (`git checkout -- yarn.lock package-lock.json`).

## Fora de escopo

- Toda a parte de servidor (rotas, tabela, e-mail, limites): **Tarefa 122 do `rastreio-backend`**.
- Outros métodos de segundo fator (SMS, WhatsApp, aplicativo autenticador) e códigos de recuperação.
- Recuperação de conta quando o usuário perde o acesso ao e-mail com o 2FA ativo.
- Mostrar o estado do 2FA fora da página Segurança (perfil, barra lateral) e tornar o 2FA obrigatório.
- "Lembrar este dispositivo" e preenchimento automático ao completar os 6 dígitos.
- Tela para verificar o e-mail (já existe em outro lugar); aqui apenas se explica quando o e-mail precisa ser verificado.
- Alterar `client.ts`, `InputField`, guards de rota ou `package.json`.
- Testes automatizados de frontend (o repositório não tem executor).

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida
- [ ] Pasta copiada por inteiro (5 alterados, 4 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos (10 antigos)
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Tarefa 122 do `rastreio-backend` já em produção antes de publicar
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

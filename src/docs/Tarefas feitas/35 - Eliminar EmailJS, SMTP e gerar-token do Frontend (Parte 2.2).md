# Tarefa 35 — Eliminar EmailJS, SMTP e gerar-token do Frontend (Parte 2.2) (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `7410248`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** pode ir para produção independentemente do backend; o backend já eliminou EmailJS/SMTP/gerar-token na Tarefa 123 do `rastreio-backend` e usa apenas Brevo

---

## Contexto

Parte da implementação da **Parte 2** (eliminar EmailJS, SMTP, gerar-token/*) do documento `docs/Debbugs/seguranca-e-migracao-brevo.md`. O backend já fez isso na Tarefa 123 (`rastreio-backend`). Esta tarefa limpa o frontend:

1. Remove o objeto `emailService` morto de `src/lib/api/services.ts` (linhas 645-663, que continha `verificarEmail`, `solicitarVerificacaoEmail`, `solicitarRecuperacaoSenha`, `resetarSenha`, `gerarTokenVerificacao`, `gerarTokenRecuperacao` — nenhum usado no código).
2. Remove a exportação de `emailService` de `src/lib/api/index.ts`.
3. Remove variáveis de ambiente legadas do `.env.example`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `ADMINS_NOTIFICACAO_ACADEMIA`, `NEXT_PUBLIC_APP_URL` (nenhuma é lida pelo código em `src/`).
4. Remove o tipo `SolicitarRecuperacaoRequest` dos imports de `src/lib/api/services.ts` (já não era usado após a remoção do `emailService`).

O serviço em uso no frontend continua sendo `emailAuthService` (`src/lib/api/services/email.service.ts`), que já implementa o fluxo por link (opção B, Parte 4).

---

## O que foi atualizado e onde

**3 arquivos alterados.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/api/services.ts` | Linhas 670-689 (removidas) | Removido objeto `emailService` inteiro (dead code). |
| `src/lib/api/services.ts` | Linha 42 | Removido `SolicitarRecuperacaoRequest` dos imports de `@/types/api` (não usado). |
| `src/lib/api/index.ts` | Linha 11 | Removido `emailService` da exportação. |
| `.env.example` | Todo o arquivo | Removidas variáveis legadas: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `ADMINS_NOTIFICACAO_ACADEMIA`, `NEXT_PUBLIC_APP_URL`. Mantidas apenas `ENV`, `NODE_ENV`, `NEXT_PUBLIC_API_URL`, `API_URL`, `NEXT_PUBLIC_LOGIN_TOKEN_COOKIE_EXPIRATION_HOURS`. |

---

## Validação realizada

**Ambiente:** Node.js 20, Next.js 14 (projeto `SpuriPainel`).

**Baseline (main sem a mudança):**
```bash
npx tsc --noEmit
npx eslint .
```
→ `tsc`: **erros pré-existentes** no `.next/types/validator.ts` (módulos `.js` não encontrados — artefacto de build anterior, não código fonte).  
→ `eslint`: **10 problemas (2 erros, 8 warnings)** idênticos aos listados abaixo — todos em ficheiros **não tocados** por esta tarefa.

**Com a mudança (arquivos copiados por cima de um clone novo de main):**
```bash
rm -rf .next && npx tsc --noEmit
npx eslint .
```
- `npx tsc --noEmit` → **exit code 0** (sem erros de tipo no código fonte).
- `npx eslint .` → **mesmos 10 problemas (2 erros, 8 warnings)** do baseline, nenhum novo.

**Problemas antigos (baseline, não desta tarefa):**
| Arquivo | Linha | Regra | Descrição |
| --- | --- | --- | --- |
| `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` | 29 | `react-hooks/set-state-in-effect` | `setState` síncrono dentro de `useEffect`. |
| `src/components/calendar/Calendar.tsx` | 102 | `react-hooks/purity` | `Date.now()` chamado durante render. |
| `src/app/(painel)/estudantes/cadastrar/SelecaoContextoMassa.tsx` | 80, 115 | `react-hooks/exhaustive-deps` | `eslint-disable` não usado. |
| `src/components/paineis/CategoriasServicoPainel.tsx` | 33 | `react-hooks/exhaustive-deps` | Dependência `recarregar` faltando. |
| `src/components/paineis/MinhasInscricoesServicoExtraPainel.tsx` | 3:769 | `react-hooks/exhaustive-deps` | Dependência `carregar` faltando. |
| `src/components/paineis/ServicosExtrasPainel.tsx` | 75 | `react-hooks/exhaustive-deps` | Dependência `recarregar` faltando. |
| `src/components/paineis/ServicosExtrasSolicitacoesPainel.tsx` | 13:507 | `react-hooks/exhaustive-deps` | Dependência `carregar` faltando. |
| `src/layout/AppSidebar.tsx` | 160, 162 | `react-hooks/exhaustive-deps` | `eslint-disable` não usado + dependência `closeMobileSidebar` faltando. |

---

## Falha antiga que não é desta tarefa

Os 2 erros e 8 warnings do ESLint acima já existiam no baseline e não foram introduzidos nem corrigidos por esta tarefa. `tsc` passa sem erros após limpar `.next/`.

---

## Como aplicar

1. **Confirme que a base não mudou:**
   ```bash
   git diff --stat 7410248 HEAD -- \
     src/lib/api/services.ts \
     src/lib/api/index.ts \
     .env.example
   ```
   Vazio = pode substituir.

2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.

3. **Verifique:**
   ```bash
   rm -rf .next
   npx tsc --noEmit
   npx eslint .
   ```
   - `tsc` deve sair com código 0.
   - `eslst` deve mostrar exatamente os 10 problemas listados acima e nenhum novo.

4. **Marque como feito** (secção abaixo).

---

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

- `tsc` → sem erros (exit code 0).
- `eslint` → exatamente os 10 problemas antigos listados acima, zero novos.
- `package.json`, `package-lock.json`, `yarn.lock` intactos.

---

## Fora de escopo

- **Backend:** já feito na Tarefa 123 do `rastreio-backend` (eliminação de `smtp_mailer.go`, `email_service.go` limpo, rotas `gerar-token/*` removidas, `brevo_mailer.go` sem fallback `EMAIL_USER`, `SendAdminWelcomeEmail` via Brevo).
- **Frontend `emailAuthService`:** já implementa o fluxo por link (opção B, Parte 4) em `src/lib/api/services/email.service.ts` — não mexido.
- **Limpeza do histórico git das senhas padrão (Parte 5 / SEC-05):** tarefa separada.
- **Eliminação dos rate limiters desativados (Parte 7 / SEC-02, D1):** backend já feito; frontend não tinha código correspondente.
- **Correção dos erros ESLint pré-existentes:** tarefas separadas.

---

## Resultado

Removido do frontend todo o código morto relacionado a EmailJS/SMTP e às rotas `gerar-token/*` eliminadas no backend: objeto `emailService` (dead code), sua exportação, tipo `SolicitarRecuperacaoRequest` não usado, e 7 variáveis de ambiente legadas do `.env.example`. O frontend passa a depender exclusivamente de `emailAuthService` (fluxo por link via Brevo) e das variáveis `ENV`, `NEXT_PUBLIC_API_URL`, `API_URL`, `NEXT_PUBLIC_LOGIN_TOKEN_COOKIE_EXPIRATION_HOURS`. Validação `tsc` e `eslint` passam sem problemas novos.

---

## Checklist

- [x] Base conferida (`git diff --stat 7410248 HEAD -- ...` vazio)
- [x] Pasta copiada (3 arquivos alterados)
- [x] `npx tsc --noEmit` sem erros (exit code 0)
- [x] `npx eslint .` sem problemas novos (mesmos 10 do baseline)
- [x] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [x] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`
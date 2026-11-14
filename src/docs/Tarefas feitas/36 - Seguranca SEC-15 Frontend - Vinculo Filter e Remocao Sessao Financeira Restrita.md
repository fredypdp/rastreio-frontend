# Tarefa 36 — Segurança SEC-15 Frontend: Filtro de Vínculo e Remoção de Sessão Financeira Restrita (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `4431e1e`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** depende da Tarefa 125 do `rastreio-backend` já em produção; sem ela, os campos `tipo_acesso`, `vinculo` e `periodos_vinculo` não virão na resposta da API e o filtro de vínculo não terá efeito no backend.

---

## Contexto

Esta tarefa implementa as partes frontend pendentes do documento de segurança e migração Brevo (SEC-01 a SEC-15):

- **SEC-15 (Parte 6.5.1/6.5.2/6.5.3)**: isolamento académico via projeção de vínculos — filtro `vinculo` ('atual' | 'anterior' | 'todos') na listagem de estudantes, perfil reduzido (`tipo_acesso: "anterior"`) com períodos de vínculo em vez de dados académicos atuais, e desabilitação de ações de credenciais/Zona de Perigo para estudantes inativos ou com vínculo anterior.
- **SEC-12 (eliminação)**: remoção completa do código de sessão de acesso restrito a finanças (`AcessoRestritoFinanceiro`) que ainda existia no frontend (token `acesso_restrito_financeiro`, redirecionamentos para `/pagamentos`, guards de rota, avisos na UI).

O backend já estava completo (Tarefas 123, 124, 125 do `rastreio-backend`).

---

## O que foi atualizado e onde

**14 arquivos alterados + 0 novos.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/lib/api/services.ts` | `consultasService.listarEstudantes` (linha ~580) | Adicionado parâmetro `vinculo?: 'atual' \| 'anterior' \| 'todos'` e incluído no query string |
| `src/types/api.ts` | `EstudanteDetalhado` (linha ~2101) | Adicionados `tipo_acesso?`, `vinculo?` e `periodos_vinculo?` (novo tipo `PeriodoVinculoDTO`) |
| `src/components/estudantes/estudantesEscalaShared.tsx` | `FiltrosState`, `FILTROS_INICIAIS`, `aplicarFiltros` (linhas ~45, ~65, ~180) | Adicionado campo `vinculo` ao estado de filtros, valor inicial `''`, e filtro client-side por `estudante.vinculo` |
| `src/app/(painel)/estudantes/PageContent.tsx` | `parametrosConsultaEstudantes`, `TelaDetalhesEstudante` (linhas ~280, ~640) | Incluído `vinculo` nos parâmetros de consulta; no detalhe: mostra banner de perfil reduzido, exibe `periodos_vinculo` em vez de dados académicos atuais, desabilita ações de credenciais e esconde Zona de Perigo quando `tipo_acesso === 'anterior'` ou status inativo |
| `src/lib/api/client.ts` | `DecodedTokenClaims`, `tokenStorage` (linhas ~15, ~45) | Removido `acesso_restrito_financeiro` das claims e `isRestrictedFinance()` do storage |
| `src/components/auth/LoginForm.tsx` | `concluirLogin` (linha ~52) | Removido redirecionamento condicional para `/pagamentos` baseado em `isRestrictedFinance`; removido import de `setCookieHours` |
| `src/hooks/useRoutePermission.ts` | `useRoutePermission` (linha ~23) | Hardcoded `false` para parâmetro `isRestrictedFinance` em `checkRoutePermission` |
| `src/lib/route-guards.ts` | `checkRoutePermission` (linha ~368) | Comentado bloco de redirecionamento SEC-12 (mantida assinatura para compatibilidade) |
| `src/components/guards/RouteGuard.tsx` | `RouteGuard` (linha ~44) | Hardcoded `false` para `isRestrictedFinance` |
| `src/layout/AppSidebar.tsx` | `filteredNavItems` (linhas ~14, ~229) | Removido import de `tokenStorage` e bloco `if (tokenStorage.isRestrictedFinance())` que forçava só `/pagamentos` |
| `src/app/(painel)/layout.tsx` | `PainelLayout` (linha ~10) | Removido import de `tokenStorage` e verificação `tokenStorage.isRestrictedFinance()` no effect de carregamento de perfil |
| `src/components/paineis/EstudantePagamentosPainel.tsx` | `EstudantePagamentosPainel` (linhas ~3, ~196, ~285, ~479, ~547) | Removidos import e uso de `tokenStorage.isRestrictedFinance()`, variável `restricted`, alerta de "Acesso financeiro restrito", e bloco condicional no histórico |
| `src/app/(full-width-pages)/trocar-senha/page.tsx` | `TrocarSenhaPage` (linhas ~50, ~78) | Removidos redirecionamentos condicionais para `/pagamentos` baseados em `isRestrictedFinance`; agora sempre redireciona para `/painel` |
| `src/lib/api/services.ts` | `perfilService.meuPerfil` (linha ~720) | Removido campo `acesso_restrito_financeiro` do tipo de retorno implícito (já não vem mais do backend) |

---

## Validação realizada

**Baseline (`main` @ `4431e1e`):**
- `npx tsc --noEmit`: 0 erros
- `npx eslint .`: 8 problemas pré-existentes (4 erros em `verificar-email/[token]/page.tsx`, `Calendar.tsx`; 4 warnings de `exhaustive-deps` em vários painéis) — todos não relacionados a esta tarefa

**Com a mudança (arquivos copiados por cima):**
- `npx tsc --noEmit`: 0 erros (limpo)
- `npx eslint .`: exatamente os mesmos 8 problemas pré-existentes, zero novos
- `next build`: falha apenas por `fonts.googleapis.com` (TLS/certificados no ambiente de validação), não por erro de código

---

## Como aplicar

1. **Confirme que a base não mudou:** `git diff --stat 4431e1e HEAD -- <arquivos listados acima>`. Vazio = pode substituir.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
3. **Verifique** (ver seção Verificação).
4. **Marque como feito** (ver checklist).

---

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Espera-se: `tsc` sem erros; `eslint` com exatamente os 8 problemas antigos já listados e nenhum novo. `package.json`, `package-lock.json` e `yarn.lock` intactos.

---

## Fora de escopo

- Backend: já completo nas Tarefas 123, 124, 125 do `rastreio-backend` (todas as 15 SEC implementadas).
- Sincronização da `Documentação da API.md` do frontend com backend v2.10.0 (endereçado em tarefa separada).
- Testes visuais em navegador (não foi possível rodar `next dev` no ambiente de validação).

---

## Marcar como feito

- [x] **Estado:** feito, `(feito)` no título
- [x] Secção **Resultado** adicionada
- [x] Documento movido para `src/docs/Tarefas feitas/`

---

## Resultado

Implementado end-to-end o filtro de vínculo (SEC-15) no frontend: parâmetro na API → query string → estado de filtro compartilhado → filtro client-side na listagem → tratamento no detalhe (banner, períodos de vínculo, ações desabilitadas). Removido completamente o código de sessão financeira restrita (SEC-12) de 8 arquivos: token storage, login, route guards, sidebar, layout do painel, painel de pagamentos do estudante, página de troca de senha. Validação `tsc` e `eslint` limpa (zero regressões).
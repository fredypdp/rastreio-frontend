# Tarefa 25 — Página de Configurações de Faltas `/faltas/configuracoes`

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `ba333e2`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/` do pacote, com os mesmos caminhos do repositório
**Ordem de deploy:** depende da **Tarefa 117 do `rastreio-backend`** em produção (rotas `GET`/`PUT /academia/faltas/configuracao`). Sem ela a página abre, mas dá erro ao carregar e ao guardar (404).

---

## Contexto

A academia passa a configurar duas coisas independentes (backend, Tarefa 117):

1. **Limite de faltas por período** (opcional): quantas faltas um estudante pode ter numa matéria, em cada período.
2. **Reprovação por faltas** (liga/desliga; só com limite definido): se o estudante ultrapassar o limite numa matéria e período, a avaliação final automática lê como **0** a **nota do professor** (ensino escolar) ou o **exame final** (ensino superior).

Onde fica: página **`/faltas/configuracoes`**, aberta **apenas** pelo botão **"Configurações"** em `/faltas`. **Não** entra na barra lateral.

## O que foi atualizado e onde

**4 arquivos alterados + 3 novos.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/app/(painel)/faltas/configuracoes/page.tsx` (**novo**) | — | Rota Next com `metadata.title = "Configurações de Faltas"` |
| `src/app/(painel)/faltas/configuracoes/PageContent.tsx` (**novo**) | — | `PageBreadcrumb` "Configurações de Faltas"; só academia (os outros veem `UnauthorizedAccess`); botão "Voltar para faltas" |
| `src/components/faltas/ConfiguracaoFaltas.tsx` (**novo**) | componente (linha 15) | O formulário (descrito abaixo) |
| `src/components/faltas/FaltasAcademia.tsx` | link para `/faltas/configuracoes` (linha 1147), ao lado de "Lançar Faltas" | Botão **"Configurações"** (ícone `mdi:cog-outline`, estilo secundário). O resto do cabeçalho é da Tarefa 24 |
| `src/lib/route-guards.ts` | regra `/faltas/configuracoes` (linha 303) | `allowedTypes: ['academia']`, `redirectIfUnauthorized: '/faltas'` |
| `src/lib/api/services.ts` | `academiaService.obterConfiguracaoFaltas` (linha 1381) e `definirConfiguracaoFaltas` (1385) | GET e PUT em `/academia/faltas/configuracao` |
| `src/types/api.ts` | `ConfiguracaoFaltas` (linha 469), `DefinirConfiguracaoFaltasRequest` (478) e as duas respostas | Tipos da configuração. As demais mudanças deste arquivo são da Tarefa 23 |

**`AppSidebar.tsx` não é alterado** (requisito: acesso só pelo botão).

**Formulário (`ConfiguracaoFaltas.tsx`):**

- **"Limite de faltas por período":** checkbox "Definir limite de faltas"; ao marcar, aparece o campo "Máximo de faltas por matéria e período *" (inteiro **1 a 500**, com erro inline se inválido).
- **"Reprovação por faltas":** explica que, ao ultrapassar o limite, a avaliação final automática lê 0 na nota do professor (escolar) ou no exame final (superior, categoria com o código `exame_final`), que as outras notas não são afetadas e que avaliações já calculadas não mudam. Checkbox "Aplicar reprovação por faltas", **desativado enquanto não houver limite**. Desmarcar o limite desmarca a reprovação.
- **"Guardar configuração":** só ativo com alteração válida; envia `{ limite_faltas_por_periodo: número | null, reprovacao_por_faltas: boolean }`; mostra alerta de sucesso/erro e passa a refletir os valores devolvidos pelo backend.

## Validação realizada

Guarda de rota: `checkRoutePermission` de `route-guards.ts` compilado e executado.

| Quem | `/faltas/configuracoes` |
| --- | --- |
| academia (autenticada) | `{ allowed: true }` |
| estudante | `{ allowed: false, redirectTo: "/faltas" }` |
| admin | `{ allowed: false, redirectTo: "/faltas" }` |
| anónimo | `{ allowed: false, redirectTo: "/faltas" }` |

`/faltas` continua permitida para estudante (sem regressão).

**Baseline (`main` @ `ba333e2`, antes das mudanças):** `npx tsc --noEmit` sem erros; `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos antigos e em arquivos que as Tarefas 23/24/25 não tocam: `verificar-email/[token]/page.tsx` (erro 29:7), `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx` (erro 102:13), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `layout/AppSidebar.tsx`.

**Depois (clone novo de `main` @ `9b8a02f`, arquivos da pasta `rastreio-frontend/` copiados por cima — 8 alterados + 4 novos, 0 apagados):** `npx tsc --noEmit` sem nenhum erro; `npx eslint .` com saída **idêntica** à do baseline (mesmos 10 problemas, mesmos arquivos, nenhum novo).

**`next build`:** no ambiente de validação falha **só** por `Failed to fetch 'Outfit' from Google Fonts` (`fonts.googleapis.com` sem acesso) — limitação de rede, **não** erro de código. **Não foi possível abrir as páginas num navegador**; a parte visual foi validada por leitura do JSX final e por `tsc`/`eslint`.

## Como aplicar

As Tarefas 23, 24 e 25 são entregues **no mesmo pacote** (`types/api.ts` e `FaltasAcademia.tsx` contêm mudanças de mais de uma tarefa). Copie a pasta inteira de uma vez.

1. **Confirme que a base não mudou.** Os arquivos foram gerados sobre o código de `main` @ `ba333e2` (o `main` atual, `9b8a02f`, só acrescentou documentos de tarefa). Na raiz do repositório:
   ```bash
   git diff --stat ba333e2 HEAD -- src/app/\(painel\)/faltas/PageContent.tsx src/app/\(painel\)/notas/PageContent.tsx src/components/faltas/FaltasAcademia.tsx src/components/notas/NotasAcademia.tsx src/components/paineis/TurmasPainel.tsx src/lib/api/services.ts src/lib/route-guards.ts src/types/api.ts
   ```
   Saída **vazia** = pode substituir. Se aparecer algum arquivo, ele mudou depois da base: **não substitua** — avise para eu reconciliar.
2. **Copie** os arquivos da pasta `rastreio-frontend/` do pacote para a raiz do repositório, **mantendo os caminhos**. Os arquivos são **completos**: substituem os existentes por inteiro (não é para mesclar).
3. **Verifique** (secção abaixo).
4. **Marque como feito** (secção "Marcar como feito").

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)** — exatamente os antigos listados acima, em arquivos não relacionados a estas tarefas; **nenhum novo**. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração (`git checkout -- yarn.lock package-lock.json`).

## Fora de escopo

- **Não** adicionar a página à barra lateral (`AppSidebar.tsx`).
- **Não** acrescentar indicadores de "limite de faltas excedido" em `/faltas` nem por estudante — a funcionalidade é só a configuração.
- **Não** permitir configuração por matéria, curso ou tipo de ensino: é **um único limite por academia**.
- **Não** decidir no frontend qual nota é zerada: quem decide é o backend (Tarefa 117).
- **Não** mexer nos cabeçalhos de `/faltas` e `/notas` (Tarefa 24) nem em grupos (Tarefa 23).

## Marcar como feito

1. Troque `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título.
2. Acrescente no fim uma secção **Resultado** com um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mova este documento de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, com o mesmo nome (a numeração 25 não muda).

## Checklist

- [ ] Tarefa 117 do `rastreio-backend` identificada como pré-requisito de deploy
- [ ] Base conferida (`git diff --stat ba333e2 HEAD -- …` vazio)
- [ ] Pasta `rastreio-frontend/` copiada por inteiro (8 alterados, 4 novos)
- [ ] `AppSidebar.tsx` **não** foi alterado
- [ ] `/faltas/configuracoes` só abre para academia; os outros voltam para `/faltas`
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos antigos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

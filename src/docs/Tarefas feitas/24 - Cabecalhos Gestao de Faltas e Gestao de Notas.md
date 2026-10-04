# Tarefa 24 — Cabeçalhos "Gestão de Faltas" e "Gestão de Notas"

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `ba333e2`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/` do pacote, com os mesmos caminhos do repositório
**Ordem de deploy:** nenhuma dependência do `rastreio-backend` — pode ir para produção antes, depois ou junto.

---

## Contexto

Nas páginas `/faltas` e `/notas`, a **academia** via dois textos empilhados: o título do `PageBreadcrumb` ("Faltas"/"Notas") e, logo abaixo, um segundo título "Gestão de Faltas"/"Gestão de Notas" com o botão de lançar ao lado.

Pedido: **manter o breadcrumb**, mas com o texto **"Gestão de Faltas"** / **"Gestão de Notas"**, e deixar **só esse texto**; o botão de lançar fica **logo abaixo** dele.

O `PageBreadcrumb` mostra o `pageTitle` em dois sítios (o `<h2>` e o último item do trilho "Home / …"); trocar o `pageTitle` altera os dois — é o comportamento desejado.

## O que foi atualizado e onde

**4 arquivos alterados.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/app/(painel)/faltas/PageContent.tsx` | `<PageBreadcrumb …>` (linha 25) | `pageTitle` passa a `isAcademia ? "Gestão de Faltas" : "Faltas"` |
| `src/app/(painel)/notas/PageContent.tsx` | `<PageBreadcrumb …>` (linha 25) | `pageTitle` passa a `isAcademia ? "Gestão de Notas" : "Notas"` |
| `src/components/faltas/FaltasAcademia.tsx` | cabeçalho, botão "Lançar Faltas" (linha 1145) | Removido o `<h2>` duplicado "Gestão de Faltas"; o botão é o primeiro elemento do bloco, abaixo do breadcrumb. O botão "Configurações" ao lado dele é da Tarefa 25 |
| `src/components/notas/NotasAcademia.tsx` | cabeçalho, botão "Lançar Notas" (linha 1422) | Removido o `<h2>` duplicado "Gestão de Notas"; o botão idem. O botão "Categoria" (só ensino superior), à direita, **não muda** |

`isAcademia` já existia nos dois `PageContent.tsx` (vem de `useUserType()`): não há imports nem estado novos.

**Resultado:** a academia vê `Gestão de Faltas` (breadcrumb) → botão `Lançar Faltas` → linha de contagens. **Estudante e admin continuam a ver "Faltas"/"Notas"**, porque o "Gestão de…" só existia na vista da academia.

## Validação realizada

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

- **Não** remover o `PageBreadcrumb` — só o texto dele muda.
- **Não** mudar o texto para estudante/admin.
- **Não** tocar em `/faltas/lancar` e `/notas/lancar` (têm cabeçalho próprio).
- **Não** mexer nas linhas de contagem ("N turma(s) ativa(s)…") nem em `PageBreadCrumb.tsx`.
- O botão "Configurações" e a página `/faltas/configuracoes` são a Tarefa 25.

## Marcar como feito

1. Troque `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título.
2. Acrescente no fim uma secção **Resultado** com um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mova este documento de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, com o mesmo nome (a numeração 24 não muda).

## Checklist

- [ ] Base conferida (`git diff --stat ba333e2 HEAD -- …` vazio)
- [ ] Pasta `rastreio-frontend/` copiada por inteiro (8 alterados, 4 novos)
- [ ] Academia vê `Gestão de Faltas`/`Gestão de Notas` no breadcrumb, sem título duplicado; estudante/admin continuam com `Faltas`/`Notas`
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos antigos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

# Tarefa — Mover configuração de documentos extra para /configuracoes/matricula

**Repositório:** `rastreio-frontend`
**Depende de:** nada. Independente de todas as outras tarefas desta leva.
**Execução:** Codex só executa — a movimentação e as 3 alterações abaixo já foram feitas e validadas (`tsc --noEmit`, `eslint`) pelo orquestrador. Não há nada para planejar.

## Contexto

A configuração dos documentos extra da matrícula vivia em `/configuracoes/documentos-extra`. Esta tarefa só move essa página para `/configuracoes/matricula` — o **conteúdo da página não muda em nada** (mesmo formulário, mesma lógica, mesmo texto "Documentos extra" no menu e no título da página). Só a rota muda.

**Suposição registada:** o pedido original dizia `/configuracoes/matrcula` (sem o "í") — interpretei como um typo de "matrícula", e usei `/configuracoes/matricula` (sem acento, seguindo a convenção de URLs já usada no resto do projeto — nenhuma rota existente tem acento). Se a intenção era realmente o texto literal sem o "í", avise antes de aplicar.

⚠️ **Não confundir com a rota de API do backend** `/academia/documentos-extra` (usada em `src/lib/api/services.ts`) — essa é a rota do **backend** e não muda nesta tarefa, só a **página do frontend**.

---

## 1. Mover a pasta da página

```bash
git mv "src/app/(painel)/configuracoes/documentos-extra" "src/app/(painel)/configuracoes/matricula"
```

Isto move os dois arquivos (`page.tsx` e `PageContent.tsx`) sem alterar o conteúdo deles.

## 2. `src/layout/AppSidebar.tsx` — atualizar os 2 links da rota antiga

**Localizar** (linha do item de menu):
```tsx
      { name: "Documentos extra", path: "/configuracoes/documentos-extra" },
```

**Substituir por:**
```tsx
      { name: "Documentos extra", path: "/configuracoes/matricula" },
```

**Localizar** (linha na lista de rotas usada para outra verificação, mais abaixo no mesmo arquivo):
```tsx
            "/configuracoes/documentos-extra",
```

**Substituir por:**
```tsx
            "/configuracoes/matricula",
```

## 3. `src/lib/route-guards.ts` — atualizar a rota protegida

**Localizar:**
```ts
  {
    path: '/configuracoes/documentos-extra',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
```

**Substituir por:**
```ts
  {
    path: '/configuracoes/matricula',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
```

Nada mais muda — nem nestes 2 arquivos, nem no conteúdo de `page.tsx`/`PageContent.tsx` movidos.

## Arquivos a remover

Nenhum arquivo a mais além do já resolvido pelo `git mv` (que remove o caminho antigo e cria o novo).

## Validação (já executada pelo orquestrador — Codex só precisa confirmar)

```bash
npx tsc --noEmit
# esperado: nenhuma saída
# nota: se aparecer um erro mencionando ".next/types/validator.ts" e o
# caminho antigo "configuracoes/documentos-extra", é cache obsoleto do
# Next.js de um build anterior à movimentação — rode `rm -rf .next` e
# repita o tsc.

npx eslint "src/app/(painel)/configuracoes/matricula/page.tsx" "src/app/(painel)/configuracoes/matricula/PageContent.tsx" src/layout/AppSidebar.tsx src/lib/route-guards.ts
# esperado: nenhum erro (podem aparecer 2 warnings pré-existentes em
# AppSidebar.tsx sobre react-hooks/exhaustive-deps — não são desta tarefa)
```

## Conclusão

Depois de mover a pasta, aplicar as 3 substituições, e confirmar `tsc`/`eslint` limpos (lembrando de `rm -rf .next` se necessário), marcar esta tarefa como concluída.

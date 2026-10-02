# Tarefa 21 — Sincronizar `package-lock.json` com `package.json` (corrigir `npm ci`)

**Estado:** pendente

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (validado contra o commit `214aeeb`, já com a Tarefa 20 integrada)
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `21 - Sincronizar package-lock com package.json.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover os arquivos conforme o Passo 3.

**Ordem de deploy:** independente do backend (nenhuma rota, tipo ou tela muda). A tarefa altera **somente** o `package-lock.json`.

---

## 0. Prompt recomendado para executar

> Aplique o patch `21 - Sincronizar package-lock com package.json.patch` com `git apply`, rode `npm ci`, **descarte a alteração que o npm faz no `yarn.lock`** (`git checkout -- yarn.lock`), rode `npx tsc --noEmit` e `npx eslint .`, confirme o resultado esperado descrito no Passo 2, e depois execute o Passo 3 (marcar a tarefa como feita e movê-la para `src/docs/Tarefas feitas/`). Não replaneje, não altere o código do patch, não abra PR.

## Contexto do problema

`npm ci` **falha** em `main` com `EUSAGE … package.json and package-lock.json are not in sync` (`Missing: @emotion/react@11.14.0 from lock file`, `@mui/material`, etc.). O orquestrador mediu a defasagem real:

- O `package-lock.json` (lockfileVersion 3) **não tem 12 dependências** declaradas no `package.json`: `framer-motion`, `primereact`, `xlsx`, `@emotion/react`, `@emotion/styled`, `@mui/material`, `@mui/x-date-pickers`, `dayjs`, `react-select`, `@iconify/react`, `@types/xlsx` e `cross-env`; e **lista 1 que já não existe** no `package.json` (`@heroui/dropdown`).
- A última vez que o lock foi alterado foi em dezembro de 2025; o `package.json` continuou a receber dependências depois disso (MUI, framer-motion, etc.) sem o lock acompanhar.
- Na prática, `npm install` (que tolera a defasagem) é o que vinha sendo usado; `npm ci` — o comando correto para CI e instalações reproduzíveis — nunca funcionava.

## Decisões de design já tomadas (não reavalie)

- **Corrigir só o `package-lock.json`**, gerado com `npm install --package-lock-only` (que **preserva as versões já travadas** e apenas acrescenta/ajusta o que falta). O `package.json` **não muda**.
- **O `yarn.lock` fica fora do patch e não deve ser alterado.** O projeto tem os dois lockfiles; o fluxo usado é npm (a Tarefa 20 já usava `npm install`), então o alvo é o `package-lock.json`. Decidir se o `yarn.lock` deve ser removido ou atualizado é do dono do projeto — fora de escopo.
- **Nenhuma versão de dependência direta é alterada.** Os intervalos do `package.json` são os mesmos; o lock só passa a registrar o que faltava.

## O que o patch faz

**1 arquivo alterado, 0 novos:** `package-lock.json` (905 linhas adicionadas, 48 removidas).

Comparando o lock antigo com o novo, pacote a pacote (script do orquestrador):

| Medida | Resultado |
|---|---|
| Pacotes no lock | 805 → 869 (**64 adicionados, 0 removidos**) |
| Versões alteradas | **1**: `@babel/runtime` 7.28.4 → 7.29.7 (exigida pelas dependências novas do MUI) |
| Dependências do `package.json` ausentes no lock | 12 → **0** |
| Entrada `@heroui/dropdown` no campo raiz do lock | removida (não está no `package.json`) |
| Hosts em `resolved` | somente `registry.npmjs.org` |
| Entradas sem `integrity` | 0 |

## O que já foi validado pelo orquestrador

Ambiente: Node 22.22, npm 10.9, clone **novo e limpo** de `main` (commit `214aeeb`) com o patch aplicado exatamente como você vai aplicar.

- **Antes do patch:** `npm ci` falha (`EUSAGE`, `Missing: … from lock file`), como descrito acima.
- **Depois do patch:** `npm ci` termina com sucesso (**797 pacotes instalados**, 27 s) e uma segunda execução também (23 s). O `package-lock.json` **não é modificado** pelo `npm ci` (idêntico ao patch).
- **`npx tsc --noEmit`:** sem erros (saída vazia) com as versões instaladas pelo lock.
- **`npx eslint .`** (o script `lint` do projeto): **10 problemas (2 erros, 8 avisos)**, todos pré-existentes em código que esta tarefa não toca:
  - erros: `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` (`react-hooks/set-state-in-effect`) e `src/components/calendar/Calendar.tsx` (`react-hooks/purity`);
  - avisos: `SelecaoContextoMassa.tsx` (2), `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx` e `AppSidebar.tsx` (2).
  - Os 5 arquivos da Tarefa 20 estão limpos.
- **`next build`:** o build padrão falha em sandbox só por `fonts.googleapis.com` bloqueado (limitação de rede do sandbox, não erro de código). Com a fonte do Google desligada **temporariamente** em `src/app/layout.tsx` (revertido, **não** faz parte do patch): `✓ Compiled successfully in 31.0s` e `✓ Generating static pages (66/66)`.
- **Não validado:** execução da interface num navegador. Esta tarefa não muda nenhum código da aplicação.

### Correção de um número da Tarefa 20

O documento da Tarefa 20 citou "170 problemas de ESLint" como baseline. Aquele número foi medido com `npm install --no-package-lock`, que **ignora o lock e resolve versões mais novas dos plugins** (inclusive regras novas de `react-hooks`). Com as versões travadas pelo lock (o cenário real de `npm ci`), o total é **10**. O patch da Tarefa 20 não era afetado (nos dois cenários o ESLint ficou idêntico antes/depois dela), mas o baseline correto passa a ser **10**.

### ⚠️ Atenção: o npm reescreve o `yarn.lock`

Como o repositório tem `yarn.lock`, o npm 10 **o altera sozinho** durante `npm ci`/`npm install` (troca hosts `registry.yarnpkg.com` → `registry.npmjs.org` e reformata ~600 linhas). Isso **não deve ir no commit**. Por isso o Passo 2 manda descartar essa mudança (`git checkout -- yarn.lock`) e conferir que só `package-lock.json` aparece como modificado.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/21 - Sincronizar package-lock com package.json.patch"
```

Deve **alterar 1 arquivo** (`package-lock.json`). Se `git apply` falhar, PARE — não regenere o lock manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm ci
git checkout -- yarn.lock
git status --short
npx tsc --noEmit
npx eslint .
```

- `npm ci`: termina **sem erro** e instala os pacotes (cerca de 797).
- `git checkout -- yarn.lock`: descarta a reescrita do `yarn.lock` feita pelo npm.
- `git status --short`: deve mostrar **apenas** ` M package-lock.json` (mais os `.md`/`.patch` desta tarefa, se já tiverem sido movidos). Se aparecer qualquer outro arquivo (`package.json`, `yarn.lock`, `src/...`), descarte-o — não deve fazer parte do commit.
- `npx tsc --noEmit`: **nenhuma saída** (sem erros).
- `npx eslint .`: sem nenhum problema **novo**. Total esperado: **10 problemas (2 erros, 8 avisos)**, nos arquivos listados acima. Se o total for diferente, confira se os arquivos reportados estão na lista; reporte a diferença sem tentar corrigir lint.
- Se o `npm ci` falhar por **rede** (registro bloqueado no seu ambiente), PARE nesse ponto e reporte o erro exato: o patch já foi validado pelo orquestrador. **Não** edite o lockfile para contornar.
- **Não** rode `next build` como critério de aceite (pode falhar por rede/Google Fonts no seu ambiente; não indica problema no patch).

## O que NÃO fazer (fora de escopo)

- **Não** alterar `package.json` (nenhuma dependência é adicionada, removida ou atualizada).
- **Não** alterar, regenerar nem apagar o `yarn.lock`. Ele está defasado também (o orquestrador, com um script simples, encontrou 9 dependências do `package.json` sem entrada correspondente), mas decidir entre manter, atualizar ou remover o `yarn.lock` é do dono do projeto.
- **Não** criar `pnpm-lock.yaml` nem trocar de gerenciador de pacotes.
- **Não** atualizar versões (`npm update`, `npm audit fix`, `npm install <pacote>`): só o lock sincronizado do patch.
- **Não** corrigir os 10 problemas de lint pré-existentes.
- **Não** mexer em `src/app/layout.tsx` nem no carregamento da fonte Google.
- **Não** abrir PR nem fazer merge — deixar o commit pronto para revisão.

## Limitações conhecidas (documentadas, não são bugs do patch)

1. **O `yarn.lock` continua defasado.** Se algum ambiente de build instalar dependências com Yarn, esta tarefa não o afeta (e ele já estava fora de sincronia antes).
2. Quem instala com `npm install` (não `npm ci`) passa a respeitar o lock sincronizado; as versões travadas dos pacotes que já existiam no lock não mudaram, exceto `@babel/runtime` (ver tabela).
3. O `npm` modifica o `yarn.lock` toda vez que roda `install`/`ci` enquanto os dois lockfiles coexistirem — por isso o descarte manual no Passo 2.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema:

1. Neste documento, troque a linha `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título (`# (feito) Tarefa 21 — …`).
2. Acrescente, ao final, uma secção **Resultado** com um parágrafo curto descrevendo o que foi efetivamente feito e qualquer desvio pontual.
3. Mova este `.md` **e** o `.patch` de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome** (a numeração 21 não muda).
4. Não renumere nem altere nenhuma outra tarefa.

## Checklist de aceitação

- [ ] Patch aplicado (`git apply`) sem conflitos (1 arquivo alterado: `package-lock.json`)
- [ ] `npm ci` termina sem erro
- [ ] `yarn.lock` descartado (`git checkout -- yarn.lock`); `git status --short` mostra só `package-lock.json`
- [ ] `package.json` e `yarn.lock` **sem** alterações no commit
- [ ] `npx tsc --noEmit` limpo
- [ ] `npx eslint .` sem problemas novos (esperado: 10 = 2 erros + 8 avisos, todos pré-existentes)
- [ ] Estado trocado para **feito**, título com `(feito)`, secção **Resultado** adicionada
- [ ] `.md` e `.patch` movidos para `src/docs/Tarefas feitas/` com o mesmo nome

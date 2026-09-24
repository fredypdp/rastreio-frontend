# Modelo de Tarefa para o Codex — Frontend (`rastreio-frontend`)

> Este documento descreve a estrutura e as convenções que **todo** documento de tarefa para o Codex, neste repositório, deve seguir. Não é uma tarefa real — é o gabarito a copiar e preencher ao criar uma nova.

## Princípio central

- Quem escreve o documento de tarefa (o orquestrador) já **planeou, escreveu e validou** a solução antes de entregar — `npx tsc --noEmit` e `npx eslint` já correram de verdade contra o projeto real, não só em teoria.
- O Codex (quem executa) **nunca planeia nem repensa a abordagem** — só aplica exatamente o que o documento descreve, corre as verificações pedidas, e confirma o resultado.
- Toda mudança de frontend que depende de algo novo no backend (um campo, uma rota) diz isso explicitamente perto do topo, com o número + nome da tarefa irmã no `rastreio-backend` — para o Codex saber se pode aplicar isoladamente ou não.

## Onde guardar e como nomear

- Pendente: `src/docs/Lista de Tarefas/<número> - <Título da tarefa>.md` (e o `.patch` correspondente, se houver, no mesmo sítio).
- Concluída: mover para `src/docs/Tarefas feitas/`, mantendo o mesmo nome.
- **Atenção ao caminho**: neste repositório os documentos de tarefa ficam dentro de `src/docs/`, não em `docs/` na raiz (diferente do `rastreio-backend`) — confirme a estrutura real antes de escrever qualquer caminho no documento.
- A numeração é própria deste repositório, independente da numeração do `rastreio-backend`. Ao referenciar uma tarefa do outro repositório, citar sempre número + nome do repositório (ex.: "Tarefa 113 do `rastreio-backend`").

## Duas variantes — qual usar

| | Variante A — patch pronto | Variante B — arquivo completo / diffs no documento |
|---|---|---|
| Quando usar | Mudança pequena e isolada (1–3 arquivos) | Mudança grande, que toca muitos arquivos, ou onde as mudanças pedidas se entrelaçam bastante (mesmo estado lido/escrito em vários pontos do mesmo arquivo) |
| Onde está o código | Num ficheiro `.patch` ao lado do `.md` | Dentro do próprio `.md`, em blocos de código |
| O que o Codex faz | `git apply` do patch + verificação + mover ficheiros | Copiar cada bloco exatamente como descrito (substituição total do arquivo OU o par "Localizar → Substituir") + verificação + mover ficheiros |

As duas seguem o mesmo princípio: o Codex só executa. Ao decidir entre "arquivo completo" e "diff cirúrgico" dentro da Variante B, prefira o arquivo completo sempre que editar por partes arriscar deixar JSX mal fechado ou estado inconsistente — diffs pequenos e independentes usam "Localizar → Substituir".

---

## Variante A — patch pronto

```markdown
# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `<número> - <Título>.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover/renomear os arquivos conforme o Passo 3.

**Ordem de deploy:** [ex.: nenhuma dependência com a Tarefa N do `rastreio-backend` — pode ir para produção antes, depois ou junto / OU: depende da Tarefa N do `rastreio-backend` já estar em produção]

---

## Contexto do problema

[O que foi reportado (bug) ou pedido (feature). Se for bug: qual tela/componente, o que o usuário vê, e a causa raiz encontrada no código (arquivo + trecho) — comparando, quando possível, com um padrão já correto em outra tela irmã.]

## O que o patch faz

[Lista arquivo a arquivo do que muda e por quê. Separar claramente "N arquivo(s) alterado(s) + N arquivo(s) novo(s)".]

## O que já foi verificado noutras páginas (quando relevante)

[Se a correção segue um padrão que já existe em outra tela, diga qual e confirme que ela já está correta — serviu de referência, nada a mudar lá.]

## O que já foi validado pelo orquestrador

[`npx tsc --noEmit` e `npx eslint` (projeto inteiro) antes e depois da mudança — confirmando zero erros novos e os mesmos avisos pré-existentes de sempre, nos mesmos arquivos de sempre —, e idealmente uma validação final num clone novo e limpo de `main`, com `npm install` do zero, aplicando o `.patch` exatamente como o Codex vai aplicar.]

## Passo 1 — Aplicar o patch

Na raiz do repositório:

\`\`\`bash
git apply "src/docs/Lista de Tarefas/<número> - <Título>.patch"
\`\`\`

Deve alterar N arquivo(s) [e criar N novo(s)]. Se `git apply` falhar, PARE — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

\`\`\`bash
npm install
npx tsc --noEmit
npx eslint .
\`\`\`

`tsc` sem nenhum erro. `eslint` sem nenhum erro/warning novo — só os pré-existentes já documentados, em arquivos não relacionados a este patch.

## O que NÃO fazer (fora de escopo)

[Lista explícita de pontos próximos ao código tocado que NÃO devem ser alterados, e por quê — inclusive referências a tarefas irmãs (deste ou do outro repositório) que cobrem a parte que fica de fora daqui.]

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [ ] Patch aplicado (`git apply`) sem conflitos
- [ ] `npm install` sem erros
- [ ] `npx tsc --noEmit` limpo
- [ ] `npx eslint .` sem erros novos
- [ ] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`
```

---

## Variante B — arquivo completo / diffs "Localizar → Substituir"

```markdown
# [Título da tarefa]

## Antes de começar (leia isto primeiro)

Esta tarefa já foi **inteiramente planejada, implementada e validada** por quem escreveu este documento: `npx tsc --noEmit` limpo no projeto inteiro depois de todas as mudanças abaixo, e `npx eslint .` sem nenhum erro/warning novo introduzido por elas [liste os arquivos com warnings pré-existentes que não devem ser tocados]. Sua tarefa é só aplicar as mudanças abaixo exatamente como estão descritas. Onde o documento diz "substitua o arquivo inteiro por", é para substituir o arquivo inteiro. Onde diz "Localizar este bloco exato" / "aplique este diff", é uma mudança cirúrgica pequena — localize o trecho pelo contexto ao redor (linhas sem `+`/`-`) e aplique só o que muda.

## ⚠️ Dependência do backend (se houver)

Esta tarefa **depende** da tarefa "[nome]" (Tarefa N do `rastreio-backend`) já ter sido aplicada (ou estar sendo aplicada no mesmo PR/deploy). [Diga exatamente qual tipo/campo/rota só existe depois daquela tarefa, e o que acontece se este frontend for aplicado sem o backend — normalmente: compila e funciona visualmente, mas a chamada à API falha em runtime.]

## Contexto — o que está sendo resolvido e por quê

1. [Primeira tela/componente afetado, o que muda e por quê.]
2. [Segundo, se houver.]
3. [Escopo ampliado durante a investigação, se houver — outros arquivos com o mesmo problema encontrados fora do pedido original, incluídos por completude.]

## Decisões de design já tomadas (não precisa reavaliar)

- [Cada decisão de UI/estado já fechada, com o "porquê" e, quando útil, referência ao componente/tela já existente que está a ser replicado (mesmo padrão visual, mesmo padrão de `view: "lista" | "form"`, etc.).]

---

## Parte 1 — `<caminho/do/arquivo.ts>`

[Mudança pequena e independente — tipos, serviço de API, etc. Pode usar bloco de código completo ou diff, conforme o tamanho.]

## Parte 2 — Substituir `<caminho/do/Componente.tsx>`

Substitua o arquivo **inteiro** por este conteúdo:

\`\`\`tsx
[conteúdo completo do arquivo]
\`\`\`

## Parte 3 — Editar `<caminho/do/OutroComponente.tsx>`

Esta é uma mudança **cirúrgica**, não uma substituição de arquivo inteiro.

### Localizar este bloco exato

\`\`\`tsx
[bloco exatamente como está hoje no arquivo, com contexto suficiente ao redor para ser único]
\`\`\`

### Substituir por

\`\`\`tsx
[bloco novo]
\`\`\`

[Use "Parte N" (várias telas/arquivos, tarefa ampla) ou "Passo N" (sequência linear de edições) — o que descrever melhor a tarefa. Numere sempre na ordem de aplicação.]

---

## Arquivos a remover

[Liste, ou escreva "Nenhum".]

## Validação (rode nesta ordem)

\`\`\`bash
npm install
npx tsc --noEmit
npx eslint .
\`\`\`

[Diga exatamente o que esperar — "nenhuma saída" quando for o caso, ou, se for um arquivo específico, `npx eslint "caminho/do/arquivo.tsx"`. Liste os avisos pré-existentes conhecidos que não são regressão desta tarefa.]

## O que NÃO fazer

- [Lista explícita — inclusive "não toque em X, que já usa o padrão correto e serviu de referência".]

## Checklist de aceitação

- [ ] [Cada critério observável e verificável — evitar "funciona bem", preferir "o botão X só aparece quando Y".]
- [ ] `npx tsc --noEmit` limpo.
- [ ] `npx eslint .` sem erros/warnings novos.

## Conclusão

Depois de aplicar todas as partes acima e confirmar `tsc`/`eslint` limpos, mova este documento (e o `.patch`, se houver) de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, marcando esta tarefa como concluída.
```

---

## Convenções transversais (valem para as duas variantes)

- **Ordem fixa de validação**: `npm install` → `npx tsc --noEmit` → `npx eslint .` (ou `npx eslint "<arquivo>"` quando só um arquivo for relevante).
- **Baseline vs com a mudança**: quem escreve o documento roda `tsc`/`eslint` sem a mudança primeiro, anota os avisos pré-existentes (arquivo a arquivo), depois roda com a mudança e confirma zero erros/avisos novos.
- **Fora de escopo nunca fica implícito**: toda tarefa diz explicitamente o que fica de fora, principalmente quando há uma tarefa irmã no `rastreio-backend` cobrindo a parte de backend do mesmo problema.
- **Dependência de backend sempre em destaque**: quando existir, vem logo no topo do documento (secção própria com ⚠️), nunca só mencionada de passagem no meio do texto.

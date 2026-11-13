# Modelo de Tarefa — Frontend (`rastreio-frontend`)

> Estrutura e convenções que **todo** documento de tarefa deste repositório segue. Não é uma tarefa real — é o gabarito a copiar e preencher ao criar uma nova.

## Princípio central

- O documento de tarefa **explica o que foi atualizado e onde**. Ele **não carrega o código**: o código é entregue à parte, em **arquivos completos e atualizados**, numa pasta com a **mesma estrutura de caminhos do repositório** (`src/app/…`, `src/components/…`, `src/lib/…`, `src/types/…`, `src/docs/…`).
- Quem escreve o documento já **planeou, implementou e validou** tudo antes de entregar: `npx tsc --noEmit` e `npx eslint .` correm de verdade contra o projeto real e o documento traz o resultado.
- Cada mudança é localizada com precisão: **arquivo** (alterado ou novo) → **onde** (componente, função ou trecho, com o número da linha no arquivo entregue) → **o que mudou**.
- Quando a mudança depende de algo novo no backend (um campo, uma rota), isso aparece **logo no topo**, com o número + nome da tarefa irmã no `rastreio-backend`.

## Onde guardar e como nomear

- Pendente: `src/docs/Lista de Tarefas/<número> - <Título da tarefa>.md`.
- Concluída: mover para `src/docs/Tarefas feitas/`, **mantendo o mesmo nome**; dentro do arquivo, `**Estado:** feito`, `(feito)` no início do título e uma secção **Resultado** no fim.
- **Atenção ao caminho:** neste repositório os documentos de tarefa ficam dentro de `src/docs/`, não em `docs/` na raiz (diferente do `rastreio-backend`).
- A numeração é própria deste repositório, independente da do `rastreio-backend`. Ao referenciar uma tarefa do outro repositório, citar sempre número + nome do repositório (ex.: "Tarefa 117 do `rastreio-backend`").
- Os arquivos de código acompanham o documento numa pasta `rastreio-frontend/` que **espelha a raiz do repositório**; copiá-la por cima da raiz coloca cada arquivo no sítio certo. Os arquivos entregues são **completos** e substituem os existentes por inteiro (nunca é uma mesclagem parcial).
- Quando várias tarefas mexem no mesmo arquivo, elas são **entregues no mesmo pacote** e cada documento diz quais mudanças desse arquivo pertencem a outra tarefa.

## Estrutura do documento (copiar e preencher)

```markdown
# Tarefa <número> — <Título> (frontend)

**Estado:** pendente
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `<hash curto>`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** [nenhuma dependência do `rastreio-backend` — qualquer ordem / OU: depende da Tarefa N do `rastreio-backend` já em produção; sem ela, <o que acontece em runtime>]

---

## Contexto

[O que foi pedido (feature) ou reportado (bug): qual tela/componente, o que o utilizador vê e, se for bug, a causa raiz (arquivo + trecho) — comparando, quando possível, com uma tela irmã que já está correta.]

## O que foi atualizado e onde

**N arquivos alterados + N novos.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/caminho/do/Componente.tsx` | `NomeDoComponente` (linha N) | [descrição curta] |
| `src/lib/novo.ts` (**novo**) | — | [descrição curta] |

[Comportamento resultante em linguagem simples (o que cada perfil vê). Decisões de UI já fechadas, com referência ao componente ou tela existente que foi replicado.]

## Validação realizada

[Baseline de `main`: `npx tsc --noEmit` e `npx eslint .` com os problemas antigos listados arquivo a arquivo. Depois, num clone novo de `main` com a pasta de arquivos copiada por cima: `tsc` sem erros e `eslint` com saída idêntica ao baseline. Se houver lógica testável isoladamente (ex.: guarda de rota), executá-la de verdade e mostrar o resultado. Se `next build` falhar só por `fonts.googleapis.com`, dizer que é limitação de rede do ambiente de validação, não erro de código. Dizer também se a parte visual não pôde ser vista num navegador.]

## Como aplicar

1. **Confirme que a base não mudou:** `git diff --stat <hash> HEAD -- <arquivos que serão substituídos>`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
3. **Verifique** (abaixo).
4. **Marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

[O que esperar: `tsc` sem erros; `eslint` com exatamente os problemas antigos já listados e nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descartar essa alteração.]

## Fora de escopo

[Lista explícita do que fica de fora, com referência às tarefas irmãs (deste ou do outro repositório) que cobrem a parte complementar.]

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida
- [ ] Pasta copiada por inteiro (N alterados, N novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`
```

## Convenções transversais

- **O documento nunca carrega código de implementação.** Trechos curtos só quando fazem parte de um contrato de API ou de um comando de verificação.
- **Ordem fixa de validação:** `npm install` → `npx tsc --noEmit` → `npx eslint .` (ou `npx eslint "<arquivo>"` quando só um arquivo for relevante) → `next build` quando o ambiente permitir.
- **Baseline vs com a mudança:** roda-se `tsc`/`eslint` sem a mudança primeiro, anotam-se os problemas antigos arquivo a arquivo, depois com a mudança, e confirma-se zero problemas novos.
- **Base explícita:** o documento diz sobre que commit de `main` os arquivos foram gerados e dá o comando para detectar divergência antes de substituir.
- **Dependência de backend sempre em destaque:** quando existir, vem logo no topo (campo "Ordem de deploy"), nunca só mencionada de passagem no meio do texto.
- **Fora de escopo nunca fica implícito:** toda tarefa lista o que não faz, principalmente quando há tarefa irmã no `rastreio-backend` cobrindo a parte de backend do mesmo pedido.
- **Sem segredos** (chaves, tokens, URLs de API reais) em documentos nem em arquivos entregues.

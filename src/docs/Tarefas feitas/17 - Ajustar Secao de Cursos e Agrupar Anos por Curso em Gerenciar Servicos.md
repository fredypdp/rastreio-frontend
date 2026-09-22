# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main (já inclui a Tarefa 16, verificado byte a byte antes de escrever este documento)
**Execução:** Correção pequena, sem planejamento necessário. Aplique o patch, rode a verificação do Passo 2, mova o arquivo conforme o Passo 3.

---

## Contexto

Ajuste pedido depois de ver a Tarefa 16 em produção, na tela `/servicos-extras/gerenciar-servicos`, subtela de detalhe de um serviço, seção "Disponibilidade":

1. O título da seção de cursos, "Cursos (Médio / Superior)", devia ser só **"Cursos"**.
2. Quando um serviço está disponível em mais de um ano do **mesmo** curso, cada combinação curso+ano virava um badge separado (ex.: "Informática - 1º Ano" e "Informática - 2º Ano", dois badges). Devia ser **um badge só por curso**, juntando os anos: "Informática - 1º Ano, 2º Ano".

## O que o patch faz

Um arquivo só, **`src/components/paineis/ServicosExtrasPainel.tsx`**:

- Nova função `agruparCursosDisponiveis`, que recebe o array `cursos_disponiveis` (pares `"cursoId|ano"`) e devolve uma lista já agrupada por curso — um item por `cursoId`, com todos os anos daquele curso juntos (mantendo a ordem em que os cursos aparecem pela primeira vez no array original).
- O `.map` que renderizava um badge por combinação curso+ano agora usa essa função e renderiza um badge por curso, com os anos juntados por vírgula (`anos.join(", ")`).
- O texto "Cursos (Médio / Superior)" virou "Cursos".

Nada mais neste arquivo foi tocado — `formatarAnoCurso`, `nomeCurso`, a seção "Ensino Primário e Iº Ciclo" e o resto da tela continuam exatamente como a Tarefa 16 deixou.

## O que já foi validado pelo orquestrador

- Antes de escrever a mudança, conferi que `ServicosExtrasPainel.tsx` na `main` está **byte a byte idêntico** ao que a Tarefa 16 entregou — nenhuma mudança manual ou de outra tarefa no meio.
- `npx tsc --noEmit` e `npx eslint` do arquivo: limpos (o único aviso é o mesmo `missing dependency: recarregar` que já existia desde antes da Tarefa 16, não relacionado a esta mudança).
- Validação final: clone novo da `main` atual direto do GitHub (já com a Tarefa 16 dentro), `git apply` do patch, `npm install`, `npx tsc --noEmit` e `npx eslint` — 100% limpo.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "docs/Lista de Tarefas/17 - Ajustar Secao de Cursos e Agrupar Anos por Curso em Gerenciar Servicos.patch"
```

Deve alterar só `src/components/paineis/ServicosExtrasPainel.tsx`. Se `git apply` falhar, PARE e reporte o conflito — não recrie a mudança manualmente.

## Passo 2 — Verificação

```bash
npx tsc --noEmit
npx eslint src/components/paineis/ServicosExtrasPainel.tsx
```

`tsc` sem nenhum erro; `eslint` sem nenhum erro novo (só o aviso de `exhaustive-deps` já existente).

## O que NÃO fazer (fora de escopo)

- Não mexa na seção "Ensino Primário e Iº Ciclo" nem em nenhuma outra parte da tela — só a seção de Cursos.
- Não mude a ordem dos anos dentro de cada curso além de preservar a ordem em que já vinham no array `cursos_disponiveis`.
- Não toque em `ServicoExtraFormPainel.tsx` (a tela de criar/editar serviço) — ela já lista curso+ano de outro jeito (com seleção individual, não como badges de exibição) e não foi mencionada neste pedido.

## Passo 3 — Marcar como feito

Depois que o Passo 2 passar sem problema, mova este arquivo e o `.patch` correspondente de `docs/Lista de Tarefas/` para `docs/Tarefas feitas/`.

## Resumo das mudanças (checklist final)

- [x] Patch aplicado (`git apply`) sem conflitos
- [x] `npx tsc --noEmit` limpo
- [x] `npx eslint` sem erros novos
- [x] Arquivos desta tarefa movidos para `docs/Tarefas feitas/`

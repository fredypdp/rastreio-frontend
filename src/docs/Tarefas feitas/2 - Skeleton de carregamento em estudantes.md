# Tarefa — Skeleton de carregamento em /estudantes (Vista em Escala da Academia)

**Repositório:** `rastreio-frontend`
**Depende de:** nada. Independente de todas as outras tarefas desta leva.
**Execução:** Codex só executa — a alteração abaixo já foi escrita, validada com `tsc --noEmit` e `eslint` pelo orquestrador. Não há nada para planejar.

## Contexto

Depois da "Vista em Escala" ter se tornado a visão padrão para Academia em `/estudantes` (`useState(true)`, só Admin força `false`), deixou de aparecer qualquer aviso de carregamento enquanto a API responde: o bloco que mostrava "Carregando estudantes..." só existe no ramo `!vistaEscala` (a vista em tabela clássica) — a Vista em Escala em si só renderiza depois que `carregado` já é `true`. Resultado: entre o carregamento da página e a primeira resposta da API, a tela fica em branco para a Academia.

**Escopo confirmado:** isto afeta só a Academia. O Admin abre por padrão na vista em tabela clássica (que já tem o "Carregando estudantes..."), e só passa a ver a Vista em Escala quando alterna manualmente para ela — quando isso acontece, quem cuida do carregamento é o próprio componente `EstudantesVistaEscalaAdmin`, que não faz parte desta tarefa.

## Arquivo a alterar

`src/app/(painel)/estudantes/PageContent.tsx`

**Localizar** (o bloco da Vista em Escala da Academia, já carregada — este trecho não muda, é só a âncora para saber onde inserir o novo bloco):

```tsx
        {modoTela === 'lista' && vistaEscala && isAcademia && carregado && (
          <>
          <VistaEscala
            estudantes={estudantesEscala.length > 0 ? estudantesEscala : dataEstudantes?.estudantes ?? []}
            turmas={turmas}
            cursos={cursos}
            nivelAcademia={nivelParaVista}
            filtros={filtrosVisiveis}
            ordem={ordem}
            onVerDetalhes={handleVerDetalhes}
            anosAcademicos={anosAcademicosAcademia}
          />
          </>
        )}

        {/*
          Vista em Escala do Admin: navegação Província -> Academia -> árvore.
```

**Substituir por** (mantém o bloco existente e insere o novo Skeleton logo depois, antes do comentário da Vista em Escala do Admin):

```tsx
        {modoTela === 'lista' && vistaEscala && isAcademia && carregado && (
          <>
          <VistaEscala
            estudantes={estudantesEscala.length > 0 ? estudantesEscala : dataEstudantes?.estudantes ?? []}
            turmas={turmas}
            cursos={cursos}
            nivelAcademia={nivelParaVista}
            filtros={filtrosVisiveis}
            ordem={ordem}
            onVerDetalhes={handleVerDetalhes}
            anosAcademicos={anosAcademicosAcademia}
          />
          </>
        )}

        {modoTela === 'lista' && vistaEscala && isAcademia && !carregado && (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando estudantes">
            {[0, 1, 2].map((grupo) => (
              <div key={grupo} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {[0, 1, 2].map((linha) => (
                    <div key={linha} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3.5 flex-1 max-w-[220px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3.5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/*
          Vista em Escala do Admin: navegação Província -> Academia -> árvore.
```

Nada mais muda neste arquivo — nenhum outro bloco, estado, ou lógica é tocado.

## Arquivos a remover

Nenhum.

## Validação (já executada pelo orquestrador — Codex só precisa confirmar)

```bash
npx tsc --noEmit
# esperado: nenhuma saída

npx eslint "src/app/(painel)/estudantes/PageContent.tsx"
# esperado: nenhuma saída
```

## Conclusão

Depois de aplicar a substituição acima e confirmar `tsc`/`eslint` limpos, marcar esta tarefa como concluída.

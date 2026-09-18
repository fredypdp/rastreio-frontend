# Tarefa — Badges de pendência e reposicionamento do botão Atualizar em /solicitacoes

**Repositório:** `rastreio-frontend`
**Depende de:** nada. Independente de todas as outras tarefas desta leva.
**Execução:** Codex só executa — as 5 alterações abaixo (no mesmo arquivo) já foram escritas, validadas com `tsc --noEmit` e `eslint` pelo orquestrador. Não há nada para planejar.

## Contexto

Duas melhorias na tela `/solicitacoes`:

1. Quando existem solicitações pendentes, o número de pendências passa a aparecer como um selo (badge) pendurado no botão da aba correspondente (Interrupção, Desvinculação, Revinculação, Edição de dados) — hoje essa contagem só existia agregada, dentro do texto do botão "Atualizar".
2. O cartão de cabeçalho "Status acadêmico" / "Analise solicitações pendentes da sua academia." é removido — e o botão "Atualizar" (que vivia dentro desse cartão) passa a ficar na ponta direita da própria linha de abas.

Isto **não afeta o Admin**: o Admin nunca renderiza `AbasTabelaSolicitacoes` (só Academia e Estudante), e já tem o seu próprio botão de atualização ("Consultar solicitações", na seção específica do Admin, intocada por esta tarefa) — por isso remover o cartão de cabeçalho não deixa o Admin sem forma de atualizar.

Todas as alterações são no mesmo arquivo: `src/app/(painel)/solicitacoes/PageContent.tsx`.

---

## 1. Nova contagem de pendentes por aba

**Localizar:**
```tsx
  const pendentes = useMemo(() => items.filter((item) => item.status === "pendente").length, [items]);
  const edicoesPendentes = useMemo(() => editItems.filter((item) => item.status === "pendente").length, [editItems]);
  const itemsDaAba = useMemo(() => items.filter((item) => item.tipo === aba), [aba, items]);
```

**Substituir por:**
```tsx
  const pendentes = useMemo(() => items.filter((item) => item.status === "pendente").length, [items]);
  const edicoesPendentes = useMemo(() => editItems.filter((item) => item.status === "pendente").length, [editItems]);
  const pendentesPorAba = useMemo<Partial<Record<AbaSolicitacao, number>>>(() => {
    const contagem: Partial<Record<AbaSolicitacao, number>> = {};
    for (const item of items) {
      if (item.status === "pendente") contagem[item.tipo] = (contagem[item.tipo] ?? 0) + 1;
    }
    if (edicoesPendentes > 0) contagem.edicao = edicoesPendentes;
    return contagem;
  }, [items, edicoesPendentes]);
  const itemsDaAba = useMemo(() => items.filter((item) => item.tipo === aba), [aba, items]);
```

## 2. Remover o cartão "Status acadêmico"

**Localizar:**
```tsx
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status acadêmico</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{isEstudante ? "Crie e acompanhe suas solicitações." : isAcademia ? "Analise solicitações pendentes da sua academia." : "Consulte solicitações por instituição."}</p>
            </div>
            <button onClick={load} disabled={refreshing || (isAdmin && !academiaSelecionada)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-gray-700 dark:text-gray-200">{refreshing ? "Atualizando..." : `Atualizar (${pendentes + edicoesPendentes} pendentes)`}</button>
          </div>
        </section>

        {isAdmin && (
```

**Substituir por:**
```tsx
      <div className="space-y-6">
        {isAdmin && (
```

## 3. Passar as novas props na instância usada pela Academia

**Localizar:**
```tsx
        {isAcademia && !editSelecionada && <AbasTabelaSolicitacoes aba={aba} onChange={setAba} />}
```

**Substituir por:**
```tsx
        {isAcademia && !editSelecionada && (
          <AbasTabelaSolicitacoes
            aba={aba}
            onChange={setAba}
            pendentesPorAba={pendentesPorAba}
            totalPendentes={pendentes + edicoesPendentes}
            onAtualizar={load}
            atualizando={refreshing}
          />
        )}
```

## 4. Passar as novas props na instância usada pelo Estudante

**Localizar:**
```tsx
        {isEstudante && !editSelecionada && <AbasTabelaSolicitacoes aba={aba} onChange={setAba} />}
```

**Substituir por:**
```tsx
        {isEstudante && !editSelecionada && (
          <AbasTabelaSolicitacoes
            aba={aba}
            onChange={setAba}
            pendentesPorAba={pendentesPorAba}
            totalPendentes={pendentes + edicoesPendentes}
            onAtualizar={load}
            atualizando={refreshing}
          />
        )}
```

## 5. Componente `AbasTabelaSolicitacoes` — badges + botão Atualizar

**Localizar:**
```tsx
function AbasTabelaSolicitacoes({ aba, onChange }: { aba: AbaSolicitacao; onChange: (value: AbaSolicitacao) => void }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="hidden flex-wrap gap-2 sm:flex">
        {abasSolicitacoes.map((item) => (
          <button key={item.value} type="button" onClick={() => onChange(item.value)} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${aba === item.value ? "bg-brand-500 text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="sm:hidden">
        <SearchableSelect value={aba} options={abasSolicitacoes} onChange={(value) => onChange(value as AbaSolicitacao)} isSearchable={false} />
      </div>
    </section>
  );
}
```

**Substituir por:**
```tsx
function AbasTabelaSolicitacoes({
  aba,
  onChange,
  pendentesPorAba,
  totalPendentes,
  onAtualizar,
  atualizando,
}: {
  aba: AbaSolicitacao;
  onChange: (value: AbaSolicitacao) => void;
  pendentesPorAba: Partial<Record<AbaSolicitacao, number>>;
  totalPendentes: number;
  onAtualizar: () => void;
  atualizando: boolean;
}) {
  const rotuloAtualizar = atualizando ? "Atualizando..." : `Atualizar (${totalPendentes} pendentes)`;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        {abasSolicitacoes.map((item) => {
          const qtdPendente = pendentesPorAba[item.value] ?? 0;
          return (
            <button key={item.value} type="button" onClick={() => onChange(item.value)} className={`relative rounded-lg px-4 py-2 text-sm font-medium transition ${aba === item.value ? "bg-brand-500 text-white" : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"}`}>
              {item.label}
              {qtdPendente > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                  {qtdPendente}
                </span>
              )}
            </button>
          );
        })}
        <button type="button" onClick={onAtualizar} disabled={atualizando} className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-gray-700 dark:text-gray-200">
          {rotuloAtualizar}
        </button>
      </div>
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex-1">
          <SearchableSelect value={aba} options={abasSolicitacoes} onChange={(value) => onChange(value as AbaSolicitacao)} isSearchable={false} />
        </div>
        <button type="button" onClick={onAtualizar} disabled={atualizando} className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-60 dark:border-gray-700 dark:text-gray-200">
          {atualizando ? "..." : "Atualizar"}
        </button>
      </div>
    </section>
  );
}
```

⚠️ **Atenção ao aplicar:** o botão "Atualizar" original tinha `disabled={refreshing || (isAdmin && !academiaSelecionada)}`. A nova versão usa só `disabled={atualizando}` — isso é **intencional, não um esquecimento**: `AbasTabelaSolicitacoes` nunca é renderizado para Admin (só para `isAcademia`/`isEstudante`, ver seções 3 e 4), logo a condição `isAdmin && !academiaSelecionada` era sempre `false` neste contexto — removê-la é uma simplificação segura, não uma mudança de comportamento.

Nada mais muda neste arquivo — `abasSolicitacoes`, `AbaSolicitacao`, a seção específica do Admin, os formulários, e o resto da tela ficam exatamente como estão.

## Arquivos a remover

Nenhum.

## Validação (já executada pelo orquestrador — Codex só precisa confirmar)

```bash
npx tsc --noEmit
# esperado: nenhuma saída

npx eslint "src/app/(painel)/solicitacoes/PageContent.tsx"
# esperado: nenhuma saída
```

## Conclusão

Depois de aplicar as 5 substituições acima e confirmar `tsc`/`eslint` limpos, marcar esta tarefa como concluída.

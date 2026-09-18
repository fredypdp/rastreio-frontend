# Configurações de matrícula, subtela de documentos extra na matrícula pública e correção de terminologia

## Antes de começar (leia isto primeiro)

Esta tarefa já foi **inteiramente planejada, implementada e validada** por quem escreveu este documento: `npx tsc --noEmit` limpo (zero erros) no projeto inteiro depois de todas as mudanças abaixo, e `npx eslint .` sem nenhum erro/warning novo introduzido por elas (os poucos warnings que o eslint acusa no projeto são pré-existentes, em arquivos que esta tarefa não toca — `verificar-email/[token]/page.tsx`, `Calendar.tsx`, `SelecaoContextoMassa.tsx`, `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `AppSidebar.tsx` — não mexa neles, estão fora do escopo desta tarefa).

**Sua tarefa é só aplicar as mudanças abaixo exatamente como estão descritas.** Não há necessidade de repensar a abordagem — isso já foi feito, testado e revisado. Onde o documento diz "substitua o arquivo inteiro por", é para substituir o arquivo inteiro. Onde diz "aplique este diff", é uma mudança cirúrgica pequena — localize o trecho pelo contexto ao redor (linhas sem `+`/`-`) e aplique só o que muda.

## ⚠️ Dependência do backend

Esta tarefa **depende** da tarefa de backend "Documentos extra: suportar múltiplos anos acadêmicos + expor consulta pública para a matrícula" já ter sido aplicada (ou estar sendo aplicada no mesmo PR/deploy). O tipo `DocumentoExtra.anos_academicos` (array) e o endpoint `GET /academia/documento/:codigo_academia/documentos-extra` só existem depois daquela tarefa. Se você aplicar só o frontend sem o backend, a tela de configurações de matrícula vai compilar e funcionar visualmente, mas as chamadas à API vão falhar em runtime (404 na rota pública nova, e o backend antigo não aceita `anos_academicos` no payload).

## Contexto — o que está sendo resolvido e por quê

1. **Página `/configuracoes/matricula`** (catálogo de "Documentos extra" que a academia configura): o botão "Adicionar documento" abre um `Modal`, deveria ser uma subtela; o checkbox "Obrigatório no cadastro" é o `<input type="checkbox">` nativo do navegador em vez do componente `Checkbox` já usado no resto do app; e "Ano acadêmico" só permite selecionar um valor via `SearchableSelect`, quando deveria permitir vários, com o mesmo estilo de botões selecionáveis usado na criação de matérias/cursos/turmas, separados em "Ensino Primário e Iº Ciclo" e "Ensino Médio" (e uma terceira secção "Ensino Superior", ver decisão abaixo).

2. **Página `/matricula`** (matrícula pública, sem login): ainda restavam duas strings fixas e uma função de rotulagem (`getAnoLabel`) escrevendo "1º Ano Fundamental" em vez de "1ª Classe" — terminologia depreciada que o resto do app já não usa (ver `docs/Tarefas feitas/36 - Adaptar terminologia do Ensino Fundamental para Angola.md` no repositório do backend, que formalizou essa convenção). Adicionalmente, a consulta que verifica se a academia tem documentos extra configurados **já existe** no código, rodando em segundo plano (o usuário não vê nada acontecer) — mas está com dois problemas: (a) chama um endpoint que exige login de academia, que nunca funciona numa tela pública anônima (corrigido no backend, ver tarefa irmã); (b) mistura os documentos extra dentro da mesma tela de "Curso e ano acadêmico", quando deveriam aparecer numa tela própria, exibida apenas quando existirem, logo antes de "5. Solicitar matrícula".

3. **Escopo ampliado durante a investigação** (a pedido explícito, para não deixar nenhuma ocorrência depreciada de fora): mais 4 arquivos usando a mesma terminologia depreciada foram encontrados fora da página `/matricula` — `AvaliacaoFinalRulesSection.tsx`, `EstudantesVistaEscalaAdmin.tsx`, `PainelDashboard.tsx` (todos telas reais, visíveis a academias/admins) e `testes/PageContent.tsx` (ferramenta interna de seed/dev, gated por `isTestesPageEnabled()`, incluída por completude).

---

## Decisões de design já tomadas (não precisa reavaliar)

- **A subtela usa o mesmo padrão `view: "lista" | "form"` já usado em `ServicosExtrasPainel.tsx`** (troca de visualização dentro da mesma página, sem modal e sem navegação de rota). Não crie uma rota nova (`/configuracoes/matricula/novo`) — não é assim que o resto do projeto resolve esse mesmo problema.
- **Os botões de "Ano acadêmico" replicam exatamente o estilo visual já usado em `MateriaPainel.tsx`/`ServicosExtrasPainel.tsx`** (mesmas classes Tailwind para o estado ativo/inativo do botão).
- **Três secções, não duas: "Ensino Primário e Iº Ciclo", "Ensino Médio" e "Ensino Superior".** O pedido original mencionava duas secções e deixava o ensino superior em aberto ("não sei como proceder, sinta-se livre"). Decisão: renderizar a secção "Ensino Superior" também, mas condicionalmente — só aparece se a academia tiver algum ano de nível superior disponível (via cursos cadastrados). Isso mantém a mesma UI para os três níveis em vez de deixar o ensino superior sem nenhuma forma de configurar documentos extra pela UI nova.
- **As três secções ficam sempre visíveis ao mesmo tempo (quando aplicável), sem um toggle "escolha um tipo primeiro".** Diferente de `MateriaPainel.tsx` (que força escolher fundamental OU médio antes de mostrar os anos), aqui o usuário pode marcar anos de mais de uma secção no mesmo documento (ex.: um documento que vale tanto para a 9ª Classe quanto para o 1º Ano Médio). Isso é literalmente o que a mudança de single-select para multi-select do backend viabiliza.
- **O rótulo da etapa final da matrícula pública ("5. Solicitar matrícula") passa a ser calculado dinamicamente** (`5.` ou `6.`, dependendo de existir ou não uma etapa de documentos extra antes dela) — em vez de fixo. Isso é necessário porque a etapa de documentos extra só existe quando a academia realmente tem documentos configurados para o ano escolhido; quando não tem, a experiência continua idêntica à atual (5 passos).
- **A validação de documentos extra obrigatórios na matrícula pública passa a acontecer também no client-side**, na nova etapa (antes só existia no backend, então o erro só aparecia depois de tentar enviar). É uma melhoria pequena e natural ao mover o bloco para sua própria etapa — segue o mesmo padrão que já existe para os documentos acadêmicos fixos (etapa 2).

---

## Parte 1 — `src/types/api.ts`

```diff
diff --git a/src/types/api.ts b/src/types/api.ts
index d4b455d..da73757 100644
--- a/src/types/api.ts
+++ b/src/types/api.ts
@@ -161,8 +161,8 @@ export interface DocumentoExtra {
   rotulo: string;
   tipo: 'pdf' | 'jpg';
   obrigatorio: boolean;
-  nivel: 'fundamental' | 'medio' | 'superior';
-  ano_academico: AnoAcademico;
+  /** Um documento pode se aplicar a mais de um ano acadêmico ao mesmo tempo. */
+  anos_academicos: AnoAcademico[];
   ativo: boolean;
   created_at: string;
   updated_at: string;
@@ -172,7 +172,7 @@ export interface DocumentoExtraPayload {
   rotulo: string;
   tipo: 'pdf' | 'jpg';
   obrigatorio: boolean;
-  ano_academico: AnoAcademico;
+  anos_academicos: AnoAcademico[];
 }
 
 export interface CriarEstudanteRequest {
```

## Parte 2 — `src/lib/api/services.ts`

Adicione a nova função `listarDocumentosExtraDisponiveis` (rota pública, sem sessão de academia) logo depois de `listarDocumentosExtra`:

```diff
diff --git a/src/lib/api/services.ts b/src/lib/api/services.ts
index 0953a90..8596ae8 100644
--- a/src/lib/api/services.ts
+++ b/src/lib/api/services.ts
@@ -1627,6 +1627,11 @@ export const academiaService = {
     const query = qs.toString();
     return api.get<{ documentos_extra: DocumentoExtra[]; total: number }>(`/academia/documentos-extra${query ? `?${query}` : ''}`, { token: params?.token || tokenStorage.get() || undefined });
   },
+  // Rota pública (sem necessidade de sessão de academia) — usada pela tela
+  // pública de matrícula (/matricula) para saber, em segundo plano, se a
+  // academia escolhida tem documentos extra configurados. Mesmo padrão de
+  // `listarServicosExtrasDisponiveis` logo abaixo.
+  listarDocumentosExtraDisponiveis: (codigoAcademia: string, token?: string) => api.get<{ documentos_extra: DocumentoExtra[]; total: number }>(`/academia/documento/${encodeURIComponent(codigoAcademia)}/documentos-extra`, { token: token || tokenStorage.get() || undefined }),
   criarServicoExtra: (data: ServicoExtraPayload, token?: string) => api.post<{ message: string; data: ServicoExtra }, ServicoExtraPayload>('/academia/servicos-extras', data, { token: token || tokenStorage.get() || undefined }),
   atualizarServicoExtra: (id: string, data: ServicoExtraPayload, token?: string) => api.put<{ message: string; data: ServicoExtra }, ServicoExtraPayload>(`/academia/servicos-extras/${id}`, data, { token: token || tokenStorage.get() || undefined }),
   desativarServicoExtra: (id: string, token?: string) => api.put<{ data: ServicoExtra }>(`/academia/servicos-extras/${id}/desativar`, undefined, { token: token || tokenStorage.get() || undefined }),
```

## Parte 3 — Substituir `src/app/(painel)/configuracoes/matricula/PageContent.tsx`

Substitua o arquivo **inteiro** por este conteúdo:

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import SearchableSelect from "@/components/form/SearchableSelect";
import { PageHeading, PageDescription, Section, SectionTitle, SectionDescription } from "@/components/ui/typography/Typography";
import { academiaService } from "@/lib/api";
import { useUserCookie } from "@/hooks/useUserCookie";
import type { AnoAcademico, DocumentoExtra, DocumentoExtraPayload } from "@/types/api";

// Mesma lista/rótulos de src/components/paineis/MateriaPainel.tsx e
// src/components/paineis/ServicosExtrasPainel.tsx — mantenha os três em
// sincronia se a numeração de anos do fundamental mudar.
const ANOS_FUNDAMENTAL = [
  { value: "1_ano_fundamental", label: "1ª Classe" },
  { value: "2_ano_fundamental", label: "2ª Classe" },
  { value: "3_ano_fundamental", label: "3ª Classe" },
  { value: "4_ano_fundamental", label: "4ª Classe" },
  { value: "5_ano_fundamental", label: "5ª Classe" },
  { value: "6_ano_fundamental", label: "6ª Classe" },
  { value: "7_ano_fundamental", label: "7ª Classe" },
  { value: "8_ano_fundamental", label: "8ª Classe" },
  { value: "9_ano_fundamental", label: "9ª Classe" },
];

function labelAno(ano: string): string {
  const match = ano.match(/^(\d+)_ano_(fundamental|medio|superior)$/);
  if (!match) return ano;
  if (match[2] === "fundamental") return `${match[1]}ª Classe`;
  return `${match[1]}º Ano ${match[2] === "medio" ? "Médio" : "Superior"}`;
}

function nivelDoAno(ano: string): "fundamental" | "medio" | "superior" | null {
  if (ano.endsWith("_ano_fundamental")) return "fundamental";
  if (ano.endsWith("_ano_medio")) return "medio";
  if (ano.endsWith("_ano_superior")) return "superior";
  return null;
}

const empty = (): DocumentoExtraPayload => ({ rotulo: "", tipo: "pdf", obrigatorio: false, anos_academicos: [] });

const botaoAnoClasse = (ativo: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
    ativo
      ? "bg-brand-500 text-white border-brand-500"
      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-400"
  }`;

export default function PageContent() {
  const { user, loading: loadingUser } = useUserCookie();
  const [view, setView] = useState<"lista" | "form">("lista");
  const [docs, setDocs] = useState<DocumentoExtra[]>([]);
  const [form, setForm] = useState<DocumentoExtraPayload>(empty());
  const [editing, setEditing] = useState<DocumentoExtra | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [anosCursos, setAnosCursos] = useState<string[]>([]);

  const anosDisponiveis = useMemo(
    () =>
      Array.from(new Set([...(user?.academia?.anos_academicos ?? []), ...anosCursos])).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    [user, anosCursos]
  );

  const anosFundamentalOpcoes = useMemo(
    () => ANOS_FUNDAMENTAL.filter((a) => anosDisponiveis.includes(a.value)),
    [anosDisponiveis]
  );
  const anosMedioOpcoes = useMemo(
    () => anosDisponiveis.filter((a) => nivelDoAno(a) === "medio").map((value) => ({ value, label: labelAno(value) })),
    [anosDisponiveis]
  );
  const anosSuperiorOpcoes = useMemo(
    () => anosDisponiveis.filter((a) => nivelDoAno(a) === "superior").map((value) => ({ value, label: labelAno(value) })),
    [anosDisponiveis]
  );

  const carregar = async () => {
    setLoading(true);
    try {
      const r = await academiaService.listarDocumentosExtra();
      setDocs(r.documentos_extra ?? []);
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível carregar os documentos extra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && user?.academia) {
      void carregar();
      academiaService
        .listarCursos()
        .then((r) => setAnosCursos((r.cursos ?? []).flatMap((c) => c.anos_academicos ?? [])))
        .catch(() => undefined);
    }
  }, [loadingUser, user?.academia]);

  const abrir = (d?: DocumentoExtra) => {
    setErro("");
    setEditing(d ?? null);
    setForm(d ? { rotulo: d.rotulo, tipo: d.tipo, obrigatorio: d.obrigatorio, anos_academicos: d.anos_academicos } : empty());
    setView("form");
  };

  const voltarParaLista = () => {
    setErro("");
    setView("lista");
  };

  const toggleAno = (ano: string) => {
    setForm((prev) => ({
      ...prev,
      anos_academicos: (prev.anos_academicos.includes(ano as AnoAcademico)
        ? prev.anos_academicos.filter((v) => v !== ano)
        : [...prev.anos_academicos, ano]) as AnoAcademico[],
    }));
  };

  const salvar = async () => {
    if (!form.rotulo.trim()) {
      setErro("Preencha o rótulo do documento.");
      return;
    }
    if (form.anos_academicos.length === 0) {
      setErro("Selecione ao menos um ano acadêmico.");
      return;
    }
    setSaving(true);
    try {
      const payload: DocumentoExtraPayload = { ...form, rotulo: form.rotulo.trim() };
      if (editing) await academiaService.atualizarDocumentoExtra(editing.id, payload);
      else await academiaService.criarDocumentoExtra(payload);
      setView("lista");
      await carregar();
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível salvar o documento.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (d: DocumentoExtra) => {
    try {
      if (d.ativo) await academiaService.desativarDocumentoExtra(d.id);
      else await academiaService.reativarDocumentoExtra(d.id);
      await carregar();
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível atualizar o documento.");
    }
  };

  if (view === "form") {
    return (
      <div>
        <PageBreadcrumb pageTitle="Documentos extra" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <PageHeading>{editing ? "Editar documento" : "Novo documento"}</PageHeading>
          <PageDescription>Configure o documento adicional exigido — ou apenas oferecido — no cadastro e na matrícula.</PageDescription>
          {erro && <Alert variant="error" title="Documentos extra" message={erro} />}

          <div className="mt-5 max-w-2xl space-y-5">
            <Section>
              <SectionTitle>Informações do documento</SectionTitle>
              <div>
                <Label>Rótulo *</Label>
                <Input value={form.rotulo} onChange={(e) => setForm({ ...form, rotulo: e.target.value })} placeholder="Ex.: Atestado médico" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <SearchableSelect
                  value={form.tipo}
                  options={[{ value: "pdf", label: "PDF" }, { value: "jpg", label: "JPG" }]}
                  onChange={(v) => setForm({ ...form, tipo: v as "pdf" | "jpg" })}
                  isClearable={false}
                />
              </div>
              <Checkbox label="Obrigatório no cadastro" checked={form.obrigatorio} onChange={(obrigatorio) => setForm({ ...form, obrigatorio })} />
            </Section>

            <Section>
              <SectionTitle>Ano acadêmico *</SectionTitle>
              <SectionDescription>Selecione um ou mais anos acadêmicos aos quais este documento se aplica.</SectionDescription>

              {anosFundamentalOpcoes.length > 0 && (
                <div className="space-y-2">
                  <SectionTitle>Ensino Primário e Iº Ciclo</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {anosFundamentalOpcoes.map((a) => (
                      <button key={a.value} type="button" onClick={() => toggleAno(a.value)} className={botaoAnoClasse((form.anos_academicos as string[]).includes(a.value))}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {anosMedioOpcoes.length > 0 && (
                <div className="space-y-2">
                  <SectionTitle>Ensino Médio</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {anosMedioOpcoes.map((a) => (
                      <button key={a.value} type="button" onClick={() => toggleAno(a.value)} className={botaoAnoClasse((form.anos_academicos as string[]).includes(a.value))}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {anosSuperiorOpcoes.length > 0 && (
                <div className="space-y-2">
                  <SectionTitle>Ensino Superior</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {anosSuperiorOpcoes.map((a) => (
                      <button key={a.value} type="button" onClick={() => toggleAno(a.value)} className={botaoAnoClasse((form.anos_academicos as string[]).includes(a.value))}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {anosFundamentalOpcoes.length === 0 && anosMedioOpcoes.length === 0 && anosSuperiorOpcoes.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum ano acadêmico disponível — configure os anos da instituição ou cadastre um curso primeiro.
                </p>
              )}
            </Section>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={voltarParaLista}>Cancelar</Button>
            <Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Documentos extra" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Catálogo de documentos extra</h1>
            <p className="mt-1 text-sm text-gray-500">Configure os documentos solicitados por ano acadêmico.</p>
          </div>
          <Button onClick={() => abrir()}>Adicionar documento</Button>
        </div>
        {erro && <Alert variant="error" title="Documentos extra" message={erro} />}
        {loading ? (
          <p className="py-8 text-center text-gray-500">Carregando documentos...</p>
        ) : docs.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Nenhum documento extra configurado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3">Rótulo</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Anos acadêmicos</th>
                  <th className="p-3">Obrigatório</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="p-3 font-medium">{d.rotulo}</td>
                    <td className="p-3 uppercase">{d.tipo}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {d.anos_academicos.map((ano) => (
                          <span key={ano} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {labelAno(ano)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">{d.obrigatorio ? "Sim" : "Não"}</td>
                    <td className="p-3">{d.ativo ? "Ativo" : "Inativo"}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => abrir(d)} className="mr-3 text-brand-600">Editar</button>
                      <button onClick={() => toggleAtivo(d)} className={d.ativo ? "text-red-600" : "text-green-600"}>
                        {d.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

Note que o arquivo foi reescrito num estilo mais legível (multi-linha, um componente/handler por bloco) em vez do estilo condensado de uma linha só que o arquivo tinha antes — decisão deliberada dado o aumento de complexidade (subtela + multi-select em 3 secções); não é necessário preservar o estilo antigo.

## Parte 4 — `src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx`

Este arquivo **não estava no pedido original**, mas também usa `DocumentoExtra.ano_academico` (tela de cadastro direto de estudante pela academia) e quebraria silenciosamente em runtime (o filtro nunca acharia nada) se não fosse atualizado junto — encontrado durante a varredura de todos os usos de `DocumentoExtra` no projeto.

```diff
diff --git a/src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx b/src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx
index d5863ce..ca90ee2 100644
--- a/src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx
+++ b/src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx
@@ -10,7 +10,7 @@ import Input from "@/components/form/input/InputField";
 import BirthDatePicker from "@/components/form/BirthDatePicker";
 import DocumentUpload from "@/components/form/DocumentUpload";
 import SearchableSelect from "@/components/form/SearchableSelect";
-import type { Genero, Curso, Turma, DocumentoExtra } from '@/types/api';
+import type { Genero, Curso, Turma, DocumentoExtra, AnoAcademico } from '@/types/api';
 
 // ─── Tipos ────────────────────────────────────────────────────────────────────
 
@@ -300,7 +300,7 @@ export default function CadastroSingularForm() {
     t.nivel === anoEscolarSelecionado && (cursoSelecionado?.id ? t.curso_id === cursoSelecionado.id : true)
   );
   const declaracaoAnoAcademico = getAnoAcademicoAnterior(anoEscolarSelecionado);
-  const documentosExtraDoAno = documentosExtra.filter((doc) => doc.ano_academico === anoEscolarSelecionado);
+  const documentosExtraDoAno = documentosExtra.filter((doc) => !!anoEscolarSelecionado && doc.anos_academicos.includes(anoEscolarSelecionado as AnoAcademico));
 
   const documentos: DocumentoOpcao[] = (() => {
     const anoAtual = anoEscolarSelecionado ?? undefined;
```

## Parte 5 — `src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx`

Este é o arquivo mais extenso da tarefa. O diff abaixo cobre, nesta ordem: import do tipo `AnoAcademico`; `StepId` passa a admitir `5`; remoção do array `steps` fixo (vira `useMemo` dinâmico dentro do componente); correção de `getAnoLabel` (fundamental → "Xª Classe"); troca do endpoint de `listarDocumentosExtra` para `listarDocumentosExtraDisponiveis` (rota pública); filtro de `documentosExtraDoAno` adaptado para `anos_academicos` (array); novas variáveis derivadas `temDocumentosExtra`/`stepDocumentosExtraNumero`/`stepFinalNumero`/`stepFinalId`; validação da nova etapa em `validarStep`; `avancar()`/`submit()` usando `stepFinalId`; as duas strings fixas de "1.º Ano Fundamental" → "1ª Classe"; remoção do bloco de documentos extra de dentro da etapa "2. Selecionar curso e ano acadêmico"; nova etapa condicional "Documentos extra" inserida antes da etapa final; etapa final com título dinâmico e resumo incluindo os documentos extra anexados; e o botão "Continuar"/"Solicitar matrícula" usando `stepFinalId`.

```diff
diff --git a/src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx b/src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx
index 45ccb97..6ca0d0b 100644
--- a/src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx
+++ b/src/app/(full-width-pages)/(auth)/matricula/MatriculaPublicPage.tsx
@@ -11,16 +11,15 @@ import Label from "@/components/form/Label";
 import Button from "@/components/ui/button/Button";
 import { Qr, money } from "@/components/paineis/financeiroShared";
 import { academiaService, consultasService, solicitacaoMatriculaService } from "@/lib/api/services";
-import type { AcademiaDetalhada, CriarSolicitacaoMatriculaRequest, Curso, FinanceiroMetodoPagamento, Genero, SolicitacaoMatriculaResumo, SolicitacaoMatriculaStatusResponse, DocumentoExtra } from "@/types/api";
+import type { AcademiaDetalhada, AnoAcademico, CriarSolicitacaoMatriculaRequest, Curso, FinanceiroMetodoPagamento, Genero, SolicitacaoMatriculaResumo, SolicitacaoMatriculaStatusResponse, DocumentoExtra } from "@/types/api";
 
-type StepId = 0 | 1 | 2 | 3 | 4;
+type StepId = 0 | 1 | 2 | 3 | 4 | 5;
 type FileKey = "bi_estudante" | "bi_encarregado" | "cedula_estudante" | "declaracao" | "certificado_6_ano_fundamental" | "certificado_9_ano_fundamental" | "certificado_ensino_medio";
 type MatriculaForm = Partial<CriarSolicitacaoMatriculaRequest> & { genero: Genero };
 
 interface AnoOpcao { label: string; value: string }
 interface DocumentoOpcao { key: FileKey; label: string; obrigatorio: boolean }
 
-const steps = ["1º Passo", "2º Passo", "3º Passo", "4º Passo", "5º Passo"];
 const emptyForm: MatriculaForm = { genero: "masculino" };
 
 function normalizarAcademia(response: unknown): AcademiaDetalhada {
@@ -32,8 +31,8 @@ function getAnoLabel(value?: string) {
   if (!value) return "-";
   const match = value.match(/^(\d+)_ano_(fundamental|medio|superior)$/);
   if (!match) return value.replace(/_/g, " ");
-  const nivel = match[2] === "medio" ? "Médio" : match[2] === "superior" ? "Superior" : "Fundamental";
-  return `${match[1]}º Ano ${nivel}`;
+  if (match[2] === "fundamental") return `${match[1]}ª Classe`;
+  return `${match[1]}º Ano ${match[2] === "medio" ? "Médio" : "Superior"}`;
 }
 
 function getAnoAcademicoAnterior(value?: string | null) {
@@ -130,7 +129,7 @@ export default function MatriculaPublicPage() {
   const academiaSuperior = academia?.nivel === "superior";
   useEffect(() => {
     if (!academia?.codigo_academia) { setDocumentosExtra([]); return; }
-    academiaService.listarDocumentosExtra({ ativos: true, codigo_academia: academia.codigo_academia }).then((res) => setDocumentosExtra(res.documentos_extra ?? [])).catch(() => setDocumentosExtra([]));
+    academiaService.listarDocumentosExtraDisponiveis(academia.codigo_academia).then((res) => setDocumentosExtra(res.documentos_extra ?? [])).catch(() => setDocumentosExtra([]));
   }, [academia?.codigo_academia]);
 
   const cursosAtivos = useMemo(() => cursos.filter((item) => item.status === "ativo"), [cursos]);
@@ -215,7 +214,19 @@ export default function MatriculaPublicPage() {
   );
 
   const declaracaoAnoAcademico = getAnoAcademicoAnterior(anoSelecionado);
-  const documentosExtraDoAno = documentosExtra.filter((doc) => doc.ano_academico === anoSelecionado);
+  const documentosExtraDoAno = documentosExtra.filter((doc) => !!anoSelecionado && doc.anos_academicos.includes(anoSelecionado as AnoAcademico));
+  const temDocumentosExtra = documentosExtraDoAno.length > 0;
+  // Quando a academia tem documentos extra configurados para o ano
+  // escolhido, uma etapa extra é inserida ANTES da etapa final — por isso o
+  // rótulo/numeração da etapa final e a lista de passos do indicador de
+  // progresso são calculados dinamicamente, em vez de fixos em 5 passos.
+  const stepDocumentosExtraNumero = 5;
+  const stepFinalNumero = temDocumentosExtra ? 6 : 5;
+  const stepFinalId: StepId = temDocumentosExtra ? 5 : 4;
+  const steps = useMemo(
+    () => (temDocumentosExtra ? ["1º Passo", "2º Passo", "3º Passo", "4º Passo", "5º Passo", "6º Passo"] : ["1º Passo", "2º Passo", "3º Passo", "4º Passo", "5º Passo"]),
+    [temDocumentosExtra]
+  );
   const estudanteSuperiorSelecionado = isSuperior(anoSelecionado ?? undefined);
   const estudantePrimeiroFundamental = anoSelecionado === "1_ano_fundamental";
   const estudanteEscolarSelecionado = !!anoSelecionado && !estudanteSuperiorSelecionado;
@@ -359,6 +370,10 @@ export default function MatriculaPublicPage() {
       if (form.telefone && form.telefone_encarregado && onlyDigits(form.telefone) === onlyDigits(form.telefone_encarregado)) return "Os telefones do estudante e do encarregado de educação não podem ser iguais.";
       if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Informe um email válido.";
     }
+    if (current === 4 && temDocumentosExtra) {
+      const faltandoExtra = documentosExtraDoAno.find((doc) => doc.obrigatorio && !filesExtra[doc.id]);
+      if (faltandoExtra) return `Anexe o documento: ${faltandoExtra.rotulo}.`;
+    }
     return "";
   }
 
@@ -369,7 +384,7 @@ export default function MatriculaPublicPage() {
       return;
     }
     setErro("");
-    setStep((prev) => Math.min(prev + 1, 4) as StepId);
+    setStep((prev) => Math.min(prev + 1, stepFinalId) as StepId);
   }
 
   function voltar() {
@@ -388,6 +403,14 @@ export default function MatriculaPublicPage() {
         return;
       }
     }
+    if (temDocumentosExtra) {
+      const msg = validarStep(4);
+      if (msg) {
+        setStep(4);
+        setErro(msg);
+        return;
+      }
+    }
     if (!academia || !anoSelecionado) return;
 
     setLoading(true);
@@ -638,7 +661,7 @@ export default function MatriculaPublicPage() {
                 <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                   <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Documentos para {getAnoLabel(anoSelecionado)}</p>
                   {estudantePrimeiroFundamental && (
-                    <InfoCard title="Não é necessário nenhum comprovativo anterior" lines={["Para o 1.º Ano Fundamental, não pedimos documentos de anos anteriores."]} />
+                    <InfoCard title="Não é necessário nenhum comprovativo anterior" lines={["Para a 1ª Classe, não pedimos documentos de anos anteriores."]} />
                   )}
                   {(documentosAcademicosSemAlternativas.length > 0 || mostrarAlternativaAcademica) && (
                     <div className="grid gap-3 sm:grid-cols-2">
@@ -669,7 +692,6 @@ export default function MatriculaPublicPage() {
                       )}
                     </div>
                   )}
-                  {documentosExtraDoAno.length > 0 && <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 dark:border-gray-800"><p className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">Documentos extra</p>{documentosExtraDoAno.map((doc) => <DocumentUpload key={doc.id} id={`matricula-documento-extra-${doc.id}`} label={doc.rotulo} required={doc.obrigatorio} tipo={doc.tipo} file={filesExtra[doc.id]} onChange={(file, error) => { if (error) setErro(error); else setErro(""); setFilesExtra((prev) => ({ ...prev, [doc.id]: file })); }} />)}</div>}
                 </div>
               )}
             </section>
@@ -698,7 +720,7 @@ export default function MatriculaPublicPage() {
                       />
                     </div>
                   ) : (
-                    <InfoCard title="Documento do estudante" lines={["Para o 1.º Ano Fundamental, pedimos apenas a cédula do estudante."]} />
+                    <InfoCard title="Documento do estudante" lines={["Para a 1ª Classe, pedimos apenas a cédula do estudante."]} />
                   )}
                   <div>
                     <Label>Bilhete de Identidade do encarregado de educação</Label>
@@ -751,11 +773,39 @@ export default function MatriculaPublicPage() {
             </section>
           )}
 
-          {step === 4 && (
+          {step === 4 && temDocumentosExtra && (
+            <section className="space-y-4">
+              <StepTitle
+                title={`${stepDocumentosExtraNumero}. Documentos extra`}
+                description={`Esta instituição exige documentos adicionais para ${getAnoLabel(anoSelecionado ?? undefined)}. Anexe-os para continuar.`}
+              />
+              <div className="grid gap-3 sm:grid-cols-2">
+                {documentosExtraDoAno.map((doc) => (
+                  <DocumentUpload
+                    key={doc.id}
+                    id={`matricula-documento-extra-${doc.id}`}
+                    label={doc.rotulo}
+                    required={doc.obrigatorio}
+                    tipo={doc.tipo}
+                    file={filesExtra[doc.id]}
+                    onChange={(file, error) => { if (error) setErro(error); else setErro(""); setFilesExtra((prev) => ({ ...prev, [doc.id]: file })); }}
+                  />
+                ))}
+              </div>
+            </section>
+          )}
+
+          {step === stepFinalId && (
             <section className="space-y-4">
-              <StepTitle title="5. Solicitar matrícula" description="Revise o resumo geral e envie a solicitação." />
+              <StepTitle title={`${stepFinalNumero}. Solicitar matrícula`} description="Revise o resumo geral e envie a solicitação." />
               <div className="grid gap-2 sm:grid-cols-2">{resumo.map(([label, value]) => <div key={label} className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800"><span className="block text-xs text-gray-500">{label}</span><b className="text-gray-800 dark:text-white/90">{value}</b></div>)}</div>
-              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"><h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Documentos anexados</h3><div className="grid gap-1 text-sm sm:grid-cols-2">{documentos.map((doc) => <p key={doc.key} className="text-gray-600 dark:text-gray-300"><b>{doc.label}:</b> {files[doc.key] ? "✓ anexado" : doc.obrigatorio ? "Ainda falta" : "Não anexado"}</p>)}</div></div>
+              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
+                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Documentos anexados</h3>
+                <div className="grid gap-1 text-sm sm:grid-cols-2">
+                  {documentos.map((doc) => <p key={doc.key} className="text-gray-600 dark:text-gray-300"><b>{doc.label}:</b> {files[doc.key] ? "✓ anexado" : doc.obrigatorio ? "Ainda falta" : "Não anexado"}</p>)}
+                  {documentosExtraDoAno.map((doc) => <p key={doc.id} className="text-gray-600 dark:text-gray-300"><b>{doc.rotulo}:</b> {filesExtra[doc.id] ? "✓ anexado" : doc.obrigatorio ? "Ainda falta" : "Não anexado"}</p>)}
+                </div>
+              </div>
               {sucesso && (
                 <button
                   type="button"
@@ -773,7 +823,7 @@ export default function MatriculaPublicPage() {
         {erro && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{erro}</p>}
         <div className="mt-5 flex items-center justify-between gap-3">
           <button type="button" onClick={voltar} disabled={step === 0 || loading} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-300">Voltar</button>
-          {step < 4 ? <Button onClick={avancar}>Continuar</Button> : <Button disabled={loading || !!sucesso} onClick={submit}>{loading ? "Enviando..." : sucesso ? "Solicitação enviada" : "Solicitar matrícula"}</Button>}
+          {step < stepFinalId ? <Button onClick={avancar}>Continuar</Button> : <Button disabled={loading || !!sucesso} onClick={submit}>{loading ? "Enviando..." : sucesso ? "Solicitação enviada" : "Solicitar matrícula"}</Button>}
         </div>
         </>
         )}
```

### Por que a etapa de documentos extra fica no índice `4` fixo

Repare que a nova etapa usa a condição `step === 4 && temDocumentosExtra` (não um índice calculado). Isso funciona porque a etapa de documentos extra, quando existe, está **sempre** logo depois da etapa "4. Telefone e email" (índice `3`) — ou seja, sempre no índice `4`, existindo ou não. O que muda dinamicamente é só o índice da etapa **final** (`stepFinalId`): `4` quando não há documentos extra (comportamento idêntico ao atual), `5` quando há. Não tente generalizar isso para suportar mais de uma etapa condicional — não é necessário aqui.

---

## Parte 6 — Correção de terminologia (escopo ampliado)

Estes quatro arquivos foram encontrados durante a varredura por ocorrências de terminologia depreciada ("Fundamental" como texto visível ao usuário, em vez de "Ensino Primário e Iº Ciclo"/"Xª Classe") e foram incluídos por completude, a pedido explícito de não deixar nenhuma ocorrência de fora. Todos seguem a mesma convenção já estabelecida e usada predominantemente no resto do projeto (dezenas de ocorrências corretas já existem, ex.: `financeiroShared.tsx`, `MateriaPainel.tsx`, `ServicosExtrasPainel.tsx`).

### 6.1 — `src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx`

```diff
diff --git a/src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx b/src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx
index 6191fe1..fd0d419 100644
--- a/src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx
+++ b/src/app/(painel)/configuracoes/AvaliacaoFinalRulesSection.tsx
@@ -24,7 +24,7 @@ function labelPeriodo(v: string) {
 }
 
 function labelTipo(v: TipoEnsino) {
-  return v === "fundamental" ? "Ensino fundamental" : v === "medio" ? "Ensino médio" : "Ensino superior";
+  return v === "fundamental" ? "Ensino Primário e Iº Ciclo" : v === "medio" ? "Ensino Médio" : "Ensino Superior";
 }
 
 function labelFormula(formula: string): string {
@@ -386,6 +386,6 @@ function InformacaoAvaliacaoFinal({ perfil, nivel, modelosMedio }: { perfil: Inf
         </div>
       </InfoCard>
     )}
-    {perfil === "admin" && <InfoCard title="O que o administrador precisa saber"><p>Nas escolas, as regras são fixas para manter o mesmo padrão entre academias: Ensino fundamental, Ensino Médio Técnico ou Liceu, exame e recurso seguem o catálogo oficial. No ensino superior, cada academia tem liberdade para criar suas próprias regras e categorias.</p></InfoCard>}
+    {perfil === "admin" && <InfoCard title="O que o administrador precisa saber"><p>Nas escolas, as regras são fixas para manter o mesmo padrão entre academias: Ensino Primário e Iº Ciclo, Ensino Médio Técnico ou Liceu, exame e recurso seguem o catálogo oficial. No ensino superior, cada academia tem liberdade para criar suas próprias regras e categorias.</p></InfoCard>}
   </div>;
 }
```

### 6.2 — `src/components/estudantes/EstudantesVistaEscalaAdmin.tsx`

```diff
diff --git a/src/components/estudantes/EstudantesVistaEscalaAdmin.tsx b/src/components/estudantes/EstudantesVistaEscalaAdmin.tsx
index 81a6170..8d8ccec 100644
--- a/src/components/estudantes/EstudantesVistaEscalaAdmin.tsx
+++ b/src/components/estudantes/EstudantesVistaEscalaAdmin.tsx
@@ -69,8 +69,8 @@ function nomeProvincia(codigo?: string): string {
 function labelNivelAcademia(acad: AcadInfo): string {
   if (acad.nivel === 'superior') return 'Ensino Superior';
   if (acad.nivel_escolar === 'medio') return 'Ensino Médio';
-  if (acad.nivel_escolar === 'misto') return 'Ensino Fundamental + Médio';
-  return 'Ensino Fundamental';
+  if (acad.nivel_escolar === 'misto') return 'Ensino Primário e Iº Ciclo + Médio';
+  return 'Ensino Primário e Iº Ciclo';
 }
 
 export default function EstudantesVistaEscalaAdmin({ onVerDetalhes }: {
```

### 6.3 — `src/components/dashboard/PainelDashboard.tsx`

```diff
diff --git a/src/components/dashboard/PainelDashboard.tsx b/src/components/dashboard/PainelDashboard.tsx
index b906c4b..efee45c 100644
--- a/src/components/dashboard/PainelDashboard.tsx
+++ b/src/components/dashboard/PainelDashboard.tsx
@@ -441,10 +441,10 @@ function DashboardAcademia({ user }: { user: MeuPerfilResponse }) {
   const nivelLabel = isSuperior
     ? "Superior"
     : academia.nivel_escolar === "fundamental"
-    ? "Fundamental"
+    ? "Ensino Primário e Iº Ciclo"
     : academia.nivel_escolar === "medio"
     ? "Médio"
-    : "Fundamental + Médio";
+    : "Ensino Primário e Iº Ciclo + Médio";
 
   return (
     <div className="space-y-6">
```

### 6.4 — `src/app/(painel)/testes/PageContent.tsx` (ferramenta interna, baixa prioridade)

Esta é uma ferramenta de dev/seed gated por `isTestesPageEnabled()` (não é uma tela real de cliente). Incluída por completude. Note que os identificadores internos (`anoFundamental`, `anosFundamentalSelecionados`, o valor `"fundamental"` passado para `gerarTurmas(...)`/`gerarEstudantes(...)`, etc.) **não foram alterados** — só o texto visível (labels de dropdown, títulos de secção, texto de botões e mensagens de log). Isso é intencional e consistente com o resto do projeto, que sempre mantém `"fundamental"` como valor interno e só troca o rótulo exibido.

```diff
diff --git a/src/app/(painel)/testes/PageContent.tsx b/src/app/(painel)/testes/PageContent.tsx
index 2216f70..5dec02a 100644
--- a/src/app/(painel)/testes/PageContent.tsx
+++ b/src/app/(painel)/testes/PageContent.tsx
@@ -242,18 +242,18 @@ function tiposMateriaValidos(academia: AcademiaInfo): { value: "fundamental"|"me
     return [{ value: "superior", label: "Superior" }];
   }
   if (academia.nivel === "fundamental") {
-    return [{ value: "fundamental", label: "Fundamental" }];
+    return [{ value: "fundamental", label: "Ensino Primário e Iº Ciclo" }];
   }
   if (academia.nivel === "medio") {
     return [{ value: "medio", label: "Médio" }];
   }
   if (academia.nivel === "misto") {
     return [
-      { value: "fundamental", label: "Fundamental" },
+      { value: "fundamental", label: "Ensino Primário e Iº Ciclo" },
       { value: "medio", label: "Médio" },
     ];
   }
-  return [{ value: "fundamental", label: "Fundamental" }];
+  return [{ value: "fundamental", label: "Ensino Primário e Iº Ciclo" }];
 }
 
 function tiposCursoValidos(academia: AcademiaInfo): { value: "medio"|"superior"; label: string }[] {
@@ -1109,7 +1109,7 @@ export default function PageContent() {
       return;
     }
     if (modoAcademia === "misto" && !focoMisto) {
-      addLog("Escola mista: use os botões separados para criar estudantes do Fundamental ou do Médio sem misturar os níveis.", "warn");
+      addLog("Escola mista: use os botões separados para criar estudantes do Ensino Primário e Iº Ciclo ou do Médio sem misturar os níveis.", "warn");
       return;
     }
 
@@ -1978,7 +1978,7 @@ export default function PageContent() {
       ? { titulo: "Academia Escola — Médio", icon: "🧪", cor: "#b45309", descricao: "Cursos médios obrigatórios, trimestres escolares e categorias fixas conforme o ano acadêmico." }
       : academia?.nivel === "misto"
         ? { titulo: "Academia Escola — Misto", icon: "🧩", cor: "#0f766e", descricao: "Combina fundamental e médio com distribuição percentual e vínculos separados por nível/curso." }
-        : { titulo: "Academia Escola — Fundamental", icon: "📘", cor: "#2563eb", descricao: "Anos fundamentais próprios da academia, sem cursos, com notas escolares fixas." };
+        : { titulo: "Academia Escola — Ensino Primário e Iº Ciclo", icon: "📘", cor: "#2563eb", descricao: "Anos fundamentais próprios da academia, sem cursos, com notas escolares fixas." };
 
   // ─── Render helpers ────────────────────────────────────────────────────────────
 
@@ -2285,7 +2285,7 @@ export default function PageContent() {
                         <option value="random">Aleatório</option>
                         {(academia.nivel === "fundamental" || academia.nivel === "misto") &&
                           (academia.anos_academicos || []).filter(a => a.includes("fundamental")).map(a => (
-                            <option key={a} value={a}>{a.replace(/_ano_fundamental$/, "º Fundamental")}</option>
+                            <option key={a} value={a}>{a.replace(/_ano_fundamental$/, "ª Classe")}</option>
                           ))
                         }
                         {niveisParaTurma.filter(a => !a.includes("fundamental")).map(a => (
@@ -2297,7 +2297,7 @@ export default function PageContent() {
                     </Field>
                     {academia.nivel === "misto" ? (
                       <>
-                        <Btn onClick={() => withLoading(() => gerarTurmas("fundamental"))} color="#2563eb">Gerar turmas Fundamental</Btn>
+                        <Btn onClick={() => withLoading(() => gerarTurmas("fundamental"))} color="#2563eb">Gerar turmas — Primário/Iº Ciclo</Btn>
                         <Btn onClick={() => withLoading(() => gerarTurmas("medio"))} color="#b45309" disabled={cursosParaTurma.length === 0}>Gerar turmas Médio</Btn>
                       </>
                     ) : (
@@ -2325,7 +2325,7 @@ export default function PageContent() {
                               cursor: "pointer",
                             }}
                           >
-                            {nivel.replace(/_ano_fundamental$/, "º Fundamental").replace(/_ano_medio$/, "º Médio").replace(/_ano_superior$/, "º Superior")}
+                            {nivel.replace(/_ano_fundamental$/, "ª Classe").replace(/_ano_medio$/, "º Médio").replace(/_ano_superior$/, "º Superior")}
                           </button>
                         ))}
                       </div>
@@ -2360,14 +2360,14 @@ export default function PageContent() {
               </Row>
 
               {(modo === "fundamental" || modo === "misto") && (
-                <SubSection title="Ensino Fundamental">
+                <SubSection title="Ensino Primário e Iº Ciclo">
                   <Row>
                     <Field label="Ano escolar">
                       <Sel value={estudanteConfig.anoFundamental}
                         onChange={e => setEstudanteConfig(p => ({ ...p, anoFundamental: e.target.value }))}>
                         <option value="random">Aleatório</option>
                         {anosDispFundamental.map(a => (
-                          <option key={a} value={a}>{a.replace(/_ano_fundamental$/, "º Fundamental")}</option>
+                          <option key={a} value={a}>{a.replace(/_ano_fundamental$/, "ª Classe")}</option>
                         ))}
                       </Sel>
                     </Field>
@@ -2381,7 +2381,7 @@ export default function PageContent() {
                               onClick={() => setEstudanteConfig(p => ({ ...p, anosFundamentalSelecionados: toggleSelecionado(p.anosFundamentalSelecionados, a) }))}
                               style={{ border: "1px solid #334155", background: estudanteConfig.anosFundamentalSelecionados.includes(a) ? "#0f766e" : "#1e293b", color: "#e2e8f0", borderRadius: 999, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}
                             >
-                              {a.replace(/_ano_fundamental$/, "º Fundamental")}
+                              {a.replace(/_ano_fundamental$/, "ª Classe")}
                             </button>
                           ))}
                         </div>
@@ -2484,11 +2484,11 @@ export default function PageContent() {
               {modo === "misto" && (
                 <SubSection title="Geração separada — escola mista">
                   <p style={{ margin: "0 0 10px", fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
-                    Para não misturar níveis, cada clique cria apenas estudantes do Fundamental ou apenas do Médio usando as configurações acima.
+                    Para não misturar níveis, cada clique cria apenas estudantes do Ensino Primário e Iº Ciclo ou apenas do Médio usando as configurações acima.
                   </p>
                   <Row>
                     <Btn onClick={() => withLoading(() => gerarEstudantes("fundamental"))} color="#2563eb" disabled={anosDispFundamental.length === 0}>
-                      Criar {estudanteConfig.qtd} Fundamental
+                      Criar {estudanteConfig.qtd} Primário/Iº Ciclo
                     </Btn>
                     <Btn onClick={() => withLoading(() => gerarEstudantes("medio"))} color="#b45309" disabled={cursosMedioAtivos.length === 0}>
                       Criar {estudanteConfig.qtd} Médio
```

---

## Validação (rode nesta ordem)

```bash
npm install
npx tsc --noEmit
npx eslint .
```

O `tsc --noEmit` deve terminar **sem nenhuma saída** (sucesso silencioso). O `eslint .` deve reportar apenas os warnings pré-existentes listados na seção "Antes de começar" acima, em arquivos que esta tarefa não toca — se aparecer qualquer erro/warning **novo** num arquivo desta lista de mudanças, pare e revise o passo correspondente.

## O que NÃO fazer

- Não commite `package-lock.json` nem `yarn.lock` só por causa de um `npm install` de validação — esses arquivos não fazem parte desta mudança (só foram regenerados localmente por quem validou esta tarefa, ao instalar dependências para rodar `tsc`/`eslint`).
- Não mexa nos 8 arquivos listados na seção "Antes de começar" (avisos pré-existentes do eslint) — não fazem parte desta tarefa.
- Não crie uma rota nova para o formulário de "Adicionar documento" em configurações de matrícula — é uma subtela dentro da mesma página (`view: "lista" | "form"`), não uma navegação.
- Não altere os valores internos (`"fundamental"`, `"medio"`, `"superior"`) usados como `value` de opções, chaves de estado, ou parâmetros passados a funções — só o texto exibido ao usuário. Trocar o valor interno quebraria a compatibilidade com o backend e com dados já salvos.
- Na página de testes (`testes/PageContent.tsx`), não expanda o escopo além dos textos visíveis já listados no diff — o resto do arquivo (2500+ linhas) é uma ferramenta de dev fora do escopo desta tarefa.

## Checklist de aceitação

- [ ] `src/types/api.ts`: `DocumentoExtra.anos_academicos` e `DocumentoExtraPayload.anos_academicos` existem (arrays); `nivel`/`ano_academico` singulares não existem mais nesses dois tipos.
- [ ] `src/lib/api/services.ts`: `academiaService.listarDocumentosExtraDisponiveis` existe, aponta para `/academia/documento/:codigo_academia/documentos-extra`.
- [ ] `/configuracoes/matricula`: "Adicionar documento" abre uma subtela (não modal); checkbox "Obrigatório" usa o componente `Checkbox`; "Ano acadêmico" é multi-select em botões, com secções "Ensino Primário e Iº Ciclo", "Ensino Médio" e (quando aplicável) "Ensino Superior".
- [ ] `CadastroSingularForm.tsx`: filtro de documentos extra usa `anos_academicos.includes(...)`.
- [ ] `/matricula`: nenhuma etapa mostra mais "Ano Fundamental" como texto — a 1ª Classe aparece como "1ª Classe" em todo lugar (resumo final, mensagens de ajuda, título da etapa de documentos).
- [ ] `/matricula`: a consulta de documentos extra usa `listarDocumentosExtraDisponiveis` (rota pública), não `listarDocumentosExtra` (autenticada).
- [ ] `/matricula`: quando a academia/ano escolhido tem documentos extra, aparece uma etapa própria "Documentos extra" entre "4. Telefone e email" e a etapa final; quando não tem, o fluxo continua com 5 passos, idêntico ao atual.
- [ ] `/matricula`: a etapa final se chama "5. Solicitar matrícula" quando não há etapa de documentos extra, e "6. Solicitar matrícula" quando há.
- [ ] `AvaliacaoFinalRulesSection.tsx`, `EstudantesVistaEscalaAdmin.tsx`, `PainelDashboard.tsx`, `testes/PageContent.tsx`: nenhum texto visível usa mais "Fundamental" isolado — usam "Ensino Primário e Iº Ciclo" (ou "Primário/Iº Ciclo" na ferramenta de testes, por brevidade).
- [ ] `npx tsc --noEmit` sem erros.
- [ ] `npx eslint .` sem erros/warnings novos nos arquivos desta tarefa.

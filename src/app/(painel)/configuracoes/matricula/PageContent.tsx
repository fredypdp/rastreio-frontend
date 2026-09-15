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
import { Icon } from "@iconify/react";

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
        <PageBreadcrumb pageTitle="Configurações de matrícula" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <Button className="mb-5" variant="outline" size="sm" onClick={voltarParaLista} disabled={saving} startIcon={<Icon icon="mdi:arrow-left" width={16} />}>
            Voltar
          </Button>
          <PageHeading>{editing ? "Editar documento" : "Novo documento"}</PageHeading>
          <PageDescription>Configure o documento adicional exigido — ou apenas oferecido — no cadastro e na matrícula.</PageDescription>
          {erro && <Alert variant="error" title="Configurações de matrícula" message={erro} />}

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
      <PageBreadcrumb pageTitle="Configurações de matrícula" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Configurações de matrícula</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure os documentos extra solicitados por ano acadêmico.</p>
          </div>
          <Button onClick={() => abrir()}>Adicionar documento</Button>
        </div>
        {erro && <Alert variant="error" title="Configurações de matrícula" message={erro} />}
        {loading ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">Carregando documentos...</p>
        ) : docs.length === 0 ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">Nenhum documento extra configurado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm text-gray-700 dark:text-gray-300">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Rótulo</th>
                  <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Tipo</th>
                  <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Anos acadêmicos</th>
                  <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Obrigatório</th>
                  <th className="p-3 font-medium text-gray-600 dark:text-gray-300">Estado</th>
                  <th className="p-3 text-right font-medium text-gray-600 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-3 font-medium text-gray-800 dark:text-white/90">{d.rotulo}</td>
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
                      <button onClick={() => abrir(d)} className="mr-3 text-brand-600 dark:text-brand-400">Editar</button>
                      <button onClick={() => toggleAtivo(d)} className={d.ativo ? "text-error-600 dark:text-error-400" : "text-success-600 dark:text-success-400"}>
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

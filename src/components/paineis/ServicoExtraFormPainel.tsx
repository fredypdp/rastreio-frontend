"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { academiaService, useApi } from "@/lib/api";
import { formatApiError, ApiError } from "@/lib/api/client";
import { useUserCookie } from "@/hooks/useUserCookie";
import type {
  DetalhePersonalizado,
  MetodoPagamentoServico,
  ServicoExtra,
  ServicoExtraPayload,
  TipoCobrancaServico,
  TipoDetalhePersonalizado,
} from "@/types/api";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import SearchableSelect from "@/components/form/SearchableSelect";
import { Modal } from "@/components/ui/modal";
import { PageHeading, Section, SectionTitle, SectionDescription } from "@/components/ui/typography/Typography";
import { METODO_PAGAMENTO_LABEL } from "@/components/paineis/financeiroShared";
import { LoadingState } from "@/components/paineis/financeiroShared";

const tipos: [TipoDetalhePersonalizado, string][] = [
  ["texto", "Texto"],
  ["numero", "Número"],
  ["booleano", "Sim / Não"],
  ["data", "Data"],
  ["hora", "Hora"],
  ["lista_texto", "Lista de textos"],
];
const pay: MetodoPagamentoServico[] = ["GPO", "REF", "GPO_QR"];

// Mesma lista/rótulos de src/components/paineis/MateriaPainel.tsx — mantenha
// os dois em sincronia se a numeração de anos do fundamental mudar.
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

const formatarAnoLabel = (ano: string) =>
  ano.replace(/^(\d+)_ano_(.+)$/, (_, n, tipo) =>
    tipo === "fundamental" ? `${n}ª Classe` : `${n}º Ano ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`
  );

const slugify = (r: string, ks: string[]) => {
  const b = r.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50) || "campo";
  const c = /^[a-z]/.test(b) ? b : `campo_${b}`;
  let x = c, i = 2;
  while (ks.includes(x)) x = `${c}_${i++}`;
  return x;
};
const padrao = (t: TipoDetalhePersonalizado): DetalhePersonalizado["valor"] =>
  t === "numero" ? 0 : t === "booleano" ? false : t === "lista_texto" ? [] : "";

type Form = {
  nome: string; descricao: string; categoriaServicoId: string | null; pago: boolean; preco: string;
  tipo: TipoCobrancaServico; metodos: MetodoPagamentoServico[]; taxa: boolean; valorTaxa: string;
  metodosTaxa: MetodoPagamentoServico[]; anosAcademicos: string[]; cursosDisponiveis: string[];
  documento: boolean; instrucoes: string; detalhesPersonalizados: Record<string, DetalhePersonalizado>;
};
const vazio: Form = {
  nome: "", descricao: "", categoriaServicoId: null, pago: false, preco: "", tipo: "unico",
  metodos: [], taxa: false, valorTaxa: "", metodosTaxa: [], anosAcademicos: [], cursosDisponiveis: [],
  documento: false, instrucoes: "", detalhesPersonalizados: {},
};
const paraForm = (s: ServicoExtra): Form => ({
  ...vazio,
  nome: s.nome,
  descricao: s.descricao ?? "",
  categoriaServicoId: s.categoria_servico_id ?? null,
  pago: s.pago,
  preco: s.preco?.toString() ?? "",
  tipo: s.tipo_cobranca ?? "unico",
  metodos: s.metodos_pagamento,
  taxa: s.tem_taxa_inscricao,
  valorTaxa: s.valor_taxa_inscricao?.toString() ?? "",
  metodosTaxa: s.metodos_pagamento_taxa_inscricao,
  anosAcademicos: s.anos_academicos_disponiveis ?? [],
  cursosDisponiveis: s.cursos_disponiveis ?? [],
  documento: s.documento_obrigatorio,
  instrucoes: s.documento_instrucoes ?? "",
  detalhesPersonalizados: s.detalhes_personalizados ?? {},
});
const valor = (f: Form): ServicoExtraPayload => ({
  nome: f.nome.trim(),
  descricao: f.descricao || undefined,
  categoria_servico_id: f.categoriaServicoId,
  pago: f.pago,
  preco: f.pago ? Number(f.preco) : undefined,
  tipo_cobranca: f.pago ? f.tipo : undefined,
  metodos_pagamento: f.pago ? f.metodos : [],
  tem_taxa_inscricao: f.taxa,
  valor_taxa_inscricao: f.taxa ? Number(f.valorTaxa) : undefined,
  metodos_pagamento_taxa_inscricao: f.taxa ? f.metodosTaxa : [],
  // Sempre presentes (mesmo []): o backend só atualiza o que vier no JSON da
  // requisição (partial update). Se estes campos forem omitidos ao editar,
  // uma restrição de anos/cursos já salva nunca poderia ser removida pela
  // UI — precisam ir sempre, mesmo vazios, para "limpar tudo" funcionar.
  anos_academicos_disponiveis: f.anosAcademicos,
  cursos_disponiveis: f.cursosDisponiveis,
  documento_obrigatorio: f.documento,
  documento_instrucoes: f.documento ? f.instrucoes : undefined,
  detalhes_personalizados: f.detalhesPersonalizados,
});

/**
 * Tarefa 14: o booleano (sim/não) de uma personalização usava um único
 * Checkbox cujo RÓTULO mudava de texto ("Sim"/"Não") conforme o estado —
 * confuso, porque a única pista visual de qual opção está selecionada é a
 * caixinha marcada/desmarcada por trás de um texto que também muda. Virou
 * duas opções lado a lado (mesmo padrão visual de botão-pílula já usado
 * mais abaixo neste arquivo para anos/classes — ver `botaoOpcaoClasse`),
 * só uma selecionável por vez — igual ao pedido do usuário.
 */
function BooleanoField({ valor, onChange }: { valor: boolean; onChange: (v: boolean) => void }) {
  const opcaoClasse = (ativo: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
      ativo
        ? "bg-brand-500 text-white border-brand-500"
        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-400"
    }`;
  return (
    <div className="flex gap-2" role="radiogroup">
      <button type="button" role="radio" aria-checked={valor} className={opcaoClasse(valor)} onClick={() => onChange(true)}>Sim</button>
      <button type="button" role="radio" aria-checked={!valor} className={opcaoClasse(!valor)} onClick={() => onChange(false)}>Não</button>
    </div>
  );
}

function Builder({ value, onChange }: { value: Record<string, DetalhePersonalizado>; onChange: (v: Record<string, DetalhePersonalizado>) => void }) {
  const upd = (k: string, p: Partial<DetalhePersonalizado>) => onChange({ ...value, [k]: { ...value[k], ...p } });
  return (
    <div className="space-y-3">
      {Object.entries(value).map(([k, d]) => (
        <div key={k} className="grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-[1fr_140px_1fr_auto] dark:bg-gray-800">
          <Input value={d.rotulo} onChange={e => upd(k, { rotulo: e.target.value })} placeholder="Rótulo" />
          <SearchableSelect
            value={d.tipo}
            onChange={v => {
              const tipo = (v || "texto") as TipoDetalhePersonalizado;
              upd(k, { tipo, valor: padrao(tipo) });
            }}
            options={tipos.map(([v, l]) => ({ value: v, label: l }))}
            isClearable={false}
            isSearchable={false}
          />
          {d.tipo === "booleano" ? (
            <BooleanoField valor={!!d.valor} onChange={v => upd(k, { valor: v })} />
          ) : d.tipo === "lista_texto" ? (
            <Input
              value={(d.valor as string[]).join(", ")}
              onChange={e => upd(k, { valor: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })}
              placeholder="Itens separados por vírgula"
            />
          ) : (
            <Input
              type={d.tipo === "numero" ? "number" : d.tipo === "data" ? "date" : d.tipo === "hora" ? "time" : "text"}
              value={String(d.valor)}
              onChange={e => upd(k, { valor: d.tipo === "numero" ? Number(e.target.value) : e.target.value })}
            />
          )}
          <button type="button" className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" onClick={() => { const { [k]: _, ...r } = value; onChange(r); }}>✕</button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => { const k = slugify("novo_campo", Object.keys(value)); onChange({ ...value, [k]: { rotulo: "", tipo: "texto", valor: "" } }); }}>
        + Adicionar personalização
      </Button>
    </div>
  );
}

/**
 * /servicos-extras/gerenciar-servicos/criar e .../editar/[id] (Tarefa 14).
 * Antes este formulário inteiro vivia embutido em ServicosExtrasPainel.tsx,
 * ativado por um estado local (`view === "form"`). Agora tem rota própria
 * — este componente serve as duas (criação e edição, dependendo se
 * `servicoId` foi passado) para não duplicar o formulário inteiro duas
 * vezes.
 *
 * Tarefa 15: a edição buscava a lista inteira e filtrava pelo id no
 * cliente, porque na Tarefa 14 não existia nenhuma chamada mais
 * específica disponível — só que, nesse caso, o endpoint específico já
 * existia (`GET /academia/servicos-extras/:id`, `getServicoExtra`), só não
 * tinha sido usado. A edição agora busca só o serviço em questão.
 */
export default function ServicoExtraFormPainel({ servicoId }: { servicoId?: string }) {
  const router = useRouter();
  const obterServico = useApi(academiaService.getServicoExtra);
  const cats = useApi(academiaService.listarCategoriasServico);
  const cursosApi = useApi(academiaService.listarCursos);
  const criar = useApi(academiaService.criarServicoExtra);
  const atualizar = useApi(academiaService.atualizarServicoExtra);
  const nova = useApi(academiaService.criarCategoriaServico);
  const { user } = useUserCookie();

  const [form, setForm] = useState(vazio);
  const [carregandoServico, setCarregandoServico] = useState(!!servicoId);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [nomeCat, setNomeCat] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState("");

  useEffect(() => {
    cats.execute();
    cursosApi.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!servicoId) return;
    obterServico.execute(servicoId)
      .then((r) => {
        if (r?.data) setForm(paraForm(r.data));
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) return setNaoEncontrado(true);
        setAlert(formatApiError(e, "Não foi possível carregar o serviço."));
      })
      .finally(() => setCarregandoServico(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicoId]);

  const set = (x: Partial<Form>) => setForm(p => ({ ...p, ...x }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !Object.values(form.detalhesPersonalizados).every(d => d.rotulo.trim())) {
      return setAlert("Informe o nome e o rótulo de todas as personalizações.");
    }
    if (form.pago && form.metodos.length === 0) {
      return setAlert("Selecione ao menos um método de pagamento aceite para o serviço.");
    }
    if (form.taxa && form.metodosTaxa.length === 0) {
      return setAlert("Selecione ao menos um método de pagamento aceite para a taxa de inscrição.");
    }
    try {
      servicoId ? await atualizar.execute(servicoId, valor(form)) : await criar.execute(valor(form));
      router.push("/servicos-extras/gerenciar-servicos");
    } catch (e) {
      setAlert(formatApiError(e, "Não foi possível salvar."));
    }
  };

  const options = (cats.data?.categorias_servico ?? []).filter(c => c.ativo || c.id === form.categoriaServicoId).map(c => ({ value: c.id, label: c.nome }));

  const todosCursos = cursosApi.data?.cursos ?? [];
  const cursosAtivos = todosCursos.filter(c => c.status === "ativo");
  const nomeCurso = (id: string) => todosCursos.find(c => c.id === id)?.nome ?? id;
  const cursoEmEdicao = cursosAtivos.find(c => c.id === cursoSelecionado);

  const anosFundamentalDisponiveis = user?.academia?.anos_academicos?.filter(a => a.endsWith("_ano_fundamental")) ?? [];
  const anosFundamentalOpcoes = ANOS_FUNDAMENTAL.filter(a => anosFundamentalDisponiveis.includes(a.value));

  const toggleAnoFundamental = (ano: string) => {
    set({ anosAcademicos: form.anosAcademicos.includes(ano) ? form.anosAcademicos.filter(v => v !== ano) : [...form.anosAcademicos, ano] });
  };
  const toggleCursoAno = (cursoId: string, ano: string) => {
    const chave = `${cursoId}|${ano}`;
    set({ cursosDisponiveis: form.cursosDisponiveis.includes(chave) ? form.cursosDisponiveis.filter(v => v !== chave) : [...form.cursosDisponiveis, chave] });
  };
  const removerCursoAno = (chave: string) => set({ cursosDisponiveis: form.cursosDisponiveis.filter(v => v !== chave) });

  const botaoAnoClasse = (ativo: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
      ativo
        ? "bg-brand-500 text-white border-brand-500"
        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-400"
    }`;

  if (carregandoServico) return <LoadingState label="Carregando serviço..." />;
  if (naoEncontrado) return <Alert variant="error" title="Serviços extras" message="Serviço não encontrado." />;

  return (
    <div className="space-y-5">
      <PageHeading>{servicoId ? "Editar Serviço" : "Novo Serviço"}</PageHeading>
      {alert && <Alert variant="error" title="Serviços extras" message={alert} />}
      <form className="max-w-3xl space-y-5" onSubmit={salvar}>
        <Section>
          <SectionTitle>Informações básicas</SectionTitle>
          <SectionDescription>Identifique e descreva o serviço.</SectionDescription>
          <Input value={form.nome} onChange={e => set({ nome: e.target.value })} placeholder="Nome" />
          <SearchableSelect options={options} value={form.categoriaServicoId} onChange={v => set({ categoriaServicoId: v || null })} placeholder="Categoria" isClearable />
          <button type="button" className="text-sm text-brand-600 dark:text-brand-400" onClick={() => setModal(true)}>+ Nova categoria</button>
          <TextArea value={form.descricao} onChange={descricao => set({ descricao })} placeholder="Descrição" />
        </Section>

        <Section>
          <Checkbox label="Serviço pago" checked={form.pago} onChange={pago => set({ pago })} />
          {form.pago && (
            <>
              <Input type="number" value={form.preco} onChange={e => set({ preco: e.target.value })} placeholder="Preço" />
              <SearchableSelect
                value={form.tipo}
                onChange={v => set({ tipo: (v || "unico") as TipoCobrancaServico })}
                options={[{ value: "unico", label: "Único" }, { value: "mensal", label: "Mensal" }]}
                isClearable={false}
                isSearchable={false}
              />
              <SectionDescription>Métodos de pagamento aceites para este serviço</SectionDescription>
              <div className="flex flex-wrap gap-4">
                {pay.map(m => (
                  <Checkbox
                    key={m}
                    label={METODO_PAGAMENTO_LABEL[m]}
                    checked={form.metodos.includes(m)}
                    onChange={() => set({ metodos: form.metodos.includes(m) ? form.metodos.filter(x => x !== m) : [...form.metodos, m] })}
                  />
                ))}
              </div>
            </>
          )}
        </Section>

        <Section>
          <Checkbox label="Tem taxa de inscrição" checked={form.taxa} onChange={taxa => set({ taxa })} />
          {form.taxa && (
            <>
              <Input type="number" value={form.valorTaxa} onChange={e => set({ valorTaxa: e.target.value })} placeholder="Valor da taxa" />
              <SectionDescription>Métodos de pagamento aceites para a taxa de inscrição</SectionDescription>
              <div className="flex flex-wrap gap-4">
                {pay.map(m => (
                  <Checkbox
                    key={m}
                    label={METODO_PAGAMENTO_LABEL[m]}
                    checked={form.metodosTaxa.includes(m)}
                    onChange={() => set({ metodosTaxa: form.metodosTaxa.includes(m) ? form.metodosTaxa.filter(x => x !== m) : [...form.metodosTaxa, m] })}
                  />
                ))}
              </div>
            </>
          )}
        </Section>

        <Section>
          <SectionTitle>Disponibilidade</SectionTitle>
          <SectionDescription>Escolha para quais anos/cursos este serviço fica disponível. Nada selecionado = disponível para todos os estudantes.</SectionDescription>

          {anosFundamentalOpcoes.length > 0 && (
            <div className="space-y-2">
              <SectionTitle>Ensino Primário e Iº Ciclo</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {anosFundamentalOpcoes.map(a => (
                  <button key={a.value} type="button" onClick={() => toggleAnoFundamental(a.value)} className={botaoAnoClasse(form.anosAcademicos.includes(a.value))}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {cursosAtivos.length > 0 && (
            <div className="space-y-2">
              <SectionTitle>Cursos (Médio / Superior)</SectionTitle>
              <SearchableSelect
                value={cursoSelecionado}
                onChange={v => setCursoSelecionado(v || "")}
                options={[{ value: "", label: "Selecione um curso para adicionar anos" }, ...cursosAtivos.map(c => ({ value: c.id, label: c.nome }))]}
                isClearable={false}
              />
              {cursoEmEdicao && (
                <div className="flex flex-wrap gap-2">
                  {cursoEmEdicao.anos_academicos.map(ano => (
                    <button key={ano} type="button" onClick={() => toggleCursoAno(cursoEmEdicao.id, ano)} className={botaoAnoClasse(form.cursosDisponiveis.includes(`${cursoEmEdicao.id}|${ano}`))}>
                      {formatarAnoLabel(ano)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.cursosDisponiveis.length > 0 && (
            <div className="space-y-1">
              <SectionDescription>Anos de curso selecionados:</SectionDescription>
              <div className="flex flex-wrap gap-2">
                {form.cursosDisponiveis.map(chave => {
                  const [cursoId, ano] = chave.split("|");
                  return (
                    <span key={chave} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {nomeCurso(cursoId)} · {formatarAnoLabel(ano)}
                      <button type="button" onClick={() => removerCursoAno(chave)} className="text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-white" title="Remover">✕</button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {anosFundamentalOpcoes.length === 0 && cursosAtivos.length === 0 && (
            <SectionDescription>Nenhum ano acadêmico ou curso configurado ainda — configure em Gerenciamento antes de restringir a disponibilidade.</SectionDescription>
          )}
        </Section>

        <Section>
          <Checkbox label="Exige documento anexado na inscrição" checked={form.documento} onChange={documento => set({ documento })} />
          {form.documento && <TextArea value={form.instrucoes} onChange={instrucoes => set({ instrucoes })} placeholder="Instruções" />}
        </Section>

        <Section>
          <SectionTitle>Personalização adicional</SectionTitle>
          <SectionDescription>Adicione informações específicas deste serviço.</SectionDescription>
          <Builder value={form.detalhesPersonalizados} onChange={detalhesPersonalizados => set({ detalhesPersonalizados })} />
        </Section>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/servicos-extras/gerenciar-servicos")}>Cancelar</Button>
          <Button disabled={criar.loading || atualizar.loading}>{criar.loading || atualizar.loading ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>

      <Modal isOpen={modal} onClose={() => setModal(false)} className="max-w-md p-6">
        <Input value={nomeCat} onChange={e => setNomeCat(e.target.value)} placeholder="Nome da categoria" />
        <Button
          className="mt-3"
          onClick={async () => {
            try {
              const r = await nova.execute({ nome: nomeCat });
              if (r?.data) set({ categoriaServicoId: r.data.id });
              setModal(false);
              setNomeCat("");
              cats.execute();
            } catch (e) {
              setAlert(formatApiError(e, "Não foi possível criar a categoria."));
            }
          }}
        >
          Salvar categoria
        </Button>
      </Modal>
    </div>
  );
}

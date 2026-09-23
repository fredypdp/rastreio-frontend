"use client";

import { useEffect, useState } from "react";
import { estudanteService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserCookie } from "@/hooks/useUserCookie";
import type { CategoriaServico, DetalhePersonalizado, ServicoExtra } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import Icon from "@/components/ui/Icon";

const formatarDetalhe = (d: DetalhePersonalizado) =>
  d.tipo === "booleano" ? (d.valor ? "Sim" : "Não")
    : d.tipo === "data" && d.valor ? new Intl.DateTimeFormat("pt-PT").format(new Date(`${d.valor}T00:00:00`))
    : Array.isArray(d.valor) ? d.valor.join(", ")
    : String(d.valor);

/**
 * /servicos-extras/catalogo (Tarefa 18) — catálogo de serviços extras que
 * o estudante pode solicitar. Reescrito por completo; tinha três problemas:
 * 1) usava duas chamadas em paralelo sem tratamento de erro
 *    (estudanteService.listarServicosExtrasDisponiveis, rota pública sem
 *    filtro de elegibilidade, + academiaService.listarCategoriasServico,
 *    que exige academia/admin e por isso sempre rejeitava o estudante com
 *    403) — qualquer uma das duas falhando derrubava a tela inteira em
 *    silêncio, sem mostrar nada;
 * 2) faltava suporte a tema escuro em boa parte das classes (borda do
 *    card, badge de categoria, textos);
 * 3) o botão "Solicitar inscrição" não tinha nenhuma ação — a função que já
 *    existe para isso (estudanteService.solicitarServicoExtra) nunca era
 *    chamada em lugar nenhum do app.
 * Corrigido usando o endpoint novo do backend
 * (estudanteService.listarCatalogoServicosExtras — já filtrado pela
 * elegibilidade do estudante e já traz as categorias resolvidas), dark
 * mode em todo o componente, e o fluxo de solicitação (com upload de PDF
 * quando o serviço exige documento).
 */
export default function ServicosExtrasCatalogoPainel() {
  const { loading: carregandoUsuario } = useUserCookie();
  const [servicos, setServicos] = useState<ServicoExtra[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Record<string, true>>({});
  const [documentos, setDocumentos] = useState<Record<string, File | undefined>>({});

  const carregar = () => {
    setCarregando(true);
    setErro(null);
    estudanteService.listarCatalogoServicosExtras()
      .then((r) => { setServicos(r.servicos_extras); setCategorias(r.categorias_servico); })
      .catch((e) => setErro(formatApiError(e, "Não foi possível carregar o catálogo de serviços extras.")))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    if (!carregandoUsuario) carregar();
  }, [carregandoUsuario]);

  const solicitar = async (servico: ServicoExtra) => {
    if (servico.documento_obrigatorio && !documentos[servico.id]) {
      setErro(`Anexe o documento exigido antes de solicitar "${servico.nome}".`);
      return;
    }
    setEnviando(servico.id);
    setErro(null);
    try {
      await estudanteService.solicitarServicoExtra(servico.id, { documento: documentos[servico.id] });
      setEnviados((prev) => ({ ...prev, [servico.id]: true }));
    } catch (e) {
      setErro(formatApiError(e, `Não foi possível enviar a solicitação de "${servico.nome}".`));
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Catálogo de Serviços Extras</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Serviços disponíveis para o seu ano/curso atual.</p>
      </div>

      {erro && <Alert variant="error" title="Catálogo" message={erro} />}

      {carregando || carregandoUsuario ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p>
      ) : servicos.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
          Nenhum serviço extra disponível para o seu ano/curso no momento.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {servicos.map((s) => {
            const categoria = s.categoria_servico_id ? categorias.find((c) => c.id === s.categoria_servico_id)?.nome : undefined;
            const detalhes = Object.entries(s.detalhes_personalizados ?? {});
            const jaEnviado = enviados[s.id];
            return (
              <article key={s.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-800 dark:text-white/90">{s.nome}</h2>
                  {categoria && <Badge size="sm" color="primary">{categoria}</Badge>}
                </div>
                {s.descricao && <p className="text-sm text-gray-600 dark:text-gray-300">{s.descricao}</p>}
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{s.pago ? `${s.preco} Kz` : "Gratuito"}</p>
                {detalhes.length > 0 && (
                  <dl className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {detalhes.map(([k, d]) => (
                      <div key={k}><dt className="inline font-medium text-gray-700 dark:text-gray-200">{d.rotulo}: </dt><dd className="inline">{formatarDetalhe(d)}</dd></div>
                    ))}
                  </dl>
                )}
                {s.documento_obrigatorio && !jaEnviado && (
                  <div className="space-y-1">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400">
                      <Icon icon="mdi:paperclip" width={14} />
                      {documentos[s.id] ? documentos[s.id]!.name : "Anexar documento (PDF)"}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; setDocumentos((prev) => ({ ...prev, [s.id]: f })); }}
                      />
                    </label>
                    {s.documento_instrucoes && <p className="text-xs text-gray-500 dark:text-gray-400">{s.documento_instrucoes}</p>}
                  </div>
                )}
                <div className="mt-auto pt-1">
                  {jaEnviado ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-success-600 dark:text-success-500">
                      <Icon icon="mdi:check-circle-outline" width={16} /> Solicitação enviada — acompanhe em &quot;Minhas Inscrições&quot;.
                    </p>
                  ) : (
                    <Button size="sm" onClick={() => solicitar(s)} disabled={enviando === s.id}>
                      {enviando === s.id ? "Enviando..." : "Solicitar inscrição"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

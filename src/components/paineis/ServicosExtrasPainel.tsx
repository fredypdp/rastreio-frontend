"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { academiaService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import type { ServicoExtra, DetalhePersonalizado } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { PageHeading, PageDescription } from "@/components/ui/typography/Typography";
import { METODO_PAGAMENTO_LABEL, ConfirmDialog } from "@/components/paineis/financeiroShared";
import { formatarDataHora } from "@/components/paineis/financeiroNivelShared";

const formatarAnoLabel = (ano: string) =>
  ano.replace(/^(\d+)_ano_(.+)$/, (_, n, tipo) =>
    tipo === "fundamental" ? `${n}ª Classe` : `${n}º Ano ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`
  );

/** cursos_disponiveis guarda pares "cursoId|ano" (ver ServicoExtraFormPainel.tsx)
 * — aqui só precisamos do número do ano, já que o nome do curso ao lado já
 * deixa claro se é médio ou superior. */
const formatarAnoCurso = (ano: string) => ano.replace(/^(\d+)_ano_.+$/, (_, n) => `${n}º Ano`);

/** Agrupa cursos_disponiveis ("cursoId|ano") por curso, juntando todos os
 * anos daquele curso numa lista só — assim um curso com vários anos
 * selecionados vira um badge só ("Nome do curso - 1º Ano, 2º Ano"), em vez
 * de um badge por combinação curso+ano. */
const agruparCursosDisponiveis = (cursosDisponiveis: string[]): { cursoId: string; anos: string[] }[] => {
  const porCurso: Record<string, string[]> = {};
  const ordem: string[] = [];
  cursosDisponiveis.forEach((chave) => {
    const [cursoId, ano] = chave.split("|");
    if (!porCurso[cursoId]) { porCurso[cursoId] = []; ordem.push(cursoId); }
    porCurso[cursoId].push(formatarAnoCurso(ano));
  });
  return ordem.map((cursoId) => ({ cursoId, anos: porCurso[cursoId] }));
};

/** Personalizações booleanas guardavam true/false cru na tela; ver também
 * o mesmo tratamento em ServicosExtrasCatalogoPainel.tsx (tela do estudante). */
const formatarValorPersonalizado = (d: DetalhePersonalizado) =>
  d.tipo === "booleano" ? (d.valor ? "Sim" : "Não") : Array.isArray(d.valor) ? d.valor.join(", ") : String(d.valor);

/**
 * /servicos-extras/gerenciar-servicos (Tarefa 14). Antes esta mesma tela
 * também continha o formulário inteiro de criação/edição, ativado por um
 * estado local (`view === "form"`) — o formulário agora vive em rota
 * própria (ver ServicoExtraFormPainel.tsx, /criar e /editar/[id]) e esta
 * tela ficou só a listagem: colunas "Criado em"/"Editado em" adicionadas,
 * e um botão "Ver mais" por linha abre uma subtela com todas as
 * informações do serviço, de onde "Editar" e "Excluir" passaram a ser
 * acionados (Desativar/Reativar continuam na linha, por serem ações
 * rápidas e reversíveis).
 */
export default function ServicosExtrasPainel() {
  const lista = useApi(academiaService.listarServicosExtras);
  const cats = useApi(academiaService.listarCategoriasServico);
  const cursosApi = useApi(academiaService.listarCursos);
  const desativarServico = useApi(academiaService.desativarServicoExtra);
  const reativarServico = useApi(academiaService.reativarServicoExtra);
  const deletarServico = useApi(academiaService.deletarServicoExtra);

  const [alert, setAlert] = useState<string | null>(null);
  const [servicoParaExcluir, setServicoParaExcluir] = useState<ServicoExtra | null>(null);
  const [selecionado, setSelecionado] = useState<ServicoExtra | null>(null);

  const recarregar = () => Promise.all([lista.execute(), cats.execute(), cursosApi.execute()]);
  useEffect(() => { recarregar(); }, []);

  const nomeCurso = (id: string) => (cursosApi.data?.cursos ?? []).find(c => c.id === id)?.nome ?? id;

  /** Ativar/desativar/excluir — mesmo padrão de tratamento de erro de antes, só que sem sair da tela de listagem. */
  const tratarAcaoServico = async (fn: () => Promise<unknown>, fallback: string) => {
    try {
      setAlert(null);
      await fn();
      await lista.execute();
    } catch (e) {
      setAlert(formatApiError(e, fallback));
    }
  };

  const nomeCategoria = (s: ServicoExtra) => cats.data?.categorias_servico.find(c => c.id === s.categoria_servico_id)?.nome ?? "-";

  if (selecionado) {
    return (
      <div className="space-y-5">
        {servicoParaExcluir && (
          <ConfirmDialog
            title="Excluir serviço extra"
            message={`Tem certeza que deseja excluir "${servicoParaExcluir.nome}"? Isto não pode ser desfeito. Só é possível excluir se não houver nenhuma inscrição pendente, aprovada-pendente-de-pagamento ou vinculada neste serviço.`}
            confirmLabel="Excluir"
            onConfirm={async () => {
              await tratarAcaoServico(() => deletarServico.execute(servicoParaExcluir.id), "Não foi possível excluir o serviço.");
              setServicoParaExcluir(null);
              setSelecionado(null);
            }}
            onClose={() => setServicoParaExcluir(null)}
          />
        )}
        <button type="button" onClick={() => setSelecionado(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Icon icon="mdi:arrow-left" width={16} /> Voltar
        </button>
        <div className="max-w-2xl space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{selecionado.nome}</h3>
            {selecionado.descricao && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selecionado.descricao}</p>}
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500 dark:text-gray-400">Categoria</dt><dd className="font-medium text-gray-800 dark:text-white/90">{nomeCategoria(selecionado)}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="font-medium text-gray-800 dark:text-white/90">{selecionado.ativo ? "Ativo" : "Inativo"}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Criado em</dt><dd className="font-medium text-gray-800 dark:text-white/90">{formatarDataHora(selecionado.created_at)}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Editado em</dt><dd className="font-medium text-gray-800 dark:text-white/90">{formatarDataHora(selecionado.updated_at)}</dd></div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Serviço pago</dt>
              <dd className="font-medium text-gray-800 dark:text-white/90">
                {selecionado.pago ? `Sim — ${selecionado.preco} Kz (${selecionado.tipo_cobranca === "mensal" ? "mensal" : "único"}), via ${selecionado.metodos_pagamento.map(m => METODO_PAGAMENTO_LABEL[m]).join(", ") || "nenhum método"}` : "Não"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Taxa de inscrição</dt>
              <dd className="font-medium text-gray-800 dark:text-white/90">
                {selecionado.tem_taxa_inscricao ? `Sim — ${selecionado.valor_taxa_inscricao} Kz, via ${selecionado.metodos_pagamento_taxa_inscricao.map(m => METODO_PAGAMENTO_LABEL[m]).join(", ") || "nenhum método"}` : "Não"}
              </dd>
            </div>
            <div><dt className="text-gray-500 dark:text-gray-400">Exige documento na inscrição</dt><dd className="font-medium text-gray-800 dark:text-white/90">{selecionado.documento_obrigatorio ? "Sim" : "Não"}</dd></div>
          </dl>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Disponibilidade</dt>
            {(selecionado.anos_academicos_disponiveis?.length || selecionado.cursos_disponiveis?.length) ? (
              <div className="mt-2 space-y-3">
                {(selecionado.anos_academicos_disponiveis?.length ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ensino Primário e Iº Ciclo</p>
                    <div className="flex flex-wrap gap-2">
                      {(selecionado.anos_academicos_disponiveis ?? []).map(ano => (
                        <Badge key={ano} size="sm" color="primary">{formatarAnoLabel(ano)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(selecionado.cursos_disponiveis?.length ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cursos</p>
                    <div className="flex flex-wrap gap-2">
                      {agruparCursosDisponiveis(selecionado.cursos_disponiveis ?? []).map(({ cursoId, anos }) => (
                        <Badge key={cursoId} size="sm" color="primary">{nomeCurso(cursoId)} - {anos.join(", ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">Todos os estudantes</p>
            )}
          </div>
          {Object.keys(selecionado.detalhes_personalizados ?? {}).length > 0 && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Personalizações</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {Object.values(selecionado.detalhes_personalizados ?? {}).map((d, i) => (
                  <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {d.rotulo}: {formatarValorPersonalizado(d)}
                  </span>
                ))}
              </dd>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/servicos-extras/gerenciar-servicos/editar/${selecionado.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
              <Icon icon="mdi:pencil-outline" width={16} /> Editar
            </Link>
            <Button size="sm" variant="outline" onClick={() => tratarAcaoServico(() => (selecionado.ativo ? desativarServico : reativarServico).execute(selecionado.id), "Não foi possível atualizar o status do serviço.")}>
              {selecionado.ativo ? "Desativar" : "Reativar"}
            </Button>
            {!selecionado.ativo && (
              <Button size="sm" variant="danger" onClick={() => setServicoParaExcluir(selecionado)} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
                Excluir
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeading>Serviços Extras</PageHeading>
          <PageDescription>Gerencie os serviços adicionais.</PageDescription>
        </div>
        <div className="flex gap-2">
          <Link href="/servicos-extras/gerenciar-servicos/criar" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
            <Icon icon="mdi:plus" width={16} /> Novo Serviço
          </Link>
          <Button variant="outline" onClick={() => recarregar()} disabled={lista.loading} startIcon={<Icon icon="mdi:refresh" width={16} />}>
            {lista.loading ? "Consultando..." : "Consultar"}
          </Button>
        </div>
      </div>
      {alert && <Alert variant="error" title="Serviços extras" message={alert} />}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/70">
            <tr>
              {["Nome", "Categoria", "Personalizações", "Status", "Criado em", "Editado em", "Ações", ""].map(x => (
                <th key={x} className="p-3 text-left font-medium text-gray-600 dark:text-gray-400">{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.data?.servicos_extras.map(s => (
              <tr key={s.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3 font-medium text-gray-900 dark:text-white">{s.nome}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{nomeCategoria(s)}</td>
                <td
                  className="p-3 text-gray-500 dark:text-gray-400"
                  title={Object.values(s.detalhes_personalizados ?? {}).map(d => `${d.rotulo}: ${formatarValorPersonalizado(d)}`).join("; ")}
                >
                  {Object.keys(s.detalhes_personalizados ?? {}).length} personalizações
                </td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{s.ativo ? "Ativo" : "Inativo"}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{formatarDataHora(s.created_at)}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{formatarDataHora(s.updated_at)}</td>
                <td className="p-3">
                  <button
                    className="text-brand-600 dark:text-brand-400"
                    onClick={() => tratarAcaoServico(() => (s.ativo ? desativarServico : reativarServico).execute(s.id), "Não foi possível atualizar o status do serviço.")}
                  >
                    {s.ativo ? "Desativar" : "Reativar"}
                  </button>
                </td>
                <td className="p-3">
                  <button className="font-medium text-brand-600 dark:text-brand-400" onClick={() => setSelecionado(s)}>
                    Ver mais
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { academiaService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import type { CategoriaServico } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/alert/Alert";
import { PageHeading, PageDescription } from "@/components/ui/typography/Typography";
import { ConfirmDialog } from "@/components/paineis/financeiroShared";
import { formatarDataHora } from "@/components/paineis/financeiroNivelShared";

/**
 * /servicos-extras/categorias-servico (Tarefa 14). Antes tinha um
 * mini-formulário de criação acima da tabela e edição inline (um campo de
 * texto aparecia dentro da própria linha ao clicar "Editar"). Agora:
 * criação e edição têm rota própria (ver CategoriaServicoFormPainel.tsx),
 * a tabela ganhou as colunas "Criado em"/"Editado em", e um botão "Ver
 * mais" por linha abre uma subtela com todas as informações da categoria
 * — de onde "Editar" e "Excluir" passaram a ser acionados (Desativar/
 * Reativar continuam disponíveis direto na linha, por serem ações rápidas
 * e reversíveis).
 */
export default function CategoriasServicoPainel() {
  const lista = useApi(academiaService.listarCategoriasServico);
  const desativar = useApi(academiaService.desativarCategoriaServico);
  const reativar = useApi(academiaService.reativarCategoriaServico);
  const deletar = useApi(academiaService.deletarCategoriaServico);

  const [erro, setErro] = useState<string | null>(null);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<CategoriaServico | null>(null);
  const [selecionada, setSelecionada] = useState<CategoriaServico | null>(null);

  const recarregar = () => lista.execute();
  useEffect(() => { recarregar(); }, []);

  const tratar = async (fn: () => Promise<unknown>, fallback = "Não foi possível salvar a categoria.") => {
    try {
      setErro(null);
      await fn();
      await recarregar();
    } catch (e) {
      setErro(formatApiError(e, fallback));
    }
  };

  if (selecionada) {
    return (
      <div className="space-y-5">
        {categoriaParaExcluir && (
          <ConfirmDialog
            title="Excluir categoria de serviço"
            message={`Tem certeza que deseja excluir "${categoriaParaExcluir.nome}"? Isto não pode ser desfeito. Só é possível excluir se não houver nenhum serviço vinculado a esta categoria.`}
            confirmLabel="Excluir"
            onConfirm={async () => {
              await tratar(() => deletar.execute(categoriaParaExcluir.id), "Não foi possível excluir a categoria.");
              setCategoriaParaExcluir(null);
              setSelecionada(null);
            }}
            onClose={() => setCategoriaParaExcluir(null)}
          />
        )}
        <button type="button" onClick={() => setSelecionada(null)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <Icon icon="mdi:arrow-left" width={16} /> Voltar
        </button>
        <div className="max-w-lg space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{selecionada.nome}</h3>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="font-medium text-gray-800 dark:text-white/90">{selecionada.ativo ? "Ativo" : "Inativo"}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Criado em</dt><dd className="font-medium text-gray-800 dark:text-white/90">{formatarDataHora(selecionada.created_at)}</dd></div>
            <div><dt className="text-gray-500 dark:text-gray-400">Editado em</dt><dd className="font-medium text-gray-800 dark:text-white/90">{formatarDataHora(selecionada.updated_at)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/servicos-extras/categorias-servico/editar/${selecionada.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
              <Icon icon="mdi:pencil-outline" width={16} /> Editar
            </Link>
            <Button size="sm" variant="outline" onClick={() => tratar(() => (selecionada.ativo ? desativar : reativar).execute(selecionada.id))}>
              {selecionada.ativo ? "Desativar" : "Reativar"}
            </Button>
            {!selecionada.ativo && (
              <Button size="sm" variant="danger" onClick={() => setCategoriaParaExcluir(selecionada)} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
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
          <PageHeading>Categorias de Serviço</PageHeading>
          <PageDescription>Organize os serviços extras da academia.</PageDescription>
        </div>
        <div className="flex gap-2">
          <Link href="/servicos-extras/categorias-servico/criar" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
            <Icon icon="mdi:plus" width={16} /> Adicionar categoria
          </Link>
          <Button variant="outline" onClick={() => recarregar()} disabled={lista.loading} startIcon={<Icon icon="mdi:refresh" width={16} />}>
            {lista.loading ? "Consultando..." : "Consultar"}
          </Button>
        </div>
      </div>

      {erro && <Alert variant="error" title="Categorias" message={erro} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/70">
            <tr>
              {["Nome", "Status", "Criado em", "Editado em", "Ações", ""].map((x) => (
                <th key={x} className="p-3 text-left font-medium text-gray-600 dark:text-gray-400">{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.data?.categorias_servico.map((c) => (
              <tr key={c.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3 font-medium text-gray-900 dark:text-white">{c.nome}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{c.ativo ? "Ativo" : "Inativo"}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{formatarDataHora(c.created_at)}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{formatarDataHora(c.updated_at)}</td>
                <td className="p-3">
                  <button
                    className="text-brand-600 dark:text-brand-400"
                    onClick={() => tratar(() => (c.ativo ? desativar : reativar).execute(c.id))}
                  >
                    {c.ativo ? "Desativar" : "Reativar"}
                  </button>
                </td>
                <td className="p-3">
                  <button className="font-medium text-brand-600 dark:text-brand-400" onClick={() => setSelecionada(c)}>
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

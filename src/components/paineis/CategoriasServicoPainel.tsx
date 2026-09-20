"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { academiaService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import type { CategoriaServico } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { PageHeading, PageDescription } from "@/components/ui/typography/Typography";
import { ConfirmDialog } from "@/components/paineis/financeiroShared";
import { formatarDataHora } from "@/components/paineis/financeiroNivelShared";

/**
 * /servicos-extras/categorias-servico (Tarefa 16). Antes era uma tabela
 * com um botão "Ver mais" por linha, que abria uma subtela só para
 * mostrar status/datas/ações. Convertido para cards em grid: cada
 * categoria já mostra status, datas e ações diretamente no card, então a
 * subtela deixou de ser necessária — criação e edição continuam em rota
 * própria (ver CategoriaServicoFormPainel.tsx, /criar e /editar/[id]).
 */
export default function CategoriasServicoPainel() {
  const lista = useApi(academiaService.listarCategoriasServico);
  const desativar = useApi(academiaService.desativarCategoriaServico);
  const reativar = useApi(academiaService.reativarCategoriaServico);
  const deletar = useApi(academiaService.deletarCategoriaServico);

  const [erro, setErro] = useState<string | null>(null);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<CategoriaServico | null>(null);

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
          }}
          onClose={() => setCategoriaParaExcluir(null)}
        />
      )}
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

      {lista.data && lista.data.categorias_servico.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.data?.categorias_servico.map((c) => (
            <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{c.nome}</h3>
                <Badge size="sm" color={c.ativo ? "success" : "light"}>{c.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <dl className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between gap-2">
                  <dt>Criado em</dt>
                  <dd className="font-medium text-gray-700 dark:text-gray-300">{formatarDataHora(c.created_at)}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Editado em</dt>
                  <dd className="font-medium text-gray-700 dark:text-gray-300">{formatarDataHora(c.updated_at)}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Link href={`/servicos-extras/categorias-servico/editar/${c.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
                  <Icon icon="mdi:pencil-outline" width={14} /> Editar
                </Link>
                <Button size="sm" variant="outline" onClick={() => tratar(() => (c.ativo ? desativar : reativar).execute(c.id))}>
                  {c.ativo ? "Desativar" : "Reativar"}
                </Button>
                {!c.ativo && (
                  <Button size="sm" variant="danger" onClick={() => setCategoriaParaExcluir(c)} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

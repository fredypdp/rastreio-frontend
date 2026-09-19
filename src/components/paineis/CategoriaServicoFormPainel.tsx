"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { academiaService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { PageHeading, PageDescription } from "@/components/ui/typography/Typography";
import { LoadingState } from "@/components/paineis/financeiroShared";

/**
 * Formulário de criação/edição de categoria de serviço (Tarefa 14) — antes
 * ficava embutido na própria tabela de /servicos-extras/categorias-servico
 * (criação como um mini-formulário acima da tabela; edição como um campo
 * de texto que aparecia dentro da própria linha). Agora as duas ações têm
 * rota própria: /categorias-servico/criar e /categorias-servico/editar/[id]
 * — este componente serve as duas, dependendo se `categoriaId` foi
 * passado.
 *
 * Sem endpoint de "buscar uma categoria por id": a edição busca a lista
 * inteira (o mesmo `listarCategoriasServico` que a página de lista já usa)
 * e filtra pelo id — não existe uma chamada mais específica disponível.
 */
export default function CategoriaServicoFormPainel({ categoriaId }: { categoriaId?: string }) {
  const router = useRouter();
  const lista = useApi(academiaService.listarCategoriasServico);
  const criar = useApi(academiaService.criarCategoriaServico);
  const atualizar = useApi(academiaService.atualizarCategoriaServico);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  useEffect(() => {
    if (!categoriaId) return;
    lista.execute().then((r) => {
      const atual = r?.categorias_servico.find((c) => c.id === categoriaId);
      if (!atual) return setNaoEncontrada(true);
      setNome(atual.nome);
    }).catch((e) => setErro(formatApiError(e, "Não foi possível carregar a categoria.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaId]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return setErro("Informe o nome da categoria.");
    setErro(null);
    try {
      if (categoriaId) await atualizar.execute(categoriaId, { nome: nome.trim() });
      else await criar.execute({ nome: nome.trim() });
      router.push("/servicos-extras/categorias-servico");
    } catch (err) {
      setErro(formatApiError(err, "Não foi possível salvar a categoria."));
    }
  };

  if (categoriaId && lista.loading && !erro) return <LoadingState label="Carregando categoria..." />;
  if (naoEncontrada) return <Alert variant="error" title="Categorias" message="Categoria não encontrada." />;

  return (
    <div className="space-y-5">
      <div>
        <PageHeading>{categoriaId ? "Editar Categoria" : "Nova Categoria"}</PageHeading>
        <PageDescription>{categoriaId ? "Altere o nome desta categoria de serviço." : "Organize os serviços extras da academia por categoria."}</PageDescription>
      </div>
      {erro && <Alert variant="error" title="Categorias" message={erro} />}
      <form className="max-w-md space-y-4" onSubmit={salvar}>
        <div>
          <Label>Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da categoria" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/servicos-extras/categorias-servico")}>Cancelar</Button>
          <Button disabled={criar.loading || atualizar.loading}>{criar.loading || atualizar.loading ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </div>
  );
}

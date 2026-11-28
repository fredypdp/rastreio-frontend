"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { academiaService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import type { AtividadeServico } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { PageDescription, PageHeading } from "@/components/ui/typography/Typography";
import { LoadingState } from "@/components/paineis/financeiroShared";
import { DIAS_SEMANA, ProblemasConfiguracao, formatarKz, mesesTexto } from "@/components/paineis/ServicosShared";

/** /servicos-extras/atividades (Parte 7) — lista das atividades extracurriculares da academia. */
export default function AtividadesPainel() {
  const [atividades, setAtividades] = useState<AtividadeServico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    academiaService.listarAtividadesServico()
      .then((r) => setAtividades(r.atividades))
      .catch((e) => setErro(formatApiError(e, "Não foi possível carregar as atividades.")));
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const agir = async (fn: () => Promise<unknown>) => {
    setErro(null);
    try { await fn(); carregar(); } catch (e) { setErro(formatApiError(e, "Não foi possível concluir a ação.")); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageHeading>Atividades extracurriculares</PageHeading>
          <PageDescription>Dança, jiu jitsu, xadrez... Configure preço, meses cobrados, horários e turmas.</PageDescription>
        </div>
        <Link href="/servicos-extras/atividades/criar"><Button>Nova atividade</Button></Link>
      </div>
      {erro && <Alert variant="error" title="Atividades" message={erro} />}
      {!atividades ? <LoadingState label="Carregando atividades..." /> : atividades.length === 0 ? (
        <p className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Nenhuma atividade cadastrada.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {atividades.map((a) => (
            <article key={a.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-white/90">{a.nome}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Instrutor: {a.instrutor}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge size="sm" color={a.ativo ? "success" : "light"}>{a.ativo ? "Ativa" : "Desativada"}</Badge>
                  <Badge size="sm" color="primary">{a.coletiva ? "Coletiva" : "Individual"}</Badge>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {a.gratuito ? "Gratuita" : `${formatarKz(a.preco)} por mês · ${mesesTexto(a.prazo_meses)}`}
              </p>
              {a.tem_taxa_inscricao && <p className="text-xs text-gray-600 dark:text-gray-300">Taxa de inscrição: {formatarKz(a.valor_taxa_inscricao)}</p>}
              {a.horarios.length > 0 && (
                <ul className="space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                  {a.horarios.map((h, i) => <li key={i}>{DIAS_SEMANA[h.dia_semana - 1]}: {h.hora_inicio} – {h.hora_fim}</li>)}
                </ul>
              )}
              {a.coletiva && <p className="text-xs text-gray-600 dark:text-gray-300">{a.turmas.filter((t) => t.ativo).length} turma(s) ativa(s)</p>}
              {a.ativo && <ProblemasConfiguracao problemas={a.problemas} />}
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Link href={`/servicos-extras/atividades/editar/${a.id}`}><Button size="sm" variant="outline">Editar</Button></Link>
                <Button size="sm" variant="outline" onClick={() => agir(() => (a.ativo ? academiaService.desativarAtividadeServico(a.id) : academiaService.reativarAtividadeServico(a.id)))}>{a.ativo ? "Desativar" : "Reativar"}</Button>
                <Button size="sm" variant="outline" onClick={() => { if (window.confirm(`Apagar a atividade "${a.nome}"? Só é possível se nunca teve inscrições; senão, desative.`)) agir(() => academiaService.excluirAtividadeServico(a.id)); }}>Apagar</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

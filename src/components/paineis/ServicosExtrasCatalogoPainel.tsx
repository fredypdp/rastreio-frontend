"use client";

import { useEffect, useState } from "react";
import { estudanteService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserCookie } from "@/hooks/useUserCookie";
import type { CatalogoAtividade, CatalogoServicos, CatalogoTransporte } from "@/types/api";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Alert from "@/components/ui/alert/Alert";
import Icon from "@/components/ui/Icon";
import { DIAS_SEMANA, formatarKz, mesesTexto } from "@/components/paineis/ServicosShared";

/**
 * /servicos-extras/catalogo — catálogo de Serviços (Parte 7: Transporte e
 * Atividade extracurricular) que o estudante pode pedir. Já vem filtrado pelo
 * servidor: só o que está ativo, configurado e disponível para o ano/curso
 * atual dele. No Transporte ele escolhe UMA rota e ao menos um veículo dela.
 */
export default function ServicosExtrasCatalogoPainel() {
  const { loading: carregandoUsuario } = useUserCookie();
  const [catalogo, setCatalogo] = useState<CatalogoServicos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Record<string, true>>({});
  const [rotaEscolhida, setRotaEscolhida] = useState("");
  const [veiculos, setVeiculos] = useState<string[]>([]);

  useEffect(() => {
    if (carregandoUsuario) return;
    estudanteService.listarCatalogoServicosExtras()
      .then(setCatalogo)
      .catch((e) => setErro(formatApiError(e, "Não foi possível carregar o catálogo de serviços.")))
      .finally(() => setCarregando(false));
  }, [carregandoUsuario]);

  const enviar = async (id: string, nome: string, extra?: { rota_id: string; veiculo_ids: string[] }) => {
    setEnviando(id);
    setErro(null);
    try {
      await estudanteService.solicitarServicoExtra(id, extra ?? {});
      setEnviados((prev) => ({ ...prev, [id]: true }));
    } catch (e) {
      setErro(formatApiError(e, `Não foi possível enviar a solicitação de "${nome}".`));
    } finally {
      setEnviando(null);
    }
  };

  const solicitarTransporte = (t: CatalogoTransporte) => {
    if (!rotaEscolhida) return setErro("Escolha a rota do transporte.");
    if (veiculos.length === 0) return setErro("Escolha ao menos um veículo da rota.");
    void enviar(t.id, "Transporte", { rota_id: rotaEscolhida, veiculo_ids: veiculos });
  };

  const enviadoMsg = (
    <p className="flex items-center gap-1.5 text-sm font-medium text-success-600 dark:text-success-500">
      <Icon icon="mdi:check-circle-outline" width={16} /> Solicitação enviada — acompanhe em &quot;Minhas Inscrições&quot;.
    </p>
  );
  const taxa = (s: { tem_taxa_inscricao: boolean; valor_taxa_inscricao: number }) =>
    s.tem_taxa_inscricao && <p className="text-xs text-gray-600 dark:text-gray-300">Taxa de inscrição: {formatarKz(s.valor_taxa_inscricao)} (paga uma vez, quando a academia aprovar).</p>;

  const cardTransporte = (t: CatalogoTransporte) => {
    const rota = t.rotas.find((r) => r.id === rotaEscolhida);
    return (
      <article key={t.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-gray-800 dark:text-white/90">Transporte</h2>
          <Badge size="sm" color="primary">Escolha uma rota</Badge>
        </div>
        <div className="space-y-2" role="radiogroup" aria-label="Rota">
          {t.rotas.map((r) => (
            <label key={r.id} className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm ${rotaEscolhida === r.id ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/20" : "border-gray-200 dark:border-gray-700"}`}>
              <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                <input type="radio" name={`rota-${t.id}`} checked={rotaEscolhida === r.id} onChange={() => { setRotaEscolhida(r.id); setVeiculos([]); }} />
                {r.nome} · embarque às {r.horario_embarque}
              </span>
              <span className="pl-6 text-gray-600 dark:text-gray-300">{r.gratuito ? "Gratuito" : `${formatarKz(r.preco)} por mês · ${mesesTexto(r.meses)}`}</span>
            </label>
          ))}
        </div>
        {rota && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Veículos desta rota (escolha ao menos um)</p>
            {rota.veiculos.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={veiculos.includes(v.id)} onChange={() => setVeiculos((prev) => (prev.includes(v.id) ? prev.filter((x) => x !== v.id) : [...prev, v.id]))} />
                {v.nome}
              </label>
            ))}
          </div>
        )}
        {taxa(t)}
        <div className="mt-auto pt-1">
          {enviados[t.id] ? enviadoMsg : (
            <Button size="sm" onClick={() => solicitarTransporte(t)} disabled={enviando === t.id}>{enviando === t.id ? "Enviando..." : "Solicitar inscrição"}</Button>
          )}
        </div>
      </article>
    );
  };

  const cardAtividade = (a: CatalogoAtividade) => (
    <article key={a.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white/90">{a.nome}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Instrutor: {a.instrutor}</p>
        </div>
        <Badge size="sm" color="primary">{a.coletiva ? "Coletiva" : "Individual"}</Badge>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{a.gratuito ? "Gratuita" : `${formatarKz(a.preco)} por mês · ${mesesTexto(a.meses)}`}</p>
      {a.horarios.length > 0 && (
        <ul className="space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
          {a.horarios.map((h, i) => <li key={i}>{DIAS_SEMANA[h.dia_semana - 1]}: {h.hora_inicio} – {h.hora_fim}</li>)}
        </ul>
      )}
      {a.coletiva && <p className="text-xs text-gray-600 dark:text-gray-300">A academia coloca você numa turma da atividade quando aprovar a inscrição.</p>}
      {taxa(a)}
      <div className="mt-auto pt-1">
        {enviados[a.id] ? enviadoMsg : (
          <Button size="sm" onClick={() => enviar(a.id, a.nome)} disabled={enviando === a.id}>{enviando === a.id ? "Enviando..." : "Solicitar inscrição"}</Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Catálogo de Serviços</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Transporte e atividades extracurriculares disponíveis para o seu ano/curso atual.</p>
      </div>

      {erro && <Alert variant="error" title="Catálogo" message={erro} />}

      {carregando || carregandoUsuario ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Carregando...</p>
      ) : !catalogo || catalogo.total === 0 ? (
        <p className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
          Nenhum serviço disponível para o seu ano/curso no momento.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {catalogo.transporte && cardTransporte(catalogo.transporte)}
          {catalogo.atividades.map(cardAtividade)}
        </div>
      )}
    </div>
  );
}

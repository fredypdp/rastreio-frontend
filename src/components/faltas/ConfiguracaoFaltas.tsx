"use client";
import { useCallback, useEffect, useState } from "react";
import { useApi, academiaService } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import type { ConfiguracaoFaltas as ConfiguracaoFaltasDados } from "@/types/api";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { PERIODO_EXPLICADO, textosReprovacaoPorFaltas, type TipoEnsinoAcademia } from "@/lib/faltasConfiguracaoTextos";

const LIMITE_MIN = 1;
const LIMITE_MAX = 500;

type Salvo = { limite: number | null; reprovacao: boolean };

export default function ConfiguracaoFaltas({ tipoEnsino }: { tipoEnsino: TipoEnsinoAcademia }) {
  const { execute: carregar, loading: carregando } = useApi(academiaService.obterConfiguracaoFaltas);
  const { execute: salvar, loading: salvando } = useApi(academiaService.definirConfiguracaoFaltas);

  const [usarLimite, setUsarLimite] = useState(false);
  const [limiteTexto, setLimiteTexto] = useState("");
  const [reprovacao, setReprovacao] = useState(false);
  const [salvo, setSalvo] = useState<Salvo | null>(null);
  const [alerta, setAlerta] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const aplicar = useCallback((cfg: ConfiguracaoFaltasDados) => {
    const limite = cfg.limite_faltas_por_periodo ?? null;
    setUsarLimite(limite !== null);
    setLimiteTexto(limite !== null ? String(limite) : "");
    setReprovacao(limite !== null && cfg.reprovacao_por_faltas);
    setSalvo({ limite, reprovacao: limite !== null && cfg.reprovacao_por_faltas });
  }, []);

  useEffect(() => {
    carregar()
      .then((res) => { if (res?.data) aplicar(res.data); })
      .catch((err: unknown) => setAlerta({ variant: "error", message: formatApiError(err, "Erro ao carregar a configuração de faltas") }));
  }, [carregar, aplicar]);

  const limiteNumero = Number(limiteTexto);
  const limiteValido = Number.isInteger(limiteNumero) && limiteNumero >= LIMITE_MIN && limiteNumero <= LIMITE_MAX && limiteTexto.trim() !== "";
  const limiteInvalido = usarLimite && !limiteValido;

  const limiteAtual: number | null = usarLimite && limiteValido ? limiteNumero : null;
  const reprovacaoAtual = usarLimite && reprovacao;
  const alterado = salvo !== null && (limiteAtual !== salvo.limite || reprovacaoAtual !== salvo.reprovacao);

  function alternarLimite(ativo: boolean) {
    setUsarLimite(ativo);
    setAlerta(null);
    if (!ativo) setReprovacao(false);
  }

  async function handleSalvar() {
    if (limiteInvalido) return;
    setAlerta(null);
    try {
      const res = await salvar({ limite_faltas_por_periodo: limiteAtual, reprovacao_por_faltas: reprovacaoAtual });
      if (res?.data) aplicar(res.data);
      setAlerta({ variant: "success", message: "Configuração de faltas guardada com sucesso." });
    } catch (err: unknown) {
      setAlerta({ variant: "error", message: formatApiError(err, "Erro ao guardar a configuração de faltas") });
    }
  }

  if (carregando && salvo === null) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  const textosReprovacao = textosReprovacaoPorFaltas(tipoEnsino);

  return (
    <div className="space-y-6">
      {alerta && (
        <Alert variant={alerta.variant} title={alerta.variant === "success" ? "Sucesso" : "Erro"} message={alerta.message} />
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Limite de faltas por {PERIODO_EXPLICADO}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Número máximo de faltas que um estudante pode ter numa matéria, em cada período. O limite é ultrapassado quando o total de faltas é maior do que este número.
        </p>
        <div className="mt-4 space-y-4">
          <Checkbox id="usar-limite-faltas" checked={usarLimite} onChange={alternarLimite} label="Definir limite de faltas" />
          {usarLimite && (
            <div>
              <label htmlFor="limite-faltas" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Máximo de faltas por matéria e período *
              </label>
              <input
                id="limite-faltas"
                type="number"
                inputMode="numeric"
                min={LIMITE_MIN}
                max={LIMITE_MAX}
                step={1}
                value={limiteTexto}
                onChange={(e) => { setLimiteTexto(e.target.value); setAlerta(null); }}
                placeholder="Ex: 5"
                className="w-40 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {limiteInvalido && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">Indique um número inteiro entre {LIMITE_MIN} e {LIMITE_MAX}.</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reprovação por faltas</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{textosReprovacao.resumo}</p>
        <details className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer select-none font-medium text-brand-600 dark:text-brand-400">Saber mais</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {textosReprovacao.detalhes.map((detalhe) => (
              <li key={detalhe}>{detalhe}</li>
            ))}
          </ul>
        </details>
        <div className="mt-4">
          <Checkbox
            id="reprovacao-por-faltas"
            checked={reprovacaoAtual}
            onChange={(v) => { setReprovacao(v); setAlerta(null); }}
            disabled={!usarLimite}
            label="Aplicar reprovação por faltas"
          />
          {!usarLimite && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Defina primeiro o limite de faltas para poder ativar a reprovação por faltas.</p>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSalvar} disabled={salvando || carregando || limiteInvalido || !alterado}>
          {salvando ? "A guardar…" : "Guardar configuração"}
        </Button>
      </div>
    </div>
  );
}

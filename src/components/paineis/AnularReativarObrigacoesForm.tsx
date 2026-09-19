"use client";
import { useEffect, useState } from "react";
import { academiaService, consultasService, financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import SearchableSelect from "@/components/form/SearchableSelect";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Icon from "@/components/ui/Icon";
import { formatAnoLetivo } from "@/components/paineis/financeiroShared";
import { MES_NOME_OPCOES } from "@/components/paineis/financeiroNivelShared";

/**
 * Formulário de anular OU reativar obrigações de um estudante — Tarefa 11.
 * Antes um único formulário fazia as duas ações ao mesmo tempo (dois botões
 * lado a lado); agora cada ação tem a sua própria página
 * (/financas/gestao-cobrancas/anular-mensalidade e .../reativar-mensalidade)
 * e este componente é parametrizado por `acao` para render só a ação
 * pedida, sem duplicar a busca de estudante/ano letivo nos dois lugares.
 *
 * O seletor de mês deixou de ser o `MultiSelect` (placeholder fixo "Select
 * option" sem cor correta no tema escuro, dropdown sem rolagem por usar uma
 * classe Tailwind — `max-h-select` — que não existe em lugar nenhum do
 * projeto, e permitia escolher vários meses de uma vez) e passou a ser um
 * `SearchableSelect` de um mês só — o mesmo padrão já usado para "Ano
 * letivo" neste mesmo formulário.
 */
export default function AnularReativarObrigacoesForm({ acao, codigoAcademia, onSuccess }: {
  acao: "anular" | "reativar";
  codigoAcademia: string;
  onSuccess?: () => void;
}) {
  const [estudantes, setEstudantes] = useState<{ value: string; label: string }[]>([]);
  const [codigoEstudante, setCodigoEstudante] = useState("");
  const [anosLetivos, setAnosLetivos] = useState<string[]>([]);
  const [anoLetivo, setAnoLetivo] = useState("");
  const [mes, setMes] = useState("");
  const [motivo, setMotivo] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const anular = useApi(financeiroService.anularObrigacoes);
  const reativar = useApi(financeiroService.reativarObrigacoes);
  const executando = acao === "anular" ? anular : reativar;

  useEffect(() => {
    if (!codigoAcademia) return;
    consultasService.listarEstudantes({ codigo_academia: codigoAcademia, limit: 300, offset: 0 })
      .then((r) => setEstudantes((r.estudantes ?? []).map((e: any) => ({ value: e.codigo_estudante, label: `${e.nome ?? e.codigo_estudante} (${e.codigo_estudante})` }))))
      .catch(() => setEstudantes([]));
  }, [codigoAcademia]);

  useEffect(() => {
    if (!codigoAcademia) return;
    Promise.all([
      academiaService.getAnoLetivo({ codigo_academia: codigoAcademia }),
      academiaService.listarAnosLetivosLista({ codigo_academia: codigoAcademia }),
    ]).then(([atual, lista]) => {
      const anos = Array.from(new Set([atual?.ano_letivo, ...((lista?.anos_letivos_lista ?? []).map((a) => a.ano_letivo))].filter((a): a is string => !!a)));
      setAnosLetivos(anos);
      setAnoLetivo((prev) => prev || atual?.ano_letivo || anos[0] || "");
    }).catch(() => setAnosLetivos([]));
  }, [codigoAcademia]);

  const executar = async () => {
    if (!codigoEstudante || !anoLetivo || !mes) { setAlert({ variant: "error", message: "Selecione o estudante, o ano letivo e o mês." }); return; }
    if (acao === "anular" && !motivo.trim()) { setAlert({ variant: "error", message: "Informe o motivo para anular a obrigação." }); return; }
    try {
      const payload = { codigo_estudante: codigoEstudante, codigo_academia: codigoAcademia, ano_letivo: anoLetivo, meses: [Number(mes)], motivo: motivo.trim() || undefined };
      await (acao === "anular" ? anular.execute(payload) : reativar.execute(payload));
      setAlert({ variant: "success", message: acao === "anular" ? "Obrigação anulada." : "Obrigação reativada." });
      onSuccess?.();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível concluir a ação.") });
    }
  };

  return <div className="space-y-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
    {alert && <Alert variant={alert.variant} title="Obrigações de mensalidade" message={alert.message} />}
    <div><Label>Estudante</Label><SearchableSelect value={codigoEstudante} options={estudantes} onChange={setCodigoEstudante} placeholder="Buscar estudante..." isClearable /></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Ano letivo</Label>
        <SearchableSelect
          value={anoLetivo}
          options={anosLetivos.map((a) => ({ value: a, label: formatAnoLetivo(a) }))}
          onChange={setAnoLetivo}
          placeholder={anosLetivos.length ? "Selecione o ano letivo" : "Nenhum ano letivo definido para esta academia"}
          isSearchable={false}
          inputId="anular-reativar-ano-letivo"
          name="anular-reativar-ano-letivo"
        />
      </div>
      <div>
        <Label>Mês</Label>
        <SearchableSelect
          value={mes}
          options={MES_NOME_OPCOES}
          onChange={setMes}
          placeholder="Selecione o mês"
          isSearchable={false}
          inputId="anular-reativar-mes"
          name="anular-reativar-mes"
        />
      </div>
    </div>
    {acao === "anular" && (
      <div><Label>Motivo</Label><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: bolsa concedida, erro de lançamento..." /></div>
    )}
    <div className="flex gap-3">
      {acao === "anular" ? (
        <Button size="sm" variant="outline" disabled={executando.loading} onClick={executar} startIcon={<Icon icon="mdi:close-circle-outline" width={16} />}>
          {executando.loading ? "Anulando..." : "Anular obrigação"}
        </Button>
      ) : (
        <Button size="sm" disabled={executando.loading} onClick={executar} startIcon={<Icon icon="mdi:reload" width={16} />}>
          {executando.loading ? "Reativando..." : "Reativar obrigação"}
        </Button>
      )}
    </div>
  </div>;
}

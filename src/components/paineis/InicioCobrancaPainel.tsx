"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import { academiaService, ApiError, financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserType } from "@/hooks/useRoutePermission";
import { ConfirmDialog, SubtelaPanel, formatAnoLetivo, capitalizar } from "@/components/paineis/financeiroShared";
import { FinanceiroAcessoGuard, ManualDeFuncionamento, useFinanceiroNivelContext, MES_NOME_OPCOES } from "@/components/paineis/financeiroNivelShared";

/** /financas/configuracoes/mensalidade/inicio-cobranca (Tarefa 11) — antes era a subtela de topo "Início de cobrança fora do padrão"; agora vive só dentro de Mensalidade, já que não se aplica a taxa de matrícula. */
export default function InicioCobrancaPainel() {
  const ctx = useFinanceiroNivelContext();
  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <SubtelaPanel title="Início de cobrança" icon="mdi:calendar-start" onVoltar="/financas/configuracoes/mensalidade">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Use isto só se o ano letivo <b>começou fora do mês habitual</b> (ex.: turma que iniciou em março em vez de fevereiro).</li>
            <li>A mudança vale só para o <b>ano letivo atual</b> — no próximo ano letivo, a cobrança volta ao mês habitual automaticamente, a menos que você defina uma nova exceção para ele também.</li>
            <li>Se este ano letivo não deveria mais ter uma exceção, use &ldquo;Remover início de cobrança&rdquo; para voltar ao mês habitual.</li>
          </ul>
        </ManualDeFuncionamento>
        <DefinirInicioCobrancaForm codigoAcademia={ctx.codigoAcademia} />
      </SubtelaPanel>
    </FinanceiroAcessoGuard>
  );
}

/**
 * Formulário de "definir início de cobrança fora do padrão".
 *
 * Tarefa 11: o ano letivo deixou de ser selecionável — a configuração
 * sempre se aplica ao ano letivo ATUAL da academia (inferido
 * automaticamente via academiaService.getAnoLetivo), nunca a um ano letivo
 * passado ou futuro escolhido à mão. Em compensação, cada opção do seletor
 * de mês agora mostra o ano civil correspondente (ex.: "Setembro de 2026",
 * "Março de 2027"), calculado no frontend com a MESMA regra que o backend já
 * usa para resolver isso (mesNaturalInicioAnoLetivo/posicaoNoAnoLetivo em
 * internal/finance/mensalidade.go: setembro é o mês natural de início para
 * academias de nível "escola", outubro para "superior"; qualquer mês a
 * partir do natural pertence ao primeiro ano civil do ano letivo, os meses
 * anteriores pertencem ao segundo). Isso é só uma anotação de apresentação
 * — o valor enviado à API continua sendo só o número do mês (1–12), porque
 * o backend já resolve sozinho a qual ano civil ele pertence a partir do
 * ano_letivo configurado.
 */
function DefinirInicioCobrancaForm({ codigoAcademia }: { codigoAcademia: string }) {
  const { user } = useUserType();
  const [anoLetivo, setAnoLetivo] = useState("");
  const [mesInicio, setMesInicio] = useState("2");
  const [alert, setAlert] = useState<{ variant: "success" | "error" | "info"; message: string } | null>(null);
  const definirInicio = useApi(financeiroService.definirInicioCobranca);
  const removerInicio = useApi(financeiroService.removerInicioCobranca);
  // Controla a exibição do ConfirmDialog antes de remover a exceção (ver
  // abrirConfirmacaoRemocao/removerException, abaixo).
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  useEffect(() => {
    if (!codigoAcademia) return;
    academiaService.getAnoLetivo({ codigo_academia: codigoAcademia })
      .then((atual) => setAnoLetivo(atual?.ano_letivo || ""))
      .catch(() => setAnoLetivo(""));
  }, [codigoAcademia]);

  const mesNatural = user?.academia?.nivel === "superior" ? 10 : 9;

  const mesOpcoes = useMemo(() => {
    const [primeiroAno, segundoAno] = anoLetivo.split("_");
    return MES_NOME_OPCOES.map((opt) => {
      const mes = Number(opt.value);
      const anoCivil = mes >= mesNatural ? primeiroAno : segundoAno;
      return { value: opt.value, label: anoCivil ? `${capitalizar(opt.label)} de ${anoCivil}` : capitalizar(opt.label) };
    });
  }, [anoLetivo, mesNatural]);

  const submit = async () => {
    setAlert(null);
    if (!anoLetivo) { setAlert({ variant: "error", message: "Não foi possível carregar o ano letivo atual. Tente novamente em instantes." }); return; }
    try {
      await definirInicio.execute({ codigo_academia: codigoAcademia, ano_letivo: anoLetivo, mes_inicio: Number(mesInicio) });
      setAlert({ variant: "success", message: "Início de cobrança definido com sucesso." });
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível definir o início de cobrança.") });
    }
  };

  /**
   * Valida que o ano letivo atual já foi carregado e, se sim, abre o
   * ConfirmDialog de remoção (removerException só executa a ação em si,
   * chamada pelo modal).
   */
  const abrirConfirmacaoRemocao = () => {
    setAlert(null);
    if (!anoLetivo) { setAlert({ variant: "error", message: "Não foi possível carregar o ano letivo atual. Tente novamente em instantes." }); return; }
    setConfirmandoRemocao(true);
  };

  /**
   * Remove a exceção de início de cobrança do ano letivo atual, revertendo
   * ao mês natural (setembro para Ensino Primário/Iº Ciclo e Médio, outubro
   * para Superior). Não há como esta tela saber de antemão se existe uma
   * exceção definida para o ano letivo atual (não existe uma consulta
   * dedicada para isso) — por isso o botão fica sempre disponível, e um 404
   * do backend (nada para remover) é tratado como informação neutra, não
   * como erro.
   */
  const removerException = async () => {
    try {
      await removerInicio.execute({ codigo_academia: codigoAcademia, ano_letivo: anoLetivo });
      setAlert({ variant: "success", message: "Início de cobrança removido — voltou ao mês natural do ano letivo." });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setAlert({ variant: "info", message: "Não havia nenhuma exceção de início de cobrança definida para este ano letivo — já está no mês natural." });
        return;
      }
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível remover o início de cobrança.") });
    }
  };

  return (
    <div className="space-y-3">
      {confirmandoRemocao && (
        <ConfirmDialog
          title="Remover início de cobrança"
          message={`Tem certeza que deseja remover a exceção de início de cobrança de ${formatAnoLetivo(anoLetivo)}? A cobrança volta a considerar o mês natural do ano letivo.`}
          confirmLabel="Remover"
          onConfirm={removerException}
          onClose={() => setConfirmandoRemocao(false)}
        />
      )}
      {alert && <Alert variant={alert.variant} title="Início de cobrança" message={alert.message} />}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Isto define o início de cobrança para o ano letivo atual{anoLetivo ? ` (${formatAnoLetivo(anoLetivo)})` : ""} — o ano letivo é sempre o vigente no momento, não é possível escolher outro aqui.
      </p>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <Label>Mês início</Label>
          <SearchableSelect
            value={mesInicio}
            options={mesOpcoes}
            onChange={(v) => setMesInicio(v || "2")}
            isSearchable={false}
            isClearable={false}
            inputId="inicio-cobranca-mes"
            name="inicio-cobranca-mes"
          />
        </div>
        <div className="self-end">
          <Button onClick={submit} disabled={!anoLetivo || definirInicio.loading} startIcon={<Icon icon="mdi:calendar-start" width={16} />}>
            Definir início de cobrança
          </Button>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4 dark:border-white/[0.05]">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Se este ano letivo não deveria mais ter um início de cobrança fora do padrão, remova a exceção — a cobrança volta a considerar o mês natural.
        </p>
        <div className="mt-2">
          <Button size="sm" variant="danger" onClick={abrirConfirmacaoRemocao} disabled={!anoLetivo || removerInicio.loading} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
            {removerInicio.loading ? "Removendo..." : "Remover início de cobrança deste ano letivo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

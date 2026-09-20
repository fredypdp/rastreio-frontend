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
import type { MensalidadeConfiguracaoView } from "@/types/api";

/** /financas/configuracoes/mensalidade/inicio-cobranca (Tarefa 11) — antes era a subtela de topo "Início de cobrança fora do padrão"; agora vive só dentro de Mensalidade, já que não se aplica a taxa de matrícula. */
export default function InicioCobrancaPainel() {
  const ctx = useFinanceiroNivelContext();
  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <SubtelaPanel title="Início de cobrança" icon="mdi:calendar-start" onVoltar="/financas/configuracoes/mensalidade">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Isto define <b>a partir de que mês</b> a cobrança de mensalidade do ano letivo atual passa a valer. Por padrão, a cobrança começa no mês em que o ano letivo naturalmente começa (setembro para Ensino Primário/Iº Ciclo/Médio, outubro para Superior).</li>
            <li>Use isto quando a academia é integrada à plataforma com o <b>ano letivo já em andamento</b> — por exemplo, aderindo ao Spuri em novembro, com as aulas tendo começado em setembro: defina novembro aqui para que a cobrança pelo Spuri comece a partir desse mês, sem tentar cobrar meses anteriores que já foram geridos fora da plataforma.</li>
            <li>A mudança vale só para o <b>ano letivo atual</b> — no próximo ano letivo, a cobrança volta ao mês natural automaticamente, a menos que você defina uma nova exceção para ele também.</li>
            <li>Se este ano letivo não deveria mais ter uma exceção, use &ldquo;Remover início de cobrança&rdquo; para voltar ao mês natural.</li>
          </ul>
        </ManualDeFuncionamento>
        <DefinirInicioCobrancaForm codigoAcademia={ctx.codigoAcademia} mensalidades={ctx.mensalidadesApi.data?.configuracoes ?? []} />
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
 *
 * Tarefa 12: o seletor de mês deixou de listar Janeiro→Dezembro (ordem
 * errada — misturava meses que nem fazem parte do ano letivo, como agosto)
 * e passou a listar só os meses do período letivo, do mês natural de
 * início até o `mes_fim_cobranca` mais restritivo já configurado (em
 * qualquer nível) para a academia — a mesma regra que o backend já aplica
 * em `validateMesInicioCobranca` (internal/finance/mensalidade.go),
 * incluindo o teto padrão de julho (mes 7) quando a academia ainda não tem
 * nenhuma configuração de mensalidade.
 */
function posicaoNoAnoLetivo(mes: number, natural: number): number {
  return mes >= natural ? mes - natural + 1 : mes + (12 - natural) + 1;
}

function DefinirInicioCobrancaForm({ codigoAcademia, mensalidades }: { codigoAcademia: string; mensalidades: MensalidadeConfiguracaoView[] }) {
  const { user } = useUserType();
  const [anoLetivo, setAnoLetivo] = useState("");
  const [mesInicioSelecionado, setMesInicioSelecionado] = useState("");
  const [alert, setAlert] = useState<{ variant: "success" | "error" | "info"; message: string } | null>(null);
  const definirInicio = useApi(financeiroService.definirInicioCobranca);
  const removerInicio = useApi(financeiroService.removerInicioCobranca);
  const consultarInicio = useApi(financeiroService.consultarInicioCobranca);
  // Tarefa 111: null enquanto ainda não foi verificado (ou a verificação
  // falhou por outro motivo que não "não existe"); true/false depois que
  // GET /financeiro/mensalidades/inicio-cobranca responde. O botão
  // "Remover" só fica habilitado quando isto é true — antes não havia essa
  // consulta e o botão ficava sempre disponível (ver nota em
  // removerException, abaixo).
  const [existeExcecao, setExisteExcecao] = useState<boolean | null>(null);
  // Controla a exibição do ConfirmDialog antes de remover a exceção (ver
  // abrirConfirmacaoRemocao/removerException, abaixo).
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  useEffect(() => {
    if (!codigoAcademia) return;
    academiaService.getAnoLetivo({ codigo_academia: codigoAcademia })
      .then((atual) => setAnoLetivo(atual?.ano_letivo || ""))
      .catch(() => setAnoLetivo(""));
  }, [codigoAcademia]);

  const verificarExcecaoAtual = () => {
    if (!codigoAcademia || !anoLetivo) return;
    consultarInicio.execute({ codigo_academia: codigoAcademia, ano_letivo: anoLetivo })
      .then(() => setExisteExcecao(true))
      .catch((err) => setExisteExcecao(err instanceof ApiError && err.status === 404 ? false : null));
  };

  useEffect(() => {
    setExisteExcecao(null);
    verificarExcecaoAtual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoAcademia, anoLetivo]);

  const mesNatural = user?.academia?.nivel === "superior" ? 10 : 9;
  // Igual ao "menor" em validateMesInicioCobranca: o mes_fim_cobranca mais
  // restritivo entre as configurações de mensalidade já feitas (em
  // qualquer nível); 7 (o maior valor possível) enquanto nenhuma existir.
  const limiteFimAnoLetivo = mensalidades.length > 0 ? Math.min(...mensalidades.map((c) => c.mes_fim_cobranca)) : 7;

  const mesOpcoes = useMemo(() => {
    const [primeiroAno, segundoAno] = anoLetivo.split("_");
    const limitePos = posicaoNoAnoLetivo(limiteFimAnoLetivo, mesNatural);
    return MES_NOME_OPCOES
      .map((opt) => ({ ...opt, mes: Number(opt.value), pos: posicaoNoAnoLetivo(Number(opt.value), mesNatural) }))
      .filter((opt) => opt.pos <= limitePos)
      .sort((a, b) => a.pos - b.pos)
      .map(({ value, label, mes }) => {
        const anoCivil = mes >= mesNatural ? primeiroAno : segundoAno;
        return { value, label: anoCivil ? `${capitalizar(label)} de ${anoCivil}` : capitalizar(label) };
      });
  }, [anoLetivo, mesNatural, limiteFimAnoLetivo]);

  // Mantém mesInicio sempre dentro da lista de opções válida, sem guardar
  // esse ajuste como estado sincronizado por efeito (o valor "corrigido" é
  // derivado direto do que já está disponível) — o valor bruto escolhido
  // pelo usuário só é usado quando ainda é uma opção válida; o padrão é
  // sempre a primeira opção da lista (mesOpcoes já vem ordenada a partir do
  // mês natural).
  const mesInicio = mesOpcoes.some((o) => o.value === mesInicioSelecionado) ? mesInicioSelecionado : (mesOpcoes[0]?.value ?? "");
  const mesAtualLabel = consultarInicio.data ? capitalizar(MES_NOME_OPCOES.find((o) => o.value === String(consultarInicio.data!.mes_inicio))?.label ?? "") : "";

  const submit = async () => {
    setAlert(null);
    if (!anoLetivo) { setAlert({ variant: "error", message: "Não foi possível carregar o ano letivo atual. Tente novamente em instantes." }); return; }
    try {
      await definirInicio.execute({ codigo_academia: codigoAcademia, ano_letivo: anoLetivo, mes_inicio: Number(mesInicio) });
      setAlert({ variant: "success", message: "Início de cobrança definido com sucesso." });
      verificarExcecaoAtual();
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
   * para Superior). O botão que chama isto (via abrirConfirmacaoRemocao) só
   * fica habilitado depois que GET /financeiro/mensalidades/inicio-cobranca
   * (Tarefa 111) confirma que existe uma exceção — o catch de 404 aqui é só
   * uma rede de segurança para o caso raro de a exceção ter sido removida
   * por outra aba/pessoa entre a verificação e o clique, não o mecanismo
   * principal (era assim antes desta tarefa, quando não existia consulta
   * dedicada e o botão ficava sempre disponível).
   */
  const removerException = async () => {
    try {
      await removerInicio.execute({ codigo_academia: codigoAcademia, ano_letivo: anoLetivo });
      setAlert({ variant: "success", message: "Início de cobrança removido — voltou ao mês natural do ano letivo." });
      setExisteExcecao(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setAlert({ variant: "info", message: "Não havia nenhuma exceção de início de cobrança definida para este ano letivo — já está no mês natural." });
        setExisteExcecao(false);
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
            onChange={(v) => setMesInicioSelecionado(v || "")}
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
          {existeExcecao === true
            ? `Este ano letivo já tem um início de cobrança fora do padrão definido${mesAtualLabel ? ` (${mesAtualLabel})` : ""}. Se não for mais necessário, remova a exceção — a cobrança volta a considerar o mês natural.`
            : existeExcecao === false
            ? "Este ano letivo ainda não tem nenhum início de cobrança fora do padrão definido — não há nada para remover."
            : "Verificando se este ano letivo já tem um início de cobrança fora do padrão definido..."}
        </p>
        <div className="mt-2">
          <Button size="sm" variant="danger" onClick={abrirConfirmacaoRemocao} disabled={!anoLetivo || removerInicio.loading || existeExcecao !== true} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
            {removerInicio.loading ? "Removendo..." : "Remover início de cobrança deste ano letivo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

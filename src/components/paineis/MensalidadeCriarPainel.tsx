"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import { financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { SubtelaPanel } from "@/components/paineis/financeiroShared";
import {
  FinanceiroAcessoGuard, AvisoCredenciais, ManualDeFuncionamento, NivelCamposFields, MetodosPagamentoCheckboxes,
  validarValorEAno, existeConfiguracaoParaEscopo, useFinanceiroNivelContext, MES_FIM_OPCOES, type NivelFormState, type FormFieldErrors,
} from "@/components/paineis/financeiroNivelShared";
import type { FinanceiroModoVigencia, FinanceiroNivel, MensalidadeConfiguracaoInput } from "@/types/api";

/**
 * /financas/configuracoes/mensalidade/criar (Tarefa 12) — página "Definir
 * Nova Mensalidade". Serve dois casos:
 *
 * 1. Sem parâmetros na URL: criação normal, nível/curso/ano em branco. Como
 *    é a primeira configuração de qualquer escopo escolhido aqui, "o que
 *    acontece com quem já está pendente?" não é perguntado (ver
 *    NivelCamposFields/existeConfiguracaoParaEscopo) — o backend (Tarefa
 *    108) já aceita modo_vigencia omitido nesse caso e aplica o padrão
 *    "vale para todos" sozinho.
 * 2. Com `?nivel=&ano_academico=&curso_id=` na URL — chegou por "Editar" a
 *    partir de um cartão em ConfiguracoesDefinidasCards (lista de
 *    "Mensalidades definidas"): nível/curso/ano vêm travados
 *    (NivelCamposFields escopoFixo), valor/mês de encerramento/métodos já
 *    vêm pré-preenchidos com a configuração atual, e a pergunta sobre
 *    pendentes aparece (porque aqui já existe uma configuração vigente).
 */
export default function MensalidadeCriarPainel() {
  const ctx = useFinanceiroNivelContext();
  const searchParams = useSearchParams();
  const escopoFixo = searchParams.has("nivel");
  const [form, setForm] = useState<NivelFormState>({ nivel: "fundamental", ano_academico: "", curso_id: "", valor: "", metodos_pagamento: ["GPO"], modo_vigencia: "" });
  const [mesFim, setMesFim] = useState("6");
  const [errors, setErrors] = useState<FormFieldErrors>({});
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [preenchidoDaUrl, setPreenchidoDaUrl] = useState(false);
  const salvar = useApi(financeiroService.configurarMensalidade);
  const atualizar = useApi(financeiroService.atualizarConfiguracaoMensalidade);
  const configuracoes = useMemo(() => ctx.mensalidadesApi.data?.configuracoes ?? [], [ctx.mensalidadesApi.data]);

  useEffect(() => {
    if (escopoFixo || ctx.niveisDisponiveis.length === 0) return;
    setForm((prev) => (ctx.niveisDisponiveis.includes(prev.nivel) ? prev : { ...prev, nivel: ctx.niveisDisponiveis[0], curso_id: "", ano_academico: "" }));
  }, [ctx.niveisDisponiveis, escopoFixo]);

  // Pré-preenche nível/ano/curso (e valor/mês/métodos, se já houver uma
  // configuração salva para esse escopo) a partir da URL — só uma vez,
  // quando a lista de configurações termina de carregar.
  useEffect(() => {
    if (!escopoFixo || preenchidoDaUrl || ctx.mensalidadesApi.loading) return;
    const nivel = (searchParams.get("nivel") ?? "fundamental") as FinanceiroNivel;
    const ano_academico = searchParams.get("ano_academico") ?? "";
    const curso_id = searchParams.get("curso_id") ?? "";
    const atual = configuracoes.find((c) => c.nivel === nivel && c.ano_academico === ano_academico && (c.curso_id ?? "") === curso_id);
    setForm((prev) => ({
      ...prev,
      nivel,
      ano_academico,
      curso_id,
      valor: atual ? String(atual.valor) : prev.valor,
      metodos_pagamento: atual?.metodos_pagamento ?? prev.metodos_pagamento,
    }));
    if (atual) setMesFim(String(atual.mes_fim_cobranca));
    setPreenchidoDaUrl(true);
  }, [escopoFixo, preenchidoDaUrl, ctx.mensalidadesApi.loading, configuracoes, searchParams]);

  // form completo não entra nas deps de propósito — a existência da
  // configuração só depende de nivel/ano_academico/curso_id, não de
  // valor/metodos_pagamento/modo_vigencia (que mudam a cada tecla digitada
  // e não devem re-executar esta checagem).
  const existe = useMemo(() => existeConfiguracaoParaEscopo(configuracoes, form),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configuracoes, form.nivel, form.ano_academico, form.curso_id]);

  const submit = async () => {
    const errs = validarValorEAno(form, existe);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      if (!ctx.codigoAcademia) throw new Error("Academia não identificada.");
      const p: MensalidadeConfiguracaoInput = {
        codigo_academia: ctx.codigoAcademia,
        nivel: form.nivel,
        ano_academico: form.ano_academico,
        curso_id: form.nivel === "fundamental" ? undefined : form.curso_id,
        valor: Number(form.valor),
        mes_fim_cobranca: Number(mesFim) as 6 | 7,
        metodos_pagamento: form.metodos_pagamento,
        modo_vigencia: form.modo_vigencia ? (form.modo_vigencia as FinanceiroModoVigencia) : undefined,
      };
      await (existe ? atualizar.execute(p) : salvar.execute(p));
      setAlert({ variant: "success", message: "Configuração de mensalidade versionada com sucesso. Você pode configurar outro nível/curso agora, ou voltar para a lista." });
      await ctx.reload();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível salvar mensalidade.") });
    }
  };

  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <SubtelaPanel title={escopoFixo ? "Editar Mensalidade" : "Definir Nova Mensalidade"} icon="mdi:calendar-month-outline" onVoltar="/financas/configuracoes/mensalidade">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>O <b>valor</b> definido aqui passa a valer a partir de agora, para todos os estudantes do nível/ano/curso escolhido.</li>
            <li>Ao editar uma mensalidade já existente, escolha com atenção <b>o que acontece com quem já está pendente</b>: isso decide se cobranças de meses anteriores (ainda não pagas) também mudam para o novo valor, ou se continuam no valor antigo. Na primeira configuração de um nível/ano/curso isso não é perguntado — o valor novo já vale para tudo, já que ainda não havia nenhum valor definido antes.</li>
            <li>O <b>mês de encerramento da cobrança</b> define até quando a mensalidade é cobrada dentro do ano letivo — depois desse mês, a cobrança para automaticamente até o próximo ano letivo.</li>
            <li>Só é possível salvar depois de aderir ao Gateway de Pagamento Online e escolher pelo menos um método de pagamento aceite.</li>
          </ul>
        </ManualDeFuncionamento>
        {alert && <Alert variant={alert.variant} title="Finanças" message={alert.message} />}
        {ctx.bloquear && <AvisoCredenciais />}
        <div className="grid gap-4">
          <NivelCamposFields
            kind="mensalidade"
            form={form}
            errors={errors}
            setForm={setForm}
            niveisDisponiveis={ctx.niveisDisponiveis}
            cursos={ctx.cursos}
            anosAcademicosAcademia={ctx.anosAcademicosAcademia}
            escopoFixo={escopoFixo}
            existeConfiguracaoParaEscopo={existe}
          />
          <Label>Mês de encerramento da cobrança</Label>
          <SearchableSelect
            value={mesFim}
            options={MES_FIM_OPCOES}
            onChange={(v) => setMesFim(v || "6")}
            isSearchable={false}
            isClearable={false}
            inputId="mensalidade-mes-fim"
            name="mensalidade-mes-fim"
          />
          <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
            Como nem todos os níveis académicos terminam as aulas no mesmo mês, é preciso definir em que mês a cobrança da mensalidade desta configuração termina — a partir desse mês, a mensalidade deixa de ser cobrada até o próximo ano letivo.
          </p>
          <Label>Métodos de pagamento aceites</Label>
          <MetodosPagamentoCheckboxes kind="mensalidade" selected={form.metodos_pagamento} onToggle={(m) => setForm((prev) => ({ ...prev, metodos_pagamento: prev.metodos_pagamento.includes(m) ? prev.metodos_pagamento.filter((x) => x !== m) : [...prev.metodos_pagamento, m] }))} />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={ctx.bloquear || (existe && !form.modo_vigencia) || salvar.loading || atualizar.loading} startIcon={<Icon icon="mdi:content-save-outline" width={16} />}>
              {existe ? "Salvar alterações" : "Salvar nova versão"}
            </Button>
            <Link href="/financas/configuracoes/mensalidade" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300">
              Voltar para a lista de mensalidades
            </Link>
          </div>
        </div>
      </SubtelaPanel>
    </FinanceiroAcessoGuard>
  );
}

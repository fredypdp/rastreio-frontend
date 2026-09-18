"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/form/Label";
import { financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { SubtelaPanel } from "@/components/paineis/financeiroShared";
import {
  FinanceiroAcessoGuard, AvisoCredenciais, ManualDeFuncionamento, NivelCamposFields, MetodosPagamentoCheckboxes,
  validarValorEAno, useFinanceiroNivelContext, type NivelFormState, type FormFieldErrors,
} from "@/components/paineis/financeiroNivelShared";
import type { FinanceiroModoVigencia, MatriculaConfiguracaoInput } from "@/types/api";

/** /financas/configuracoes/taxa-matricula/criar (Tarefa 11) — antes era o formulário embutido na subtela "matricula"; agora é a página "Definir Nova Taxa". */
export default function TaxaMatriculaCriarPainel() {
  const ctx = useFinanceiroNivelContext();
  const [form, setForm] = useState<NivelFormState>({ nivel: "fundamental", ano_academico: "", curso_id: "", valor: "", metodos_pagamento: ["GPO"], modo_vigencia: "" });
  const [errors, setErrors] = useState<FormFieldErrors>({});
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const salvar = useApi(financeiroService.configurarMatricula);
  const atualizar = useApi(financeiroService.atualizarConfiguracaoMatricula);

  useEffect(() => {
    if (ctx.niveisDisponiveis.length === 0) return;
    setForm((prev) => (ctx.niveisDisponiveis.includes(prev.nivel) ? prev : { ...prev, nivel: ctx.niveisDisponiveis[0], curso_id: "", ano_academico: "" }));
  }, [ctx.niveisDisponiveis]);

  const submit = async () => {
    const errs = validarValorEAno(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      if (!ctx.codigoAcademia) throw new Error("Academia não identificada.");
      const p: MatriculaConfiguracaoInput = {
        codigo_academia: ctx.codigoAcademia,
        nivel: form.nivel,
        ano_academico: form.ano_academico,
        curso_id: form.nivel === "fundamental" ? undefined : form.curso_id,
        valor: Number(form.valor),
        metodos_pagamento: form.metodos_pagamento,
        modo_vigencia: form.modo_vigencia as FinanceiroModoVigencia,
      };
      const existe = (ctx.matriculasApi.data?.configuracoes ?? []).some((c) =>
        c.nivel === form.nivel && (form.nivel === "fundamental" ? c.ano_academico === form.ano_academico : c.curso_id === form.curso_id && c.ano_academico === form.ano_academico));
      const resultado = await (existe ? atualizar.execute(p) : salvar.execute(p));
      const resumo = resultado?.repricing_pendentes;
      setAlert({
        variant: "success",
        message: resumo
          ? `Configuração de matrícula versionada com sucesso. ${resumo.atualizadas} solicitação(ões) já aprovada(s) foram atualizadas para o novo valor${resumo.ignoradas ? `; ${resumo.ignoradas} não foram alteradas por já terem cobrança em aberto` : ""}. Você pode configurar outro nível/curso agora, ou voltar para a lista.`
          : "Configuração de matrícula versionada com sucesso. Você pode configurar outro nível/curso agora, ou voltar para a lista.",
      });
      await ctx.reload();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível salvar matrícula.") });
    }
  };

  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <SubtelaPanel title="Definir Nova Taxa" icon="mdi:school-outline" onVoltar="/financas/configuracoes/taxa-matricula">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>O <b>valor</b> definido aqui passa a valer a partir de agora, para novas solicitações de matrícula do nível/ano/curso escolhido.</li>
            <li>Escolha com atenção <b>o que acontece com quem já está pendente</b>: isso decide se matrículas já aprovadas (ainda não pagas) também mudam para o novo valor, ou se continuam no valor antigo.</li>
            <li>Só é possível salvar depois de aderir ao Gateway de Pagamento Online e escolher pelo menos um método de pagamento aceite.</li>
          </ul>
        </ManualDeFuncionamento>
        {alert && <Alert variant={alert.variant} title="Finanças" message={alert.message} />}
        {ctx.bloquear && <AvisoCredenciais />}
        <div className="grid gap-4">
          <NivelCamposFields kind="matricula" form={form} errors={errors} setForm={setForm} niveisDisponiveis={ctx.niveisDisponiveis} cursos={ctx.cursos} anosAcademicosAcademia={ctx.anosAcademicosAcademia} />
          <Label>Métodos de pagamento aceites</Label>
          <MetodosPagamentoCheckboxes kind="matricula" selected={form.metodos_pagamento} onToggle={(m) => setForm((prev) => ({ ...prev, metodos_pagamento: prev.metodos_pagamento.includes(m) ? prev.metodos_pagamento.filter((x) => x !== m) : [...prev.metodos_pagamento, m] }))} />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={ctx.bloquear || !form.modo_vigencia || salvar.loading || atualizar.loading} startIcon={<Icon icon="mdi:content-save-outline" width={16} />}>
              Salvar nova versão
            </Button>
            <Link href="/financas/configuracoes/taxa-matricula" className="text-sm font-medium text-gray-600 underline dark:text-gray-300">
              Voltar para a lista de taxas
            </Link>
          </div>
        </div>
      </SubtelaPanel>
    </FinanceiroAcessoGuard>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import { financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { SubtelaPanel } from "@/components/paineis/financeiroShared";
import {
  FinanceiroAcessoGuard, AvisoCredenciais, ManualDeFuncionamento, NivelCamposFields, MetodosPagamentoCheckboxes, metodosValidos,
  validarValorEAno, existeConfiguracaoParaEscopo, useFinanceiroNivelContext, MES_FIM_OPCOES, type NivelFormState, type FormFieldErrors,
} from "@/components/paineis/financeiroNivelShared";
import type { FinanceiroModoVigencia, MensalidadeConfiguracaoInput } from "@/types/api";

/**
 * /financas/configuracoes/mensalidade/criar (Tarefa 16) — página "Definir
 * Nova Mensalidade". Nível/curso/ano começam em branco (ou no primeiro
 * nível disponível) para o usuário escolher do zero. Se o combo
 * nível+ano+curso escolhido aqui já tiver uma configuração salva (isso
 * pode acontecer mesmo aqui, sem vir de nenhum link — o usuário está
 * livre para escolher qualquer combinação), a tela se comporta como uma
 * edição (pergunta "o que acontece com quem já está pendente?" e salva
 * como nova versão) — mesmo comportamento de antes, só que agora quem
 * chega aqui a partir do cartão "Editar" de uma configuração já existente
 * vai para uma rota própria: ver MensalidadeEditarPainel.tsx
 * (/financas/configuracoes/mensalidade/editar). Antes as duas ficavam
 * nesta mesma rota, diferenciadas só por um `?nivel=` opcional na URL.
 */
export default function MensalidadeCriarPainel() {
  const ctx = useFinanceiroNivelContext();
  const [form, setForm] = useState<NivelFormState>({ nivel: "fundamental", ano_academico: "", curso_id: "", valor: "", metodos_pagamento: ["GPO"], modo_vigencia: "" });
  const [mesFim, setMesFim] = useState("6");
  const [errors, setErrors] = useState<FormFieldErrors>({});
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const salvar = useApi(financeiroService.configurarMensalidade);
  const atualizar = useApi(financeiroService.atualizarConfiguracaoMensalidade);
  const configuracoes = useMemo(() => ctx.mensalidadesApi.data?.configuracoes ?? [], [ctx.mensalidadesApi.data]);

  useEffect(() => {
    if (ctx.niveisDisponiveis.length === 0) return;
    setForm((prev) => (ctx.niveisDisponiveis.includes(prev.nivel) ? prev : { ...prev, nivel: ctx.niveisDisponiveis[0], curso_id: "", ano_academico: "" }));
  }, [ctx.niveisDisponiveis]);

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
        // só o que o provedor ativo suporta (o backend recusa o resto)
        metodos_pagamento: metodosValidos(form.metodos_pagamento, ctx.metodosSuportados),
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
      <SubtelaPanel title="Definir Nova Mensalidade" icon="mdi:calendar-month-outline" onVoltar="/financas/configuracoes/mensalidade">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>O <b>valor</b> definido aqui passa a valer a partir de agora, para todos os estudantes do nível/ano/curso escolhido.</li>
            <li>Ao escolher um nível/ano/curso que já tem uma mensalidade configurada, escolha com atenção <b>o que acontece com quem já está pendente</b>: isso decide se cobranças de meses anteriores (ainda não pagas) também mudam para o novo valor, ou se continuam no valor antigo. Na primeira configuração de um nível/ano/curso isso não é perguntado — o valor novo já vale para tudo, já que ainda não havia nenhum valor definido antes.</li>
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
            escopoFixo={false}
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
          <MetodosPagamentoCheckboxes kind="mensalidade" suportados={ctx.metodosSuportados} provedorNome={ctx.provedorAtivoNome} selected={form.metodos_pagamento} onToggle={(m) => setForm((prev) => ({ ...prev, metodos_pagamento: prev.metodos_pagamento.includes(m) ? prev.metodos_pagamento.filter((x) => x !== m) : [...prev.metodos_pagamento, m] }))} />
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

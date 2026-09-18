"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import { SubtelasMenu } from "@/components/paineis/financeiroShared";
import { FinanceiroAcessoGuard, AvisoCredenciais, ManualDeFuncionamento, ConfiguracoesSalvasTable, useFinanceiroNivelContext } from "@/components/paineis/financeiroNivelShared";

/**
 * /financas/configuracoes/taxa-matricula (Tarefa 11). Antes era a subtela
 * "matricula" — que misturava, numa única tela, o formulário de criação e a
 * lista de configurações já feitas. Agora o formulário vive numa página
 * própria (/taxa-matricula/criar) e esta página passa a ser só a lista + o
 * card "Definir Nova Taxa" (só 1 card — taxa de matrícula não tem
 * "início de cobrança", que é um conceito exclusivo de mensalidade).
 */
export default function TaxaMatriculaListaPainel() {
  const ctx = useFinanceiroNivelContext();
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <div className="space-y-6">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Cada configuração enviada cria uma <b>nova versão vigente a partir de agora</b> — não edita nem apaga versões passadas.</li>
            <li>A configuração é específica por <b>nível de ensino</b> e, dentro dele, por <b>ano/classe</b> (Ensino Primário) ou por <b>curso e ano</b> (Iº Ciclo, Médio ou Superior).</li>
            <li>Se <b>nenhuma</b> configuração existir para a combinação nível/ano/curso de uma solicitação, a matrícula daquele candidato é <b>gratuita</b> e a academia aprova direto, sem cobrança.</li>
            <li>Pagamentos só podem ser feitos pelos métodos habilitados na criação de cada taxa.</li>
          </ul>
        </ManualDeFuncionamento>
        {alert && <Alert variant={alert.variant} title="Finanças" message={alert.message} />}
        <SubtelasMenu
          opcoes={[
            { id: "criar", icon: "mdi:school-outline", label: "Definir Nova Taxa", descricao: "Definir o valor e os métodos aceites por ano/curso.", href: "/financas/configuracoes/taxa-matricula/criar", disabled: ctx.bloquear },
          ]}
        />
        {ctx.bloquear && <AvisoCredenciais />}
        <div className="border-t border-gray-100 pt-5 dark:border-white/[0.05]">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Configurações já feitas</h3>
          <ConfiguracoesSalvasTable
            linhas={ctx.matriculasApi.data?.configuracoes ?? []}
            comMesFim={false}
            kind="matricula"
            cursos={ctx.cursos}
            codigoAcademia={ctx.codigoAcademia}
            reload={ctx.reload}
            onAlert={setAlert}
          />
        </div>
      </div>
    </FinanceiroAcessoGuard>
  );
}

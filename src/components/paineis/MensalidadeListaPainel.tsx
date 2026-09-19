"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@/components/ui/alert/Alert";
import Icon from "@/components/ui/Icon";
import { SubtelasMenu } from "@/components/paineis/financeiroShared";
import { FinanceiroAcessoGuard, AvisoCredenciais, ManualDeFuncionamento, ConfiguracoesDefinidasCards, useFinanceiroNivelContext } from "@/components/paineis/financeiroNivelShared";

/**
 * /financas/configuracoes/mensalidade (Tarefa 12). Antes era a subtela
 * "mensalidade" — que misturava, numa única tela, o formulário de criação e
 * a lista de configurações já feitas. Agora o formulário de criação vive
 * numa página própria (/mensalidade/criar) e esta página passa a ser só a
 * lista + os cards de navegação (Início de cobrança e Definir Nova
 * Mensalidade).
 *
 * A antiga tabela "Configurações já feitas" virou cartões "Mensalidades
 * definidas" (ConfiguracoesDefinidasCards) — só aparece quando existe pelo
 * menos uma configuração; com zero, o próprio componente já mostra "Nenhuma
 * configuração salva ainda." sem cabeçalho nenhum.
 */
export default function MensalidadeListaPainel() {
  const ctx = useFinanceiroNivelContext();
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const configuracoes = ctx.mensalidadesApi.data?.configuracoes ?? [];

  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <div className="space-y-6">
        <Link href="/financas/configuracoes" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300">
          <Icon icon="mdi:arrow-left" width={16} /> Voltar
        </Link>
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Cada configuração enviada cria uma <b>nova versão vigente a partir de agora</b> — não edita nem apaga versões passadas. Meses já vencidos continuam usando o valor que estava vigente na época em que venceram.</li>
            <li>A configuração é específica por <b>nível de ensino</b> e, dentro dele, por <b>ano/classe</b> (Ensino Primário) ou por <b>curso e ano</b> (Iº Ciclo, Médio ou Superior) — por isso pode (e normalmente deve) haver várias configurações vigentes ao mesmo tempo, uma por combinação.</li>
            <li>Use <b>Início de cobrança</b> quando o ano letivo já estiver em andamento na hora de configurar a mensalidade pela primeira vez (ex.: a academia aderiu ao Spuri em novembro, já em pleno ano letivo).</li>
            <li>Pagamentos só podem ser feitos pelos métodos habilitados na criação de cada mensalidade.</li>
          </ul>
        </ManualDeFuncionamento>
        {alert && <Alert variant={alert.variant} title="Finanças" message={alert.message} />}
        <SubtelasMenu
          opcoes={[
            { id: "inicio-cobranca", icon: "mdi:calendar-start", label: "Início de cobrança", descricao: "Ajustar a partir de qual mês a propina passa a valer no ano letivo atual.", href: "/financas/configuracoes/mensalidade/inicio-cobranca", disabled: ctx.bloquear },
            { id: "criar", icon: "mdi:calendar-month-outline", label: "Definir Nova Mensalidade", descricao: "Definir o valor e os métodos aceites por ano/curso.", href: "/financas/configuracoes/mensalidade/criar", disabled: ctx.bloquear },
          ]}
        />
        {ctx.bloquear && <AvisoCredenciais />}
        {configuracoes.length > 0 && (
          <div className="border-t border-gray-100 pt-5 dark:border-white/[0.05]">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Mensalidades definidas</h3>
            <ConfiguracoesDefinidasCards
              linhas={configuracoes}
              comMesFim
              kind="mensalidade"
              cursos={ctx.cursos}
              codigoAcademia={ctx.codigoAcademia}
              reload={ctx.reload}
              onAlert={setAlert}
            />
          </div>
        )}
      </div>
    </FinanceiroAcessoGuard>
  );
}

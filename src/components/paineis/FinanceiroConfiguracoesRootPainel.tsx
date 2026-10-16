"use client";

import Link from "next/link";
import { SubtelasMenu } from "@/components/paineis/financeiroShared";
import { FinanceiroAcessoGuard, ManualDeFuncionamento, useFinanceiroNivelContext } from "@/components/paineis/financeiroNivelShared";

/**
 * Página raiz de /financas/configuracoes (Tarefas 11 e 30). Áreas de configuração,
 * cada uma a sua própria página: Provedor de pagamento (Tarefa 30, antes em
 * /financas/credenciais), Mensalidade e Taxa de Matrícula. O "Início de cobrança"
 * vive só dentro de Mensalidade, já que só faz sentido para mensalidade.
 *
 * O provedor de pagamento é a única área que existe também para o admin FPP (o
 * provedor do contexto "Spuri (Global)"); Mensalidade e Taxa de Matrícula
 * pertencem a cada academia.
 *
 * "Anular ou reativar obrigações" saiu daqui de vez — mudou-se para a nova
 * página /financas/gestao-cobrancas.
 */
const CARD_PROVEDOR = { id: "provedor", icon: "mdi:bank-outline", label: "Provedor de pagamento", descricao: "Escolher o provedor de pagamento e configurar as suas credenciais.", href: "/financas/configuracoes/provedor" };

export default function FinanceiroConfiguracoesRootPainel() {
  const ctx = useFinanceiroNivelContext();

  if (!ctx.loading && ctx.isFpp) {
    return (
      <div className="space-y-6">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Aqui você define o <b>provedor de pagamento do Spuri</b> (contexto global) e as suas credenciais.</li>
            <li>Mensalidade e Taxa de Matrícula são configuradas por <b>cada academia</b>, no seu próprio painel — não existem configurações próprias do Spuri para elas.</li>
          </ul>
        </ManualDeFuncionamento>
        <SubtelasMenu opcoes={[CARD_PROVEDOR]} />
      </div>
    );
  }

  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <div className="space-y-6">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Aqui você escolhe o <b>provedor de pagamento</b> e define quanto cobrar de <b>Mensalidade</b> e de <b>Taxa de Matrícula</b>, por nível de ensino e, quando aplicável, por curso e ano.</li>
            <li>Cada configuração vale <b>a partir do momento em que é salva</b> — o que já foi cobrado antes não muda.</li>
            <li>Sem nenhuma configuração de matrícula, a matrícula é <b>gratuita</b> por padrão.</li>
            <li>É preciso <b>aderir ao Gateway de Pagamento Online</b> e definir o <b>provedor de pagamento</b> antes de conseguir configurar qualquer valor — veja <Link href="/financas/configuracoes/provedor" className="font-medium underline">Provedor de pagamento</Link>.</li>
            <li>Os métodos de pagamento que você pode habilitar são os que o provedor escolhido suporta.</li>
          </ul>
        </ManualDeFuncionamento>
        <SubtelasMenu
          opcoes={[
            CARD_PROVEDOR,
            { id: "mensalidade", icon: "mdi:calendar-month-outline", label: "Mensalidade", descricao: "Definir o valor e os métodos aceites por ano/curso.", href: "/financas/configuracoes/mensalidade" },
            { id: "taxa-matricula", icon: "mdi:school-outline", label: "Taxa de Matrícula", descricao: "Definir o valor e os métodos aceites por ano/curso.", href: "/financas/configuracoes/taxa-matricula" },
          ]}
        />
      </div>
    </FinanceiroAcessoGuard>
  );
}

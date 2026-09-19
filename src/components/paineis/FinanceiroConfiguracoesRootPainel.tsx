"use client";

import Link from "next/link";
import { SubtelasMenu } from "@/components/paineis/financeiroShared";
import { FinanceiroAcessoGuard, ManualDeFuncionamento, useFinanceiroNivelContext } from "@/components/paineis/financeiroNivelShared";

/**
 * Página raiz de /financas/configuracoes (Tarefa 11). Só existem 2 áreas de
 * configuração — Mensalidade e Taxa de Matrícula, cada uma agora
 * é a sua própria página (não mais uma subtela) — e o "Início de cobrança"
 * (que antes era um card aqui) passou a viver só dentro de Mensalidade,
 * já que só faz sentido para mensalidade.
 *
 * "Anular ou reativar obrigações" saiu daqui de vez — mudou-se para a nova
 * página /financas/gestao-cobrancas.
 */
export default function FinanceiroConfiguracoesRootPainel() {
  const ctx = useFinanceiroNivelContext();

  return (
    <FinanceiroAcessoGuard ctx={ctx}>
      <div className="space-y-6">
        <ManualDeFuncionamento>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Aqui você define quanto cobrar de <b>Mensalidade</b> e de <b>Taxa de Matrícula</b>, por nível de ensino e, quando aplicável, por curso e ano.</li>
            <li>Cada configuração vale <b>a partir do momento em que é salva</b> — o que já foi cobrado antes não muda.</li>
            <li>Sem nenhuma configuração de matrícula, a matrícula é <b>gratuita</b> por padrão.</li>
            <li>É preciso <b>aderir ao Gateway de Pagamento Online</b> antes de conseguir configurar qualquer valor — veja <Link href="/financas/credenciais" className="font-medium underline">Credenciais</Link>.</li>
          </ul>
        </ManualDeFuncionamento>
        <SubtelasMenu
          opcoes={[
            { id: "mensalidade", icon: "mdi:calendar-month-outline", label: "Mensalidade", descricao: "Definir o valor e os métodos aceites por ano/curso.", href: "/financas/configuracoes/mensalidade" },
            { id: "taxa-matricula", icon: "mdi:school-outline", label: "Taxa de Matrícula", descricao: "Definir o valor e os métodos aceites por ano/curso.", href: "/financas/configuracoes/taxa-matricula" },
          ]}
        />
      </div>
    </FinanceiroAcessoGuard>
  );
}

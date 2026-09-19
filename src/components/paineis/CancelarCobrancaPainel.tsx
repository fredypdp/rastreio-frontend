"use client";

import { useEffect, useState } from "react";
import { consultasService, financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserType } from "@/hooks/useRoutePermission";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import Alert from "@/components/ui/alert/Alert";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import {
  CobrancasTable, EmptyState, LoadingState, SubtelaDetalheCobranca, SubtelaPanel,
} from "@/components/paineis/financeiroShared";
import type { PagamentoResumo } from "@/types/api";

/**
 * /financas/gestao-cobrancas/cancelar-cobranca (Tarefa 11) — página nova.
 * Diferente de "Anular obrigação" (que anula uma mensalidade pontual,
 * mesmo que nenhuma cobrança real tenha sido gerada ainda), esta tela
 * cancela uma cobrança REAL já gerada/tentada junto à AppyPay (referência,
 * QR code, etc.) — a mesma ação já disponível em Finanças &gt; Pagamentos,
 * aqui isolada por estudante para um acesso mais direto a partir da gestão
 * de cobranças.
 *
 * Reaproveita CobrancasTable (que já sabe quais estados são canceláveis e
 * já tem o próprio modal de confirmação com motivo opcional) e
 * SubtelaDetalheCobranca (mesma subtela de detalhe usada em Finanças &gt;
 * Pagamentos) — nenhum componente novo de tabela/detalhe foi criado.
 */
export default function CancelarCobrancaPainel() {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";
  const codigoAcademia = user?.academia?.codigo_academia ?? "";

  const [estudantes, setEstudantes] = useState<{ value: string; label: string }[]>([]);
  const [codigoEstudante, setCodigoEstudante] = useState("");
  const [selecionada, setSelecionada] = useState<PagamentoResumo | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const cobrancas = useApi(financeiroService.consultarCobrancasEstudante);
  const cancelApi = useApi(financeiroService.cancelarCobranca);

  useEffect(() => {
    if (!codigoAcademia) return;
    consultasService.listarEstudantes({ codigo_academia: codigoAcademia, limit: 300, offset: 0 })
      .then((r) => setEstudantes((r.estudantes ?? []).map((e: any) => ({ value: e.codigo_estudante, label: `${e.nome ?? e.codigo_estudante} (${e.codigo_estudante})` }))))
      .catch(() => setEstudantes([]));
  }, [codigoAcademia]);

  const carregar = (codigo: string) => {
    setAlert(null);
    setSelecionada(null);
    if (!codigo) return;
    cobrancas.execute(codigo, { limit: 100, offset: 0 }).catch((e) => setAlert(formatApiError(e, "Não foi possível carregar as cobranças deste estudante.")));
  };

  if (loading) return <LoadingState label="Carregando..." />;
  if (!isAcademia && !isFpp) return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} message="A gestão de cobranças é exclusiva de administradores FPP e academias." />;
  if (isFpp) return <UnauthorizedAccess requiredTypes={["Academia"]} message="A gestão de cobranças pertence a cada academia — indisponível para o administrador FPP." />;

  if (selecionada) {
    return <SubtelaDetalheCobranca cobranca={selecionada} onVoltar={() => setSelecionada(null)} mostrarDadosEstudante={false} />;
  }

  const pagamentos = cobrancas.data?.pagamentos ?? [];

  return (
    <SubtelaPanel title="Cancelar cobrança" icon="mdi:receipt-text-remove-outline" onVoltar="/financas/gestao-cobrancas">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Cancele uma cobrança já gerada (referência, QR code, etc.) de um estudante específico — cobranças pagas, já canceladas ou expiradas não podem ser canceladas de novo.
      </p>
      {alert && <Alert variant="error" title="Gestão de cobranças" message={alert} />}
      <div className="mt-4 max-w-md">
        <Label>Estudante</Label>
        <SearchableSelect
          value={codigoEstudante}
          options={estudantes}
          onChange={(v) => { setCodigoEstudante(v); carregar(v); }}
          placeholder="Buscar estudante..."
          isClearable
        />
      </div>
      <div className="mt-4">
        {!codigoEstudante ? (
          <EmptyState title="Selecione um estudante." description="Escolha um estudante acima para ver as cobranças dele." />
        ) : cobrancas.loading ? (
          <LoadingState label="Carregando cobranças..." />
        ) : pagamentos.length > 0 ? (
          <CobrancasTable
            rows={pagamentos}
            onOpen={setSelecionada}
            onCancelar={async (pagamento, motivo) => {
              await cancelApi.execute(pagamento.id, motivo);
              await carregar(codigoEstudante);
            }}
          />
        ) : (
          <EmptyState title="Nenhuma cobrança encontrada." description="Este estudante ainda não tem nenhuma cobrança gerada." />
        )}
      </div>
    </SubtelaPanel>
  );
}

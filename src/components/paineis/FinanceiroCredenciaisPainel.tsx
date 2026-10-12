"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, consultasService, financeiroService, useApi } from "@/lib/api";
import { formatApiError } from "@/lib/api/client";
import { useUserType } from "@/hooks/useRoutePermission";
import type {
  AcademiaDetalhada,
  CriarFinanceiroCredencialRequest,
  FinanceiroContextoTipo,
  FinanceiroCredencial,
  FinanceiroProvedor,
  FinanceiroProvedorDoContexto,
  ListarFinanceiroCredenciaisParams,
} from "@/types/api";
import UnauthorizedAccess from "@/components/guards/UnauthorizedAccess";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/Icon";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog, METODO_PAGAMENTO_LABEL } from "./financeiroShared";

type AlertState = { variant: "success" | "error" | "warning" | "info"; message: string } | null;
type ContextFilter = "todas" | "spuri" | "academia";
type ContextoFinanceiro = { contexto_tipo: FinanceiroContextoTipo; codigo_academia?: string };

/**
 * Valores digitados no formulário, indexados pelas chaves de
 * `campos_credenciais` do provedor escolhido (GET /financeiro/provedores). O
 * formulário não conhece os campos de nenhum provedor: eles vêm do catálogo.
 * NÃO inclui segredo nem cabeçalho de webhook: o backend nunca recebeu esses
 * campos — para os provedores que autenticam webhooks por segredo, o segredo
 * é gerado automaticamente na primeira configuração da credencial e o nome do
 * cabeçalho é a constante fixa "X-Spuri-Webhook-Secret". Ver
 * WebhookSecretPanel abaixo para consultar/rotacionar o segredo depois.
 */
type CredencialFormData = Record<string, string>;
type FormErrors = Record<string, string>;

const WEBHOOK_HEADER_NAME = "X-Spuri-Webhook-Secret";
const PROVEDOR_APPYPAY = "APPYPAY";

function LoadingState() {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
        Carregando provedores e credenciais...
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-AO", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function getErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 403) return "Você não tem permissão para configurar credenciais deste contexto.";
    if (err.status === 409) return "Já existe uma operação em andamento para esta credencial, tente novamente em instantes.";
    if (err.status === 503) return "Não foi possível confirmar com o provedor de pagamento agora. Tente novamente mais tarde.";
  }
  return formatApiError(err, "Não foi possível salvar a credencial.");
}

function contextParams(filter: ContextFilter, codigoAcademia: string): ListarFinanceiroCredenciaisParams | undefined {
  if (filter === "spuri") return { contexto_tipo: "spuri" };
  if (filter === "academia" && codigoAcademia) return { contexto_tipo: "academia", codigo_academia: codigoAcademia };
  return undefined;
}

function emptyForm(provedor: FinanceiroProvedor | undefined): CredencialFormData {
  return Object.fromEntries((provedor?.campos_credenciais ?? []).map((campo) => [campo.chave, ""]));
}

function nomeDoProvedor(catalogo: FinanceiroProvedor[], id: string) {
  return catalogo.find((p) => p.id === id)?.nome ?? id;
}

export default function FinanceiroCredenciaisPainel() {
  const { user, isAdmin, isAcademia, loading } = useUserType();
  const isFpp = isAdmin && user?.admin?.role === "fpp";

  const [alert, setAlert] = useState<AlertState>(null);
  const [contextFilter, setContextFilter] = useState<ContextFilter>("todas");
  const [codigoAcademia, setCodigoAcademia] = useState("");
  const [academias, setAcademias] = useState<AcademiaDetalhada[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceiroCredencial | null>(null);
  const [formProvedor, setFormProvedor] = useState("");
  const [formData, setFormData] = useState<CredencialFormData>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  // Erro/sucesso do próprio formulário — renderizado DENTRO do card do
  // formulário (não no topo da página), para que o usuário veja o erro
  // exatamente onde ele foi disparado.
  const [formAlert, setFormAlert] = useState<AlertState>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  // Segredo do webhook devolvido UMA VEZ pelo backend, na criação da
  // credencial (CredencialCriada.WebhookSecret). Some depois de fechado — para
  // vê-lo de novo, use "Consultar segredo" na linha da tabela
  // (WebhookSecretPanel).
  const [novoWebhookSecret, setNovoWebhookSecret] = useState<{ segredo: string; provedor: string } | null>(null);
  // Credencial selecionada para remoção — controla a exibição do
  // ConfirmDialog (ver handleRemover, abaixo).
  const [credencialParaRemover, setCredencialParaRemover] = useState<FinanceiroCredencial | null>(null);
  // Provedor que o usuário quer tornar ativo — controla o ConfirmDialog de troca.
  const [provedorParaAtivar, setProvedorParaAtivar] = useState<FinanceiroProvedorDoContexto | null>(null);

  const { execute: listarProvedores, data: catalogoData } = useApi(financeiroService.listarProvedores);
  const { execute: consultarProvedor, data: estadoProvedor } = useApi(financeiroService.consultarProvedor);
  const { execute: definirProvedor } = useApi(financeiroService.definirProvedor);
  const { execute: listarCredenciais, data: credenciais, loading: listando } = useApi(financeiroService.listarCredenciais);
  const { execute: criarCredencial, loading: criando } = useApi(financeiroService.criarCredencial);
  const { execute: atualizarCredencial, loading: atualizando } = useApi(financeiroService.atualizarCredencial);
  const { execute: removerCredencial } = useApi(financeiroService.removerCredencial);
  const { execute: listarAcademias, loading: listandoAcademias } = useApi(consultasService.listarAcademias);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [ativandoId, setAtivandoId] = useState<string | null>(null);

  const saving = criando || atualizando;
  const catalogo = useMemo(() => catalogoData ?? [], [catalogoData]);

  const academiaOptions = useMemo(() => academias.map((academia) => ({
    value: academia.codigo_academia,
    label: `${academia.nome} (${academia.codigo_academia})`,
  })), [academias]);

  const activeParams = useCallback((): ListarFinanceiroCredenciaisParams | undefined => {
    if (isAcademia) return undefined;
    return contextParams(contextFilter, codigoAcademia);
  }, [codigoAcademia, contextFilter, isAcademia]);

  // Contexto único sobre o qual a tela age (provedor ativo e definição de
  // provedor só fazem sentido para UM contexto). Com o filtro "Todas" não há.
  const contextoBase = useMemo((): ContextoFinanceiro | null => {
    if (isAcademia) return user?.academia?.codigo_academia ? { contexto_tipo: "academia", codigo_academia: user.academia.codigo_academia } : null;
    if (contextFilter === "spuri") return { contexto_tipo: "spuri" };
    if (contextFilter === "academia" && codigoAcademia) return { contexto_tipo: "academia", codigo_academia: codigoAcademia };
    return null;
  }, [codigoAcademia, contextFilter, isAcademia, user?.academia?.codigo_academia]);

  const carregarTudo = useCallback(async () => {
    if (!isAcademia && !isFpp) return;
    if (isFpp && contextFilter === "academia" && !codigoAcademia) return;
    try {
      await Promise.all([
        listarProvedores(),
        listarCredenciais(activeParams()),
        contextoBase ? consultarProvedor(contextoBase) : Promise.resolve(undefined),
      ]);
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível carregar os provedores e as credenciais.") });
    }
  }, [activeParams, codigoAcademia, consultarProvedor, contextFilter, contextoBase, isAcademia, isFpp, listarCredenciais, listarProvedores]);

  useEffect(() => {
    if (!isFpp) return;
    listarAcademias({ status: "ativo" })
      .then((response) => setAcademias(response?.academias ?? []))
      .catch((err) => setAlert({ variant: "error", message: formatApiError(err, "Não foi possível carregar as academias.") }));
  }, [isFpp, listarAcademias]);

  useEffect(() => {
    if (!loading) void carregarTudo();
  }, [carregarTudo, loading]);

  const provedorFormInfo = catalogo.find((p) => p.id === formProvedor);
  // Estado do contexto só é válido para o contexto atualmente selecionado.
  const estado = contextoBase && estadoProvedor && estadoProvedor.contexto_tipo === contextoBase.contexto_tipo && (estadoProvedor.codigo_academia ?? "") === (contextoBase.codigo_academia ?? "") ? estadoProvedor : null;
  const provedorAtivo = estado?.provedor_ativo ? catalogo.find((p) => p.id === estado.provedor_ativo) ?? null : null;

  const resetForm = (provedor: FinanceiroProvedor | undefined) => {
    setFormProvedor(provedor?.id ?? "");
    setFormData(emptyForm(provedor));
    setFormErrors({});
    setFormAlert(null);
    setShowSecrets({});
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    resetForm(undefined);
  };

  const openCreate = (provedorId?: string) => {
    setEditing(null);
    const inicial = catalogo.find((p) => p.id === provedorId) ?? provedorAtivo ?? catalogo[0];
    resetForm(inicial);
    setFormOpen(true);
  };

  const openEdit = (credencial: FinanceiroCredencial) => {
    setEditing(credencial);
    resetForm(catalogo.find((p) => p.id === credencial.provedor));
    setFormProvedor(credencial.provedor);
    setFormOpen(true);
  };

  const resolveContext = (): ContextoFinanceiro | null => {
    if (isAcademia) return { contexto_tipo: "academia", codigo_academia: user?.academia?.codigo_academia };
    if (editing) return { contexto_tipo: editing.contexto_tipo, codigo_academia: editing.codigo_academia };
    if (contextFilter === "spuri") return { contexto_tipo: "spuri" };
    if (contextFilter === "academia" && codigoAcademia) return { contexto_tipo: "academia", codigo_academia: codigoAcademia };
    return null;
  };

  const validate = () => {
    const errors: FormErrors = {};
    if (!provedorFormInfo) errors.provedor = "Selecione um provedor de pagamento.";
    (provedorFormInfo?.campos_credenciais ?? []).forEach((campo) => {
      if (campo.obrigatorio && !(formData[campo.chave] ?? "").trim()) errors[campo.chave] = "Campo obrigatório.";
    });
    if (!resolveContext()) errors.contexto = "Selecione um contexto antes de salvar.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormAlert(null);
    if (!validate() || !provedorFormInfo) return;
    const context = resolveContext();
    if (!context) return;
    const payload: CriarFinanceiroCredencialRequest = {
      ...context,
      provedor: provedorFormInfo.id,
      credenciais: Object.fromEntries(provedorFormInfo.campos_credenciais.map((campo) => [campo.chave, (formData[campo.chave] ?? "").trim()])),
    };

    try {
      if (editing) {
        await atualizarCredencial(editing.id, payload);
        setAlert({ variant: "success", message: "Credencial atualizada com sucesso." });
        closeForm();
      } else {
        const criada = await criarCredencial(payload);
        setAlert({ variant: "success", message: "Credencial configurada com sucesso." });
        closeForm();
        if (criada?.webhook_secret) setNovoWebhookSecret({ segredo: criada.webhook_secret, provedor: provedorFormInfo.nome });
      }
      await carregarTudo();
    } catch (err) {
      // Erro do envio: fica DENTRO do formulário (que continua aberto),
      // e não no topo da página — é ali que o usuário está olhando.
      setFormAlert({ variant: "error", message: getErrorMessage(err) });
    }
  };

  /**
   * Remove as credenciais de um provedor do contexto da linha clicada. Ação
   * destrutiva com consequência imediata — por isso passa por confirmação
   * explícita num modal (ConfirmDialog, aberto via credencialParaRemover),
   * mesmo padrão já usado em "Rotacionar" (WebhookSecretPanel) nesta mesma
   * tela. O backend recusa (409) enquanto o provedor tiver cobranças
   * pendentes no contexto: elas continuam sendo acompanhadas junto a ele. O
   * evento de configuração original nunca é apagado no backend.
   */
  const handleRemover = async (credencial: FinanceiroCredencial) => {
    setAlert(null);
    setRemovendoId(credencial.id);
    try {
      await removerCredencial({ contexto_tipo: credencial.contexto_tipo, codigo_academia: credencial.codigo_academia, provedor: credencial.provedor });
      setAlert({ variant: "success", message: "Credencial removida com sucesso." });
      await carregarTudo();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível remover a credencial.") });
    } finally {
      setRemovendoId(null);
    }
  };

  /** Define o provedor (único) das cobranças novas do contexto. */
  const handleDefinirProvedor = async (provedor: FinanceiroProvedorDoContexto) => {
    if (!contextoBase) return;
    setAlert(null);
    setAtivandoId(provedor.id);
    try {
      const r = await definirProvedor({ ...contextoBase, provedor: provedor.id });
      const anterior = r?.provedor_anterior ? nomeDoProvedor(catalogo, r.provedor_anterior) : "";
      const pendentes = r?.cobrancas_pendentes_no_anterior ?? 0;
      setAlert({
        variant: "success",
        message: pendentes > 0 && anterior
          ? `${provedor.nome} é agora o provedor de pagamento. ${pendentes} cobrança(s) pendente(s) continuam a ser acompanhadas no ${anterior} até serem resolvidas.`
          : `${provedor.nome} é agora o provedor de pagamento.`,
      });
      await carregarTudo();
    } catch (err) {
      setAlert({ variant: "error", message: formatApiError(err, "Não foi possível definir o provedor de pagamento.") });
    } finally {
      setAtivandoId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (!isAcademia && !isFpp) return <UnauthorizedAccess requiredTypes={["Admin FPP", "Academia"]} />;

  const rows = credenciais ?? [];
  const temProvedorAtivo = rows.some((c) => c.ativo);
  // Espelha authorizeFinanceScope no backend (internal/handlers/financeiro_handlers.go):
  // um admin FPP só tem permissão de ESCRITA (configurar/definir provedor/remover/rotacionar)
  // no contexto "spuri" — nunca no contexto de uma academia específica, mesmo que já
  // esteja filtrando por uma academia nesta tela. A academia sempre pode gerir o próprio
  // contexto. Fora isso, o backend responde 403; aqui evitamos oferecer a ação para não
  // gerar esse erro confuso.
  const canCreate = isAcademia || (isFpp && contextFilter === "spuri");
  const ativoAtual = estado?.provedores.find((p) => p.ativo) ?? null;

  return (
    <div className="space-y-6">
      {credencialParaRemover && (
        <ConfirmDialog
          title={`Remover credenciais ${nomeDoProvedor(catalogo, credencialParaRemover.provedor)}`}
          message={`Tem certeza que deseja remover as credenciais ${nomeDoProvedor(catalogo, credencialParaRemover.provedor)} ${credencialParaRemover.contexto_tipo === "spuri" ? "Spuri (Global)" : `da academia ${credencialParaRemover.codigo_academia ?? ""}`}? ${credencialParaRemover.ativo ? "Este é o provedor de pagamento atual: nenhuma cobrança nova poderá ser criada nesse contexto até definir outro provedor. " : ""}Se ainda houver cobranças pendentes neste provedor a remoção será recusada — elas continuam a ser acompanhadas junto a ele até serem resolvidas.`}
          confirmLabel="Remover"
          onConfirm={() => handleRemover(credencialParaRemover)}
          onClose={() => setCredencialParaRemover(null)}
        />
      )}
      {provedorParaAtivar && (
        <ConfirmDialog
          title={`Definir ${provedorParaAtivar.nome} como provedor`}
          message={`As cobranças novas passarão a ser geradas pelo ${provedorParaAtivar.nome}, com os métodos de pagamento que ele suporta (${provedorParaAtivar.metodos.map((m) => METODO_PAGAMENTO_LABEL[m] ?? m).join(", ")}). ${ativoAtual ? `As cobranças já criadas no ${ativoAtual.nome}${ativoAtual.cobrancas_pendentes > 0 ? ` (${ativoAtual.cobrancas_pendentes} pendente(s))` : ""} continuam a ser acompanhadas junto a ele até serem resolvidas; as credenciais dele são mantidas.` : ""}`}
          confirmLabel="Definir provedor"
          onConfirm={() => handleDefinirProvedor(provedorParaAtivar)}
          onClose={() => setProvedorParaAtivar(null)}
        />
      )}
      {alert && <Alert variant={alert.variant} title={alert.variant === "success" ? "Sucesso" : "Atenção"} message={alert.message} />}

      {novoWebhookSecret && (
        <NovoWebhookSecretAlert
          segredo={novoWebhookSecret.segredo}
          provedor={novoWebhookSecret.provedor}
          onFechar={() => setNovoWebhookSecret(null)}
        />
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Provedor de pagamento</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Escolha o provedor de serviços de pagamento (PSP) que vai receber os pagamentos e configure as suas credenciais para habilitar o seu módulo de finanças</p>
          </div>
          <Button size="sm" onClick={() => openCreate()} disabled={!canCreate || catalogo.length === 0} startIcon={<Icon icon="mdi:plus" width={16} />}>Configurar credenciais</Button>
        </div>

        {isFpp && (
          <div className="mt-5 grid gap-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03] lg:grid-cols-[260px_1fr]">
            <div>
              <Label>Contexto</Label>
              <Select
                key={contextFilter}
                defaultValue={contextFilter}
                options={[{ value: "todas", label: "Todas" }, { value: "spuri", label: "Spuri (Global)" }, { value: "academia", label: "Academia" }]}
                onChange={(value) => { setContextFilter(value as ContextFilter); setCodigoAcademia(""); }}
              />
            </div>
            {contextFilter === "academia" && (
              <div>
                <Label>Academia</Label>
                <SearchableSelect value={codigoAcademia} options={academiaOptions} onChange={setCodigoAcademia} placeholder={listandoAcademias ? "Carregando academias..." : "Selecione uma academia"} isDisabled={listandoAcademias} isClearable />
              </div>
            )}
          </div>
        )}
      </div>

      <AdesaoProvedorInfo temProvedorAtivo={temProvedorAtivo} provedor={formOpen ? provedorFormInfo : provedorAtivo ?? undefined} />

      {!formOpen && estado && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Provedores disponíveis</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {estado.provedor_ativo
              ? "Apenas o provedor ativo gera cobranças novas. Cobranças já criadas continuam a ser acompanhadas no provedor que as emitiu, mesmo depois de trocar de provedor."
              : "Ainda não há provedor definido. Configure as credenciais de um provedor e defina-o como o provedor de pagamento."}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {estado.provedores.map((provedor) => (
              <div key={provedor.id} className={`rounded-xl border p-4 ${provedor.ativo ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10" : "border-gray-200 dark:border-white/[0.08]"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{provedor.nome}</span>
                  {provedor.ativo && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">Provedor ativo</span>}
                  <span className={provedor.credenciais_configuradas ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300" : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"}>
                    {provedor.credenciais_configuradas ? "Credenciais configuradas" : "Sem credenciais"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Métodos suportados: {provedor.metodos.map((m) => METODO_PAGAMENTO_LABEL[m] ?? m).join(", ")}</p>
                {provedor.cobrancas_pendentes > 0 && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{provedor.cobrancas_pendentes} cobrança(s) pendente(s) aguardando resposta deste provedor.</p>
                )}
                {canCreate && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!provedor.credenciais_configuradas && <Button size="sm" variant="outline" onClick={() => openCreate(provedor.id)}>Configurar credenciais</Button>}
                    {provedor.credenciais_configuradas && !provedor.ativo && (
                      <Button size="sm" disabled={ativandoId === provedor.id} onClick={() => setProvedorParaAtivar(provedor)}>
                        {ativandoId === provedor.id ? "Definindo..." : "Definir como provedor"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!formOpen && <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        {listando ? <LoadingState /> : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Icon icon="mdi:credit-card-remove-outline" width={44} className="text-gray-400" />
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Nenhuma credencial configurada.</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Salve as credenciais de um provedor para habilitar as próximas operações financeiras.</p>
            </div>
            <Button size="sm" onClick={() => openCreate()} disabled={!canCreate || catalogo.length === 0}>Configurar credenciais</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-left">
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]"><TableRow>{["Contexto", "Provedor", "Ambiente", "Credenciais", "Segredo do webhook", "Atualizado em", "Ações"].map((h) => <TableCell key={h} isHeader className="px-4 py-3 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{h}</TableCell>)}</TableRow></TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {rows.map((credencial) => {
                  // Mesmo critério de canCreate, mas por linha: cada credencial
                  // pertence a um contexto (spuri ou uma academia específica), e é
                  // esse contexto — não o filtro selecionado na tela — que decide se
                  // o admin FPP pode geri-la (ver authorizeFinanceScope no backend).
                  const podeGerir = isAcademia || (isFpp && credencial.contexto_tipo === "spuri");
                  const info = catalogo.find((p) => p.id === credencial.provedor);
                  return (
                  <TableRow key={credencial.id}>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"><span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">{credencial.contexto_tipo === "spuri" ? "Spuri" : `Academia ${credencial.codigo_academia ?? ""}`}</span></TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{info?.nome ?? credencial.provedor}</span>
                        {credencial.ativo && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">Ativo</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm"><span className={credencial.ambiente === "production" ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300" : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"}>{credencial.ambiente}</span></TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <ul className="space-y-0.5">
                        {Object.entries(credencial.credenciais_mascaradas ?? {}).map(([chave, valor]) => (
                          <li key={chave}><span className="text-xs text-gray-500 dark:text-gray-400">{info?.campos_credenciais.find((c) => c.chave === chave)?.rotulo ?? chave}:</span> {valor}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {info?.usa_segredo_webhook === false ? <span className="text-xs text-gray-400 dark:text-gray-500">Não utiliza</span> : <WebhookSecretPanel credencialId={credencial.id} provedor={info?.nome ?? credencial.provedor} podeRotacionar={podeGerir} />}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(credencial.updated_at)}</TableCell>
                    <TableCell className="px-4 py-3">
                      {podeGerir ? (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(credencial)}>Editar</Button>
                          <Button size="sm" variant="danger" disabled={removendoId === credencial.id} onClick={() => setCredencialParaRemover(credencial)} startIcon={<Icon icon="mdi:delete-outline" width={14} />}>
                            {removendoId === credencial.id ? "Removendo..." : "Remover"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Apenas consulta</span>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>}

      {formOpen && (
        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03] lg:p-8">
          <Button variant="outline" size="sm" onClick={closeForm} disabled={saving} startIcon={<Icon icon="mdi:arrow-left" width={16} />}>Voltar</Button>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{editing ? "Atualizar credencial" : "Configurar credenciais"}</h3>
            {formErrors.contexto && <p className="mt-1 text-xs text-error-500 dark:text-error-400">{formErrors.contexto}</p>}
          </div>
          {/* Erro/sucesso do envio deste formulário — visível aqui dentro, não no topo da página. */}
          {formAlert && <Alert variant={formAlert.variant} title={formAlert.variant === "success" ? "Sucesso" : "Não foi possível salvar"} message={formAlert.message} />}
          {editing && <Alert variant="warning" title="Rotação completa" message={`Por segurança, o ${provedorFormInfo?.nome ?? "provedor"} não devolve os valores atuais dos campos sensíveis. Preencha novamente todos os campos abaixo para atualizar esta credencial — os valores mascarados atuais continuam visíveis na tabela até a atualização ser concluída.${provedorFormInfo?.usa_segredo_webhook ? " O segredo do webhook NÃO muda ao editar; use 'Rotacionar' na tabela se precisar de um novo." : ""}`} />}
          {!editing && (
            <div>
              <Label>Provedor de pagamento *</Label>
              <Select
                key={formProvedor || "sem-provedor"}
                defaultValue={formProvedor}
                options={catalogo.map((p) => ({ value: p.id, label: p.nome }))}
                placeholder="Selecione o provedor"
                onChange={(value) => resetForm(catalogo.find((p) => p.id === value))}
              />
              {formErrors.provedor && <p className="mt-1 text-xs text-error-500 dark:text-error-400">{formErrors.provedor}</p>}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {(provedorFormInfo?.campos_credenciais ?? []).map((campo) => campo.secreto ? (
              <PasswordField
                key={campo.chave}
                label={`${campo.rotulo}${campo.obrigatorio ? " *" : ""}`}
                value={formData[campo.chave] ?? ""}
                show={!!showSecrets[campo.chave]}
                onToggle={() => setShowSecrets((v) => ({ ...v, [campo.chave]: !v[campo.chave] }))}
                onChange={(value) => setFormData((p) => ({ ...p, [campo.chave]: value }))}
                error={formErrors[campo.chave]}
              />
            ) : (
              <Field key={campo.chave} label={`${campo.rotulo}${campo.obrigatorio ? " *" : ""}`}>
                <Input value={formData[campo.chave] ?? ""} onChange={(e) => setFormData((p) => ({ ...p, [campo.chave]: e.target.value }))} error={!!formErrors[campo.chave]} hint={formErrors[campo.chave] ?? campo.ajuda} />
              </Field>
            ))}
          </div>
          {provedorFormInfo?.usa_segredo_webhook && (
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
              <p className="font-medium text-gray-800 dark:text-white/90">Sobre o webhook</p>
              <p className="mt-1">
                Não é preciso configurar segredo nem cabeçalho de webhook aqui: o Spuri gera automaticamente um segredo
                único{editing ? "" : ", exibido uma única vez logo após salvar"} e sempre envia o cabeçalho fixo{" "}
                <code className="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">{provedorFormInfo.cabecalho_webhook ?? WEBHOOK_HEADER_NAME}</code>.
                Configure este mesmo nome de cabeçalho no painel do {provedorFormInfo.nome}. Para ver ou trocar o segredo depois, use as ações
                na coluna &quot;Segredo do webhook&quot; da tabela.
              </p>
            </div>
          )}
          {!editing && !temProvedorAtivo && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Como este contexto ainda não tem provedor de pagamento, o provedor configurado agora passa a ser o provedor ativo.</p>
          )}
          <div className="flex justify-end gap-3"><Button variant="outline" size="sm" onClick={closeForm} disabled={saving}>Cancelar</Button><Button size="sm" onClick={handleSubmit} disabled={saving || !provedorFormInfo}>{saving ? "Salvando..." : "Salvar"}</Button></div>
        </div>
      )}
    </div>
  );
}

/** Alerta que exibe (uma única vez) o segredo de webhook devolvido pela criação da credencial. */
function NovoWebhookSecretAlert({ segredo, provedor, onFechar }: { segredo: string; provedor: string; onFechar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
      <div className="flex items-start gap-3">
        <Icon icon="mdi:key-alert-outline" width={22} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Segredo do webhook gerado</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Copie e configure isto no painel do {provedor} agora — por segurança, este valor não será mostrado por
            inteiro novamente (só via &quot;Consultar segredo&quot;, que exige confirmação).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded bg-white px-3 py-1.5 text-sm dark:bg-gray-900 dark:text-white/90">{segredo}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { navigator.clipboard?.writeText(segredo).catch(() => {}); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
            >
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-400">Cabeçalho: {WEBHOOK_HEADER_NAME}</span>
          </div>
        </div>
        <button type="button" onClick={onFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fechar">
          <Icon icon="mdi:close" width={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * Ações de consulta e rotação do segredo de webhook de uma credencial já
 * existente (GET/POST .../webhook-secret). O erro de cada ação aparece
 * aqui mesmo, dentro da célula da tabela — não no topo da página.
 */
function WebhookSecretPanel({ credencialId, provedor, podeRotacionar }: { credencialId: string; provedor: string; podeRotacionar: boolean }) {
  const consultar = useApi(financeiroService.consultarSegredoWebhook);
  const rotacionar = useApi(financeiroService.rotacionarSegredoWebhook);
  const [segredo, setSegredo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Controla a exibição do ConfirmDialog antes de rotacionar (ver
  // handleRotacionar, abaixo).
  const [confirmandoRotacao, setConfirmandoRotacao] = useState(false);

  const handleConsultar = async () => {
    setErro(null);
    try {
      const r = await consultar.execute(credencialId);
      setSegredo(r?.webhook_secret ?? null);
    } catch (e) {
      setErro(formatApiError(e, "Não foi possível consultar o segredo."));
    }
  };

  const handleRotacionar = async () => {
    setErro(null);
    try {
      const r = await rotacionar.execute(credencialId);
      setSegredo(r?.webhook_secret ?? null);
    } catch (e) {
      setErro(formatApiError(e, "Não foi possível rotacionar o segredo."));
    }
  };

  if (segredo) {
    return (
      <div className="space-y-1">
        <code className="block max-w-[180px] truncate rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">{segredo}</code>
        <button type="button" className="text-xs text-brand-600 hover:underline dark:text-brand-300" onClick={() => setSegredo(null)}>Ocultar</button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {confirmandoRotacao && (
        <ConfirmDialog
          title="Rotacionar segredo do webhook"
          message={`Isto invalida o segredo atual imediatamente. O ${provedor} precisará ser reconfigurado com o novo valor.`}
          confirmLabel="Continuar"
          onConfirm={handleRotacionar}
          onClose={() => setConfirmandoRotacao(false)}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={consultar.loading} onClick={handleConsultar}>Consultar segredo</Button>
        {podeRotacionar && (
          <Button size="sm" variant="outline" disabled={rotacionar.loading} onClick={() => setConfirmandoRotacao(true)}>Rotacionar</Button>
        )}
      </div>
      {erro && <p className="text-xs text-error-500 dark:text-error-400">{erro}</p>}
    </div>
  );
}

/**
 * "Antes de configurar as credenciais": quando o contexto AINDA NÃO tem
 * provedor de pagamento ativo, a nota de adesão fica sempre em destaque e
 * visível por inteiro (não pode ficar escondida atrás de um clique nesse
 * momento — é a informação mais importante da tela). Depois que já existe um
 * provedor ativo, a nota passa a vir recolhida por padrão, com um botão para
 * expandir/ocultar (em vez do `<details>`/`<summary>` nativo do navegador,
 * que tem uma UX pobre e visualmente inconsistente com o resto do painel).
 *
 * O texto geral vale para qualquer provedor; as orientações específicas de um
 * provedor (hoje, só as da AppyPay) aparecem apenas quando esse provedor é o
 * que está em foco (o do formulário aberto ou o provedor ativo).
 */
function AdesaoProvedorInfo({ temProvedorAtivo, provedor }: { temProvedorAtivo: boolean; provedor?: FinanceiroProvedor }) {
  const [aberta, setAberta] = useState(false);
  const destaque = !temProvedorAtivo;
  const mostrarConteudo = destaque || aberta;

  return (
    <div
      className={
        destaque
          ? "rounded-2xl border border-brand-300 bg-brand-50 p-5 dark:border-brand-500/40 dark:bg-brand-500/10"
          : "rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]"
      }
    >
      <div className="flex items-start gap-3">
        <Icon icon="mdi:bank-outline" width={22} className={`mt-0.5 shrink-0 ${destaque ? "text-brand-600 dark:text-brand-300" : "text-brand-500"}`} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Antes de configurar as credenciais</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Para ter acesso ao módulo de finanças e fazer cobranças e receber pagamentos dos estudantes, é necessário aderir aos serviços de um provedor de pagamento (PSP) e escolher esse provedor aqui. Os estudantes pagam pelos métodos de pagamento que o provedor escolhido suporta e que a sua instituição habilitou.
          </p>
        </div>
        {!destaque && (
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            {aberta ? "Ocultar nota" : "Ver nota de adesão"}
            <Icon icon={aberta ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />
          </button>
        )}
      </div>
      {mostrarConteudo && (
        <div className={`mt-4 rounded-xl p-4 ${destaque ? "bg-white/60 dark:bg-white/[0.06]" : "bg-gray-50 dark:bg-white/[0.03]"}`}>
          <p className={`flex items-center gap-2 text-sm font-bold ${destaque ? "text-brand-800 dark:text-brand-100" : "text-gray-700 dark:text-gray-300"}`}><Icon icon="mdi:information-outline" width={18} /> Nota para Adesão ao Serviço</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-500 dark:text-gray-400">
            <li>É necessário ter uma conta bancária empresarial em um dos bancos angolanos.</li>
            <li>O processo de adesão começa junto ao provedor de pagamento escolhido e/ou ao seu banco comercial: solicite a adesão aos métodos de pagamento que deseja utilizar (Multicaixa Express e/ou Referência).</li>
            {provedor?.id === PROVEDOR_APPYPAY ? (
              <>
                <li>Informe ao banco que vai trabalhar com a AppyPay como seu facilitador tecnológico.</li>
                <li>A AppyPay tem parceria com o BAI (GPO), BCS e Standard Bank (GPO e REF) — se selecionar um destes bancos, não terá de pagar as comissões da AppyPay (0,4% por cobrança, com comissão mínima de 50 Kz por cobrança), nem assinar o contrato com a AppyPay.</li>
              </>
            ) : (
              <li>Depois da adesão, o provedor entrega as credenciais de acesso à API dele: informe-as aqui para habilitar as cobranças.</li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

function PasswordField({ label, value, show, error, onToggle, onChange }: { label: string; value: string; show: boolean; error?: string; onToggle: () => void; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} error={!!error} hint={error} className="pr-11" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label={show ? "Ocultar segredo" : "Mostrar segredo"}>
          <Icon icon={show ? "mdi:eye-off-outline" : "mdi:eye-outline"} width={20} />
        </button>
      </div>
    </div>
  );
}

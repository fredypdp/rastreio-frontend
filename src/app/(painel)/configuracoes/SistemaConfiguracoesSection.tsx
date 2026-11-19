"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUserType } from "@/hooks/useRoutePermission";
import { adminService } from "@/lib/api/services";
import { formatApiError } from "@/lib/api/client";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { ConfiguracaoSistemaItem } from "@/types/api";
import {
  ORIGEM_LABEL,
  ORIGEM_COLOR,
  capitalizar,
  formatData,
  valorAtual,
  validarLocal,
  valorInicialDoEditor,
} from "@/lib/configuracaoSistema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SistemaConfiguracoesSection() {
  const { user } = useUserType();
  const podeEditar = user?.tipo === "admin" && user?.admin?.role === "fpp";

  const [itens, setItens] = useState<ConfiguracaoSistemaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [editando, setEditando] = useState<string | null>(null);
  const [valorEditor, setValorEditor] = useState("");
  const [erroEditor, setErroEditor] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [removendo, setRemovendo] = useState<ConfiguracaoSistemaItem | null>(null);
  const [removendoEmCurso, setRemovendoEmCurso] = useState(false);
  const [erroRemocao, setErroRemocao] = useState<string | null>(null);

  const [aviso, setAviso] = useState<{ texto: string; chave: string } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroLista(null);
    try {
      const resposta = await adminService.listarConfiguracoesSistema();
      setItens(resposta.data ?? []);
    } catch (err) {
      setErroLista(formatApiError(err, "Não foi possível carregar as configurações do sistema."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const grupos = useMemo(() => {
    const ordem: string[] = [];
    const porGrupo = new Map<string, ConfiguracaoSistemaItem[]>();
    for (const item of itens) {
      if (!porGrupo.has(item.grupo)) {
        porGrupo.set(item.grupo, []);
        ordem.push(item.grupo);
      }
      porGrupo.get(item.grupo)!.push(item);
    }
    return ordem.map((nome) => ({ nome, itens: porGrupo.get(nome)! }));
  }, [itens]);

  function substituirItem(novo: ConfiguracaoSistemaItem) {
    setItens((atuais) => atuais.map((i) => (i.chave === novo.chave ? novo : i)));
  }

  function abrirEditor(item: ConfiguracaoSistemaItem) {
    setEditando(item.chave);
    setValorEditor(valorInicialDoEditor(item));
    setErroEditor(null);
    setAviso(null);
  }

  function fecharEditor() {
    setEditando(null);
    setValorEditor("");
    setErroEditor(null);
  }

  async function salvar(item: ConfiguracaoSistemaItem) {
    const invalido = validarLocal(item, valorEditor);
    if (invalido) {
      setErroEditor(invalido);
      return;
    }
    setSalvando(true);
    setErroEditor(null);
    try {
      const resposta = await adminService.definirConfiguracaoSistema(item.chave, valorEditor.trim());
      substituirItem(resposta.data);
      setAviso({ texto: resposta.message, chave: item.chave });
      fecharEditor();
    } catch (err) {
      setErroEditor(formatApiError(err, "Não foi possível salvar a configuração."));
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarRemocao() {
    if (!removendo) return;
    setRemovendoEmCurso(true);
    setErroRemocao(null);
    try {
      const resposta = await adminService.removerConfiguracaoSistema(removendo.chave);
      substituirItem(resposta.data);
      setAviso({ texto: resposta.message, chave: removendo.chave });
      setRemovendo(null);
    } catch (err) {
      setErroRemocao(formatApiError(err, "Não foi possível remover a configuração."));
    } finally {
      setRemovendoEmCurso(false);
    }
  }

  function renderEditor(item: ConfiguracaoSistemaItem) {
    const id = `cfg-${item.chave}`;
    let campo: React.ReactNode;
    if (item.tipo === "booleano") {
      campo = (
        <select id={id} value={valorEditor} onChange={(e) => setValorEditor(e.target.value)} disabled={salvando} className={INPUT_CLASS}>
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </select>
      );
    } else if (item.opcoes && item.opcoes.length > 0) {
      campo = (
        <select id={id} value={valorEditor} onChange={(e) => setValorEditor(e.target.value)} disabled={salvando} className={INPUT_CLASS}>
          {item.opcoes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    } else if (item.tipo === "numero") {
      campo = (
        <input
          id={id}
          type="number"
          inputMode={item.inteiro ? "numeric" : "decimal"}
          step={item.inteiro ? 1 : "any"}
          min={item.min}
          max={item.max}
          value={valorEditor}
          onChange={(e) => setValorEditor(e.target.value)}
          disabled={salvando}
          placeholder={item.exemplo}
          className={INPUT_CLASS}
        />
      );
    } else if (item.segredo) {
      campo = (
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          value={valorEditor}
          onChange={(e) => setValorEditor(e.target.value)}
          disabled={salvando}
          placeholder="Novo valor (o atual não é exibido)"
          className={INPUT_CLASS}
        />
      );
    } else {
      campo = (
        <input
          id={id}
          type="text"
          value={valorEditor}
          onChange={(e) => setValorEditor(e.target.value)}
          disabled={salvando}
          placeholder={item.exemplo}
          className={INPUT_CLASS}
        />
      );
    }

    return (
      <form
        className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
        onSubmit={(e) => {
          e.preventDefault();
          void salvar(item);
        }}
      >
        <div>
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {item.segredo ? "Novo valor do segredo" : "Novo valor"}
          </label>
          {campo}
          {item.exemplo && !item.segredo && item.tipo !== "booleano" && !(item.opcoes && item.opcoes.length > 0) && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Exemplo: {item.exemplo}</p>
          )}
          {item.tipo === "numero" && (item.min !== undefined || item.max !== undefined) && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {item.min !== undefined && item.max !== undefined
                ? `Entre ${item.min} e ${item.max}.`
                : item.min !== undefined
                  ? `Mínimo ${item.min}.`
                  : `Máximo ${item.max}.`}
            </p>
          )}
        </div>

        {item.aplicacao === "reinicio" && (
          <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
            <Icon icon="mdi:restart-alert" width="16px" className="mt-0.5 shrink-0" />
            Esta configuração é lida uma única vez quando o servidor arranca: o novo valor só passa a valer depois do próximo reinício.
          </p>
        )}

        {erroEditor && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
            <Icon icon="mdi:alert-circle-outline" width="18px" className="shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{erroEditor}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="outline" disabled={salvando} onClick={fecharEditor}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={salvando}>
            {salvando ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </form>
    );
  }

  function renderItem(item: ConfiguracaoSistemaItem) {
    const emEdicao = editando === item.chave;
    const quando = formatData(item.atualizado_em);
    const quem = item.atualizado_por_nome || item.atualizado_por_id;
    return (
      <div key={item.chave} className="border-b border-gray-100 py-5 last:border-b-0 dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:bg-white/[0.08] dark:text-white/90">
            {item.chave}
          </code>
          {item.segredo && (
            <Badge size="sm" color="warning">
              Segredo
            </Badge>
          )}
          <Badge size="sm" color={item.aplicacao === "imediato" ? "primary" : "warning"}>
            {item.aplicacao === "imediato" ? "Vale na hora" : "Vale após reiniciar o servidor"}
          </Badge>
          <Badge size="sm" color={ORIGEM_COLOR[item.origem]}>
            {ORIGEM_LABEL[item.origem]}
          </Badge>
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.descricao}</p>
        {item.observacao && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.observacao}</p>}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-400">Valor atual</p>
            <p
              className={`break-all text-sm font-medium ${
                item.origem === "nao_definida" ? "text-gray-400" : "text-gray-800 dark:text-white/90"
              }`}
            >
              {valorAtual(item)}
            </p>
            {quem && quando && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Última alteração por {quem} em {quando}
              </p>
            )}
          </div>

          {podeEditar && !emEdicao && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => abrirEditor(item)}>
                {item.segredo ? "Substituir" : item.definida_no_banco ? "Alterar" : "Definir"}
              </Button>
              {item.definida_no_banco && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setErroRemocao(null);
                    setRemovendo(item);
                  }}
                >
                  Voltar ao ambiente
                </Button>
              )}
            </div>
          )}
        </div>

        {aviso?.chave === item.chave && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
            <Icon icon="mdi:check-circle-outline" width="18px" className="shrink-0 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400">{capitalizar(aviso.texto)}.</p>
          </div>
        )}

        {podeEditar && emEdicao && renderEditor(item)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Icon icon="mdi:server-security" width="18px" className="text-gray-600 dark:text-gray-400" />
              </span>
              Configurações do sistema
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Valores gravados aqui valem no lugar das variáveis de ambiente do servidor, sem novo deploy. Enquanto nada for gravado, o
              sistema continua a usar a variável de ambiente. Segredos nunca são mostrados: só se podem substituir.
            </p>
            {!podeEditar && (
              <p className="mt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                <Icon icon="mdi:eye-outline" width="18px" />
                Você pode consultar. Só administradores FPP alteram estas configurações.
              </p>
            )}
          </div>
          <Button type="button" size="sm" variant="outline" disabled={carregando} onClick={() => void carregar()}>
            {carregando ? "A carregar..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {erroLista && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <Icon icon="mdi:alert-circle-outline" width="18px" className="shrink-0 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{erroLista}</p>
        </div>
      )}

      {carregando && itens.length === 0 && (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      )}

      {grupos.map((grupo) => (
        <div key={grupo.nome} className="rounded-2xl border border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
          <h4 className="border-b border-gray-100 py-4 text-sm font-semibold text-gray-800 dark:border-white/[0.05] dark:text-white">
            {grupo.nome}
          </h4>
          {grupo.itens.map(renderItem)}
        </div>
      ))}

      <Modal isOpen={removendo !== null} onClose={() => (removendoEmCurso ? undefined : setRemovendo(null))} className="max-w-[520px] p-6 sm:p-8">
        {removendo && (
          <div>
            <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Voltar ao ambiente?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              O valor gravado para <code className="font-semibold">{removendo.chave}</code> será removido e o sistema volta a ler a variável de
              ambiente do servidor
              {removendo.segredo ? " (o segredo gravado é apagado e não pode ser recuperado)" : ""}.
              {removendo.aplicacao === "reinicio" ? " A mudança vale a partir do próximo reinício do servidor." : ""}
            </p>
            {erroRemocao && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
                <Icon icon="mdi:alert-circle-outline" width="18px" className="shrink-0 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{erroRemocao}</p>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" disabled={removendoEmCurso} onClick={() => setRemovendo(null)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" variant="danger" disabled={removendoEmCurso} onClick={() => void confirmarRemocao()}>
                {removendoEmCurso ? "A remover..." : "Remover do sistema"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

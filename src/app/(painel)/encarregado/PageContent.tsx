// src/app/(painel)/encarregado/PageContent.tsx
"use client";

import React, { useCallback, useEffect, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Alert from '@/components/ui/alert/Alert';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { encarregadoService } from '@/lib/api';
import { formatApiError } from '@/lib/api/client';
import { removeCookie } from '@/lib/utils/cookies';
import { educandoStorage } from '@/lib/utils/educando';
import { ROTULOS_RELACAO } from '@/types/contas';
import type { EducandoEncarregado, RelacaoEncarregado } from '@/types/contas';

const CLASSE_SELECT =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

function rotuloRelacao(e: EducandoEncarregado): string {
  if (!e.relacao) return 'Relação não informada';
  return e.relacao === 'outro' ? e.relacao_outro || 'Outro' : ROTULOS_RELACAO[e.relacao];
}

/**
 * Lista dos educandos do encarregado. "Agir em nome" escolhe o educando: o
 * código fica guardado e o cliente HTTP passa a enviar X-Educando nas rotas do
 * estudante. Enquanto o educando está no nível escolar o encarregado faz o que
 * o estudante faz; depois de concluir, só consulta notas e faltas.
 */
export default function EncarregadoPageContent() {
  const [educandos, setEducandos] = useState<EducandoEncarregado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [editando, setEditando] = useState<EducandoEncarregado | null>(null);
  const [relacao, setRelacao] = useState<RelacaoEncarregado | ''>('');
  const [relacaoOutro, setRelacaoOutro] = useState('');
  const [erroRelacao, setErroRelacao] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setEducandos((await encarregadoService.listarEducandos()).data);
    } catch (e) {
      setErro(formatApiError(e, 'Não foi possível carregar os seus educandos.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const agirEmNome = (e: EducandoEncarregado) => {
    educandoStorage.set(e.codigo_estudante);
    // Sem o cookie do perfil, o layout volta a buscá-lo já com o educando escolhido.
    removeCookie('user');
    window.location.assign('/painel');
  };

  const abrirRelacao = (e: EducandoEncarregado) => {
    setEditando(e);
    setRelacao(e.relacao ?? '');
    setRelacaoOutro(e.relacao_outro ?? '');
    setErroRelacao(null);
  };

  const salvarRelacao = async () => {
    if (!editando) return;
    setErroRelacao(null);
    if (relacao === 'outro' && !relacaoOutro.trim()) {
      setErroRelacao('Descreva a relação.');
      return;
    }
    setSalvando(true);
    try {
      await encarregadoService.atualizarRelacao(editando.codigo_estudante, {
        relacao: relacao || undefined,
        relacao_outro: relacao === 'outro' ? relacaoOutro.trim() : undefined,
      });
      setEditando(null);
      setMensagem('Relação atualizada.');
      await carregar();
    } catch (e) {
      setErroRelacao(formatApiError(e, 'Não foi possível atualizar a relação.'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Meus educandos" />
      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Escolha o educando em nome de quem quer agir: pagamentos, serviços, notas e faltas. Quando o educando concluir o nível escolar,
          passará a consultar apenas as notas e faltas desse período.
        </p>
        {mensagem && <Alert variant="success" title="Feito" message={mensagem} />}
        {erro && <Alert variant="error" title="Erro" message={erro} />}

        {carregando ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : educandos.length === 0 ? (
          <p className="text-sm text-gray-500">Não há educandos vinculados à sua conta.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {educandos.map((e) => (
              <div key={e.codigo_estudante} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-gray-800 dark:text-white/90">{e.nome}</h4>
                  <Badge color={e.fase === 'acao' ? 'success' : 'warning'}>{e.fase === 'acao' ? 'Nível escolar' : 'Só consulta'}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {e.codigo_estudante}{e.nome_academia ? ` · ${e.nome_academia}` : ''} · {rotuloRelacao(e)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => agirEmNome(e)}>Agir em nome</Button>
                  <Button size="sm" variant="outline" onClick={() => abrirRelacao(e)}>Relação</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={editando !== null} onClose={() => setEditando(null)} className="max-w-[480px] p-6 lg:p-8">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Relação com {editando?.nome}</h4>
          <div>
            <Label>Relação (opcional)</Label>
            <select className={CLASSE_SELECT} value={relacao} onChange={(e) => setRelacao(e.target.value as RelacaoEncarregado | '')}>
              <option value="">Não informar</option>
              {(Object.keys(ROTULOS_RELACAO) as RelacaoEncarregado[]).map((r) => <option key={r} value={r}>{ROTULOS_RELACAO[r]}</option>)}
            </select>
          </div>
          {relacao === 'outro' && (
            <div>
              <Label>Descreva a relação *</Label>
              <InputField value={relacaoOutro} onChange={(e) => setRelacaoOutro(e.target.value)} />
            </div>
          )}
          {erroRelacao && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroRelacao}</p>}
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setEditando(null)} disabled={salvando}>Cancelar</Button>
            <Button size="sm" onClick={salvarRelacao} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// src/components/estudantes/TrocarEncarregadoModal.tsx
"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import CredenciaisEnvioAviso from '@/components/common/CredenciaisEnvioAviso';
import EncarregadoCadastroFields, {
  ENCARREGADO_FORM_VAZIO,
  blocoDoFormulario,
  validarEncarregadoForm,
  type EncarregadoForm,
  type EstadoEncarregado,
} from './EncarregadoCadastroFields';
import { encarregadoService } from '@/lib/api';
import { formatApiError } from '@/lib/api/client';
import type { TrocarEncarregadoResponse } from '@/types/contas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  codigoEstudante: string;
  nomeEstudante: string;
  /** Chamado depois de trocar, para a ficha recarregar. */
  onTrocado?: () => void;
}

/**
 * Troca o encarregado de um estudante do nível escolar (academia, ou secretário
 * com estudantes.dados). O vínculo antigo termina e o novo nasce na mesma
 * transação; o encarregado anterior perde o acesso ao educando.
 */
export default function TrocarEncarregadoModal({ isOpen, onClose, codigoEstudante, nomeEstudante, onTrocado }: Props) {
  const [form, setForm] = useState<EncarregadoForm>(ENCARREGADO_FORM_VAZIO);
  const [estado, setEstado] = useState<EstadoEncarregado>({ tipo: 'desconhecido' });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<TrocarEncarregadoResponse | null>(null);

  const fechar = () => {
    setForm(ENCARREGADO_FORM_VAZIO);
    setEstado({ tipo: 'desconhecido' });
    setErro(null);
    setResultado(null);
    onClose();
  };

  const confirmar = async () => {
    const erros = validarEncarregadoForm(form, estado);
    if (erros.length > 0) {
      setErro(erros[0]);
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const r = await encarregadoService.trocar(codigoEstudante, blocoDoFormulario(form, estado));
      setResultado(r);
      onTrocado?.();
    } catch (e) {
      setErro(formatApiError(e, 'Não foi possível trocar o encarregado.'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={fechar} className="max-w-[640px] max-h-[90vh] overflow-y-auto p-6 lg:p-8">
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Trocar o encarregado de {nomeEstudante}</h4>
        {resultado ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {resultado.data.conta_nova
                ? `Foi criada a conta do novo encarregado (código ${resultado.data.codigo}).`
                : `O encarregado já tinha conta (código ${resultado.data.codigo}) e foi vinculado.`}{' '}
              O encarregado anterior deixa de ter acesso a este educando.
            </p>
            {resultado.data.credenciais && <CredenciaisEnvioAviso credenciais={resultado.data.credenciais} destino="ao telefone do novo encarregado" />}
            <div className="flex justify-end"><Button size="sm" onClick={fechar}>Fechar</Button></div>
          </div>
        ) : (
          <>
            <EncarregadoCadastroFields valor={form} onChange={setForm} estado={estado} onEstado={setEstado} disabled={salvando} />
            {erro && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
            <div className="flex justify-end gap-3">
              <Button size="sm" variant="outline" onClick={fechar} disabled={salvando}>Cancelar</Button>
              <Button size="sm" onClick={confirmar} disabled={salvando}>{salvando ? 'Trocando…' : 'Trocar encarregado'}</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

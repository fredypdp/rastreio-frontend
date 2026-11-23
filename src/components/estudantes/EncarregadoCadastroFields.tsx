// src/components/estudantes/EncarregadoCadastroFields.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import BirthDatePicker from '@/components/form/BirthDatePicker';
import { encarregadoService } from '@/lib/api';
import { ROTULOS_RELACAO } from '@/types/contas';
import type { BlocoEncarregado, RelacaoEncarregado } from '@/types/contas';

/** Estado do bloco no formulário (todos os campos como texto). */
export interface EncarregadoForm {
  telefone: string;
  nome: string;
  genero: 'masculino' | 'feminino';
  data_nascimento: string;
  email: string;
  relacao: RelacaoEncarregado | '';
  relacao_outro: string;
}

export const ENCARREGADO_FORM_VAZIO: EncarregadoForm = {
  telefone: '',
  nome: '',
  genero: 'feminino',
  data_nascimento: '',
  email: '',
  relacao: '',
  relacao_outro: '',
};

/** Resultado da consulta por telefone: sabemos se o encarregado já tem conta. */
export type EstadoEncarregado =
  | { tipo: 'desconhecido' }
  | { tipo: 'novo' }
  | { tipo: 'existente'; nome: string; telefoneMascarado: string; totalEducandos: number };

const CLASSE_SELECT =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

const soDigitos = (v: string) => v.replace(/\D/g, '').slice(0, 9);

/** Valida o bloco. Devolve as mensagens de erro (vazio = ok). Encarregado existente só precisa do telefone. */
export function validarEncarregadoForm(f: EncarregadoForm, estado: EstadoEncarregado): string[] {
  const erros: string[] = [];
  if (!f.telefone) erros.push('Telefone do encarregado de educação é obrigatório para estudantes escolares');
  else if (f.telefone.length !== 9) erros.push('Telefone do encarregado de educação deve ter exatamente 9 dígitos locais');
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) erros.push('E-mail do encarregado inválido');
  if (f.relacao === 'outro' && !f.relacao_outro.trim()) erros.push('Descreva a relação com o estudante');
  if (estado.tipo !== 'existente') {
    if (!f.nome.trim()) erros.push('Nome do encarregado é obrigatório (ainda não tem conta)');
    if (!f.data_nascimento) erros.push('Data de nascimento do encarregado é obrigatória (ainda não tem conta)');
    else {
      const limite = new Date();
      limite.setFullYear(limite.getFullYear() - 18);
      if (new Date(`${f.data_nascimento}T00:00:00`) > limite) erros.push('O encarregado deve ter pelo menos 18 anos');
    }
  }
  return erros;
}

/** Converte o formulário no bloco enviado à API. */
export function blocoDoFormulario(f: EncarregadoForm, estado: EstadoEncarregado): BlocoEncarregado {
  const bloco: BlocoEncarregado = { telefone: f.telefone };
  if (f.email.trim()) bloco.email = f.email.trim();
  if (f.relacao) {
    bloco.relacao = f.relacao;
    if (f.relacao === 'outro') bloco.relacao_outro = f.relacao_outro.trim();
  }
  // Dados pessoais só para conta nova.
  if (estado.tipo !== 'existente') {
    bloco.nome = f.nome.trim();
    bloco.genero = f.genero;
    bloco.data_nascimento = f.data_nascimento;
  }
  return bloco;
}

interface Props {
  valor: EncarregadoForm;
  onChange: (v: EncarregadoForm) => void;
  estado: EstadoEncarregado;
  onEstado: (e: EstadoEncarregado) => void;
  disabled?: boolean;
}

/**
 * Bloco do encarregado no cadastro do estudante escolar. Ao completar o
 * telefone consulta a API: se já existe um encarregado com esse telefone (por
 * exemplo, um irmão já cadastrado), ele é apenas vinculado — sem pedir dados e
 * sem novas credenciais. Se não existe, pede os dados da conta nova.
 */
export default function EncarregadoCadastroFields({ valor, onChange, estado, onEstado, disabled }: Props) {
  const [consultando, setConsultando] = useState(false);
  const ultimoConsultado = useRef('');

  useEffect(() => {
    if (valor.telefone.length !== 9) {
      ultimoConsultado.current = '';
      if (estado.tipo !== 'desconhecido') onEstado({ tipo: 'desconhecido' });
      return;
    }
    if (ultimoConsultado.current === valor.telefone) return;
    ultimoConsultado.current = valor.telefone;
    let cancelado = false;
    setConsultando(true);
    encarregadoService
      .buscar({ telefone: valor.telefone })
      .then((r) => {
        if (cancelado) return;
        if (r.data.encontrado) {
          onEstado({ tipo: 'existente', nome: r.data.encarregado.nome, telefoneMascarado: r.data.encarregado.telefone_mascarado, totalEducandos: r.data.encarregado.total_educandos });
        } else onEstado({ tipo: 'novo' });
      })
      // Se a consulta falhar não bloqueamos: o servidor decide ao cadastrar.
      .catch(() => !cancelado && onEstado({ tipo: 'desconhecido' }))
      .finally(() => !cancelado && setConsultando(false));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor.telefone]);

  const set = <K extends keyof EncarregadoForm>(k: K, v: EncarregadoForm[K]) => onChange({ ...valor, [k]: v });

  return (
    <fieldset className="col-span-2 space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <legend className="px-1 text-sm font-semibold text-gray-800 dark:text-white/90">Encarregado de educação</legend>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        O encarregado tem conta própria e é quem recebe as credenciais e as mensagens do estudante. O telefone o identifica: um encarregado já cadastrado
        (por exemplo, de um irmão) é apenas vinculado.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Telefone do encarregado *</Label>
          <Input type="text" placeholder="Ex: 923456789" value={valor.telefone} onChange={(e) => set('telefone', soDigitos(e.target.value))} disabled={disabled} />
          {consultando && <p className="mt-1 text-xs text-gray-500">Verificando se já existe…</p>}
        </div>
        <div>
          <Label>Relação com o estudante (opcional)</Label>
          <select className={CLASSE_SELECT} value={valor.relacao} disabled={disabled} onChange={(e) => set('relacao', e.target.value as RelacaoEncarregado | '')}>
            <option value="">Não informar</option>
            {(Object.keys(ROTULOS_RELACAO) as RelacaoEncarregado[]).map((r) => <option key={r} value={r}>{ROTULOS_RELACAO[r]}</option>)}
          </select>
        </div>
        {valor.relacao === 'outro' && (
          <div className="sm:col-span-2">
            <Label>Descreva a relação *</Label>
            <Input type="text" value={valor.relacao_outro} onChange={(e) => set('relacao_outro', e.target.value)} disabled={disabled} />
          </div>
        )}
      </div>

      {estado.tipo === 'existente' ? (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
          Já existe o encarregado <strong>{estado.nome}</strong> ({estado.telefoneMascarado}), com {estado.totalEducandos} educando(s). Será vinculado a este estudante;
          não serão criadas novas credenciais para ele.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {estado.tipo === 'novo' && (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 sm:col-span-2 dark:bg-blue-900/20 dark:text-blue-300">
              Este telefone ainda não tem conta de encarregado: preencha os dados abaixo. As credenciais do encarregado e as do estudante seguem por SMS para este telefone.
            </p>
          )}
          <div className="sm:col-span-2">
            <Label>Nome completo do encarregado *</Label>
            <Input type="text" value={valor.nome} onChange={(e) => set('nome', e.target.value)} disabled={disabled} />
          </div>
          <div>
            <Label>Género *</Label>
            <select className={CLASSE_SELECT} value={valor.genero} disabled={disabled} onChange={(e) => set('genero', e.target.value as EncarregadoForm['genero'])}>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
            </select>
          </div>
          <div>
            <BirthDatePicker id="encarregado-data-nascimento" label="Data de nascimento * (mín. 18 anos)" value={valor.data_nascimento} onChange={(v) => set('data_nascimento', v)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <Label>E-mail do encarregado (opcional)</Label>
            <Input type="email" value={valor.email} onChange={(e) => set('email', e.target.value)} disabled={disabled} />
          </div>
        </div>
      )}
    </fieldset>
  );
}

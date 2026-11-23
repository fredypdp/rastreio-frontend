// src/components/user-profile/ContaPessoaCard.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import { perfilService } from '@/lib/api';
import { formatApiError } from '@/lib/api/client';
import type { MeuPerfilResponse } from '@/types/api';
import { ROTULOS_RELACAO } from '@/types/contas';

const ROTULO_TIPO: Record<string, string> = {
  secretario: 'Secretário',
  professor: 'Professor',
  encarregado: 'Encarregado',
};

/**
 * Perfil das contas de secretário, professor e encarregado: dados da conta,
 * a academia (secretário e professor), as permissões (secretário) e os
 * educandos (encarregado). O telefone e o e-mail são da própria pessoa e ela
 * mesma os altera aqui (PUT /me/telefone e /me/email).
 */
export default function ContaPessoaCard({ profile, onAtualizado }: { profile: MeuPerfilResponse; onAtualizado?: () => void }) {
  const [telefone, setTelefone] = useState(profile.telefone ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async (campo: 'telefone' | 'email') => {
    setSalvando(true);
    setAviso(null);
    try {
      if (campo === 'telefone') await perfilService.atualizarTelefone({ telefone });
      else await perfilService.atualizarEmail({ email });
      setAviso({ ok: true, texto: campo === 'telefone' ? 'Telefone atualizado.' : 'E-mail atualizado. Verifique-o para poder usá-lo no login.' });
      onAtualizado?.();
    } catch (err) {
      setAviso({ ok: false, texto: formatApiError(err, 'Não foi possível atualizar.') });
    } finally {
      setSalvando(false);
    }
  };

  const linha = (rotulo: string, valor?: string | null) => (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{rotulo}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{valor || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{profile.nome}</h4>
          <Badge color="primary">{ROTULO_TIPO[profile.tipo_real ?? profile.tipo] ?? profile.tipo}</Badge>
          {profile.status && <Badge color={profile.status === 'ativo' ? 'success' : 'warning'}>{profile.status}</Badge>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {linha('Código de acesso', profile.codigo)}
          {profile.nome_academia && linha('Academia', `${profile.nome_academia} (${profile.codigo_academia})`)}
          {linha('E-mail', profile.email)}
          {linha('Telefone', profile.telefone)}
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Para alterar a senha ou ativar a verificação em duas etapas, use <Link href="/configuracoes/seguranca" className="underline">Segurança</Link>.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
        <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Meus contatos</h4>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <Label>Telefone (móvel, 9 dígitos)</Label>
            <InputField value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" />
            <div className="mt-2"><Button size="sm" type="button" disabled={salvando} onClick={() => salvar('telefone')}>Salvar telefone</Button></div>
          </div>
          <div>
            <Label>E-mail</Label>
            <InputField type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="mt-2"><Button size="sm" type="button" disabled={salvando} onClick={() => salvar('email')}>Salvar e-mail</Button></div>
          </div>
        </div>
        {aviso && <p className={`mt-3 text-sm ${aviso.ok ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>{aviso.texto}</p>}
      </div>

      {profile.permissoes && profile.permissoes.length > 0 && (
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
          <h4 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Minhas permissões</h4>
          <div className="flex flex-wrap gap-2">
            {profile.permissoes.map((p) => <Badge key={p} color="light">{p}</Badge>)}
          </div>
        </div>
      )}

      {profile.educandos && (
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800 lg:p-6">
          <h4 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Meus educandos</h4>
          {profile.educandos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum educando vinculado.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {profile.educandos.map((e) => (
                <li key={e.codigo_estudante} className="py-2 text-sm text-gray-700 dark:text-gray-300">
                  {e.nome} ({e.codigo_estudante}){e.relacao ? ` · ${e.relacao === 'outro' ? e.relacao_outro : ROTULOS_RELACAO[e.relacao]}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

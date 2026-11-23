// src/app/(painel)/secretarios/PageContent.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Alert from '@/components/ui/alert/Alert';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import InputField from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import AvisoCredenciaisConta from '@/components/contas/AvisoCredenciaisConta';
import PermissoesPicker, { expandirImplicadas } from '@/components/contas/PermissoesPicker';
import { secretarioService } from '@/lib/api';
import { formatApiError } from '@/lib/api/client';
import type { CredenciaisEnvio } from '@/types/api';
import type { ContaPessoaResumo, CriarSecretarioRequest, PermissaoCatalogo } from '@/types/contas';

interface Formulario {
  nome: string;
  genero: 'masculino' | 'feminino';
  data_nascimento: string;
  telefone: string;
  email: string;
  permissoes: string[];
}

const FORMULARIO_VAZIO: Formulario = { nome: '', genero: 'feminino', data_nascimento: '', telefone: '', email: '', permissoes: [] };

const CLASSE_SELECT =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

export default function SecretariosPageContent() {
  const [secretarios, setSecretarios] = useState<ContaPessoaResumo[]>([]);
  const [catalogo, setCatalogo] = useState<PermissaoCatalogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ContaPessoaResumo | null>(null);
  const [form, setForm] = useState<Formulario>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [credenciais, setCredenciais] = useState<{ nome: string; envio: CredenciaisEnvio } | null>(null);
  const [aEliminar, setAEliminar] = useState<ContaPessoaResumo | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, perms] = await Promise.all([secretarioService.listar(), secretarioService.listarPermissoes()]);
      setSecretarios(lista.data);
      setCatalogo(perms.data);
    } catch (e) {
      setErro(formatApiError(e, 'Não foi possível carregar os secretários.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const rotuloPorChave = useMemo(() => new Map(catalogo.map((p) => [p.chave, p.rotulo])), [catalogo]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(FORMULARIO_VAZIO);
    setErroForm(null);
    setModalAberto(true);
  };

  const abrirEdicao = (s: ContaPessoaResumo) => {
    setEditando(s);
    setForm({
      nome: s.nome,
      genero: s.genero,
      data_nascimento: s.data_nascimento.slice(0, 10),
      telefone: s.telefone,
      email: s.email ?? '',
      permissoes: expandirImplicadas(catalogo, s.permissoes ?? []),
    });
    setErroForm(null);
    setModalAberto(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);
    if (!form.nome.trim() || !form.data_nascimento || !form.telefone.trim()) {
      setErroForm('Preencha o nome, a data de nascimento e o telefone.');
      return;
    }
    if (form.permissoes.length === 0) {
      setErroForm('Selecione pelo menos uma permissão.');
      return;
    }
    setSalvando(true);
    try {
      if (editando) {
        await secretarioService.editar(editando.id, {
          nome: form.nome,
          genero: form.genero,
          data_nascimento: form.data_nascimento,
          telefone: form.telefone,
          email: form.email || undefined,
          permissoes: form.permissoes,
        });
        setMensagem('Secretário atualizado.');
      } else {
        const corpo: CriarSecretarioRequest = {
          nome: form.nome,
          genero: form.genero,
          data_nascimento: form.data_nascimento,
          telefone: form.telefone,
          email: form.email || undefined,
          permissoes: form.permissoes,
        };
        const r = await secretarioService.criar(corpo);
        setCredenciais({ nome: r.data.nome, envio: r.data.credenciais });
        setMensagem(`Secretário criado. Código de acesso: ${r.data.codigo}`);
      }
      setModalAberto(false);
      await carregar();
    } catch (err) {
      setErroForm(formatApiError(err, 'Não foi possível guardar o secretário.'));
    } finally {
      setSalvando(false);
    }
  };

  const alternarEstado = async (s: ContaPessoaResumo) => {
    setErro(null);
    try {
      if (s.status === 'ativo') await secretarioService.desativar(s.id);
      else await secretarioService.ativar(s.id);
      await carregar();
    } catch (err) {
      setErro(formatApiError(err, 'Não foi possível alterar o estado do secretário.'));
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    try {
      await secretarioService.eliminar(aEliminar.id);
      setAEliminar(null);
      setMensagem('Secretário excluído.');
      await carregar();
    } catch (err) {
      setAEliminar(null);
      setErro(formatApiError(err, 'Não foi possível excluir o secretário.'));
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Secretários" />
      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Secretários trabalham em nome da academia, apenas com as permissões que você conceder. Não podem gerir outros secretários,
            alterar os dados da academia nem lançar notas e faltas.
          </p>
          <Button size="sm" onClick={abrirNovo} disabled={carregando || catalogo.length === 0}>Novo secretário</Button>
        </div>

        {mensagem && <Alert variant="success" title="Feito" message={mensagem} />}
        {erro && <Alert variant="error" title="Erro" message={erro} />}
        {credenciais && (
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <AvisoCredenciaisConta credenciais={credenciais.envio} quem={credenciais.nome} />
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : secretarios.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não há secretários.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                <tr>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Telefone</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Permissões</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {secretarios.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white/90">{s.nome}</td>
                    <td className="py-3 pr-4">{s.codigo}</td>
                    <td className="py-3 pr-4">{s.telefone}</td>
                    <td className="py-3 pr-4"><Badge color={s.status === 'ativo' ? 'success' : 'warning'}>{s.status}</Badge></td>
                    <td className="py-3 pr-4" title={(s.permissoes ?? []).map((p) => rotuloPorChave.get(p) ?? p).join(', ')}>
                      {(s.permissoes ?? []).length} de {catalogo.length}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => abrirEdicao(s)}>Editar</Button>
                        <Button size="sm" variant="outline" onClick={() => alternarEstado(s)}>{s.status === 'ativo' ? 'Desativar' : 'Ativar'}</Button>
                        <Button size="sm" variant="danger" onClick={() => setAEliminar(s)}>Excluir</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} className="max-w-[760px] max-h-[90vh] overflow-y-auto p-6 lg:p-8">
        <form onSubmit={salvar} className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">{editando ? 'Editar secretário' : 'Novo secretário'}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome completo *</Label>
              <InputField value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Género *</Label>
              <select className={CLASSE_SELECT} value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value as Formulario['genero'] })}>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
              </select>
            </div>
            <div>
              <Label>Data de nascimento * (mín. 18 anos)</Label>
              <InputField type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>
            <div>
              <Label>Telefone * (recebe as credenciais por SMS)</Label>
              <InputField value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} inputMode="tel" placeholder="923456789" />
            </div>
            <div>
              <Label>E-mail (opcional)</Label>
              <InputField type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Permissões</h5>
            <PermissoesPicker catalogo={catalogo} valor={form.permissoes} onChange={(permissoes) => setForm({ ...form, permissoes })} disabled={salvando} />
          </div>

          {erroForm && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroForm}</p>}
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" type="button" onClick={() => setModalAberto(false)} disabled={salvando}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={aEliminar !== null} onClose={() => setAEliminar(null)} className="max-w-[480px] p-6 lg:p-8">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Excluir secretário</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {aEliminar?.nome} deixa de poder entrar. O histórico das ações dele fica registado. Para apenas bloquear o acesso por agora, use Desativar.
          </p>
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button size="sm" variant="danger" onClick={eliminar}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

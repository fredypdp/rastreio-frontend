// src/app/(painel)/professores/PageContent.tsx
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
import { academiaService, professorService } from '@/lib/api';
import { formatApiError } from '@/lib/api/client';
import { useUserCookie } from '@/hooks/useUserCookie';
import { temPermissao } from '@/lib/perfil-efetivo';
import type { CredenciaisEnvio, Materia, Turma } from '@/types/api';
import type { NovoVinculoProfessor, ProfessorComVinculos } from '@/types/contas';

const CLASSE_SELECT =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

interface Formulario {
  nome: string;
  genero: 'masculino' | 'feminino';
  data_nascimento: string;
  telefone: string;
  email: string;
}

const FORMULARIO_VAZIO: Formulario = { nome: '', genero: 'masculino', data_nascimento: '', telefone: '', email: '' };

/** Escolha de um par turma + matéria. */
function SeletorVinculo({
  turmas,
  materias,
  valor,
  onChange,
}: {
  turmas: Turma[];
  materias: Materia[];
  valor: NovoVinculoProfessor;
  onChange: (v: NovoVinculoProfessor) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <select className={CLASSE_SELECT} value={valor.codigo_turma} onChange={(e) => onChange({ ...valor, codigo_turma: e.target.value })}>
        <option value="">Turma…</option>
        {turmas.filter((t) => t.status === 'ativo').map((t) => (
          <option key={t.id} value={t.codigo_turma}>{t.codigo_turma} · {t.nivel}</option>
        ))}
      </select>
      <select className={CLASSE_SELECT} value={valor.materia_id} onChange={(e) => onChange({ ...valor, materia_id: e.target.value })}>
        <option value="">Matéria…</option>
        {materias.filter((m) => m.status === 'ativo').map((m) => (
          <option key={m.id} value={m.id}>{m.nome}</option>
        ))}
      </select>
    </div>
  );
}

export default function ProfessoresPageContent() {
  const { user } = useUserCookie();
  const podeGerir = temPermissao(user, 'professores.gerir');

  const [professores, setProfessores] = useState<ProfessorComVinculos[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [modalNovo, setModalNovo] = useState(false);
  const [form, setForm] = useState<Formulario>(FORMULARIO_VAZIO);
  const [vinculosNovos, setVinculosNovos] = useState<NovoVinculoProfessor[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [credenciais, setCredenciais] = useState<{ nome: string; envio: CredenciaisEnvio } | null>(null);

  const [gerindo, setGerindo] = useState<ProfessorComVinculos | null>(null);
  const [novoVinculo, setNovoVinculo] = useState<NovoVinculoProfessor>({ codigo_turma: '', materia_id: '' });
  const [reatribuindo, setReatribuindo] = useState<{ vinculoId: string; para: string } | null>(null);
  const [erroVinculo, setErroVinculo] = useState<string | null>(null);

  const [aEliminar, setAEliminar] = useState<ProfessorComVinculos | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await professorService.listar();
      setProfessores(lista.data);
      // Turmas e matérias só são necessárias para gerir vínculos.
      if (podeGerir) {
        const [t, m] = await Promise.all([academiaService.listarTurmas(), academiaService.listarMaterias()]);
        setTurmas(t.turmas ?? []);
        setMaterias(m.materias ?? []);
      }
    } catch (e) {
      setErro(formatApiError(e, 'Não foi possível carregar os professores.'));
    } finally {
      setCarregando(false);
    }
  }, [podeGerir]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const nomeMateria = useMemo(() => new Map(materias.map((m) => [m.id, m.nome])), [materias]);

  // Mantém o professor aberto em "Vínculos" sincronizado com a lista recarregada.
  useEffect(() => {
    if (!gerindo) return;
    const atual = professores.find((p) => p.professor.id === gerindo.professor.id);
    if (atual && atual !== gerindo) setGerindo(atual);
  }, [professores, gerindo]);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);
    if (!form.nome.trim() || !form.data_nascimento || !form.telefone.trim()) {
      setErroForm('Preencha o nome, a data de nascimento e o telefone.');
      return;
    }
    const vinculos = vinculosNovos.filter((v) => v.codigo_turma && v.materia_id);
    setSalvando(true);
    try {
      const r = await professorService.criar({
        nome: form.nome,
        genero: form.genero,
        data_nascimento: form.data_nascimento,
        telefone: form.telefone,
        email: form.email || undefined,
        vinculos: vinculos.length ? vinculos : undefined,
      });
      setCredenciais({ nome: r.data.nome, envio: r.data.credenciais });
      setMensagem(`Professor criado. Código de acesso: ${r.data.codigo}`);
      setModalNovo(false);
      setForm(FORMULARIO_VAZIO);
      setVinculosNovos([]);
      await carregar();
    } catch (err) {
      setErroForm(formatApiError(err, 'Não foi possível criar o professor.'));
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (fn: () => Promise<unknown>, falha: string, sucesso?: string) => {
    setErro(null);
    try {
      await fn();
      if (sucesso) setMensagem(sucesso);
      await carregar();
    } catch (err) {
      setErro(formatApiError(err, falha));
    }
  };

  const adicionarVinculo = async () => {
    if (!gerindo || !novoVinculo.codigo_turma || !novoVinculo.materia_id) return;
    setErroVinculo(null);
    try {
      await professorService.atribuirVinculo(gerindo.professor.id, novoVinculo);
      setNovoVinculo({ codigo_turma: '', materia_id: '' });
      await carregar();
    } catch (err) {
      setErroVinculo(formatApiError(err, 'Não foi possível atribuir o vínculo.'));
    }
  };

  const removerVinculo = async (vinculoId: string) => {
    if (!gerindo) return;
    setErroVinculo(null);
    try {
      await professorService.removerVinculo(gerindo.professor.id, vinculoId);
      await carregar();
    } catch (err) {
      setErroVinculo(formatApiError(err, 'Não foi possível remover o vínculo.'));
    }
  };

  const confirmarReatribuicao = async () => {
    if (!reatribuindo?.para) return;
    setErroVinculo(null);
    try {
      await professorService.reatribuirVinculo(reatribuindo.vinculoId, reatribuindo.para);
      setReatribuindo(null);
      await carregar();
    } catch (err) {
      setErroVinculo(formatApiError(err, 'Não foi possível reatribuir o vínculo.'));
    }
  };

  const outrosAtivos = (idAtual: string) => professores.filter((p) => p.professor.id !== idAtual && p.professor.status === 'ativo');

  return (
    <div>
      <PageBreadcrumb pageTitle="Professores" />
      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Cada professor leciona pares de turma e matéria. Um par tem apenas um professor. Por agora o professor consulta as suas turmas;
            o lançamento de notas e faltas pelos professores chega numa etapa seguinte.
          </p>
          {podeGerir && <Button size="sm" onClick={() => { setErroForm(null); setModalNovo(true); }}>Novo professor</Button>}
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
        ) : professores.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não há professores.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                <tr>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Telefone</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Vínculos</th>
                  {podeGerir && <th className="py-2 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {professores.map((p) => (
                  <tr key={p.professor.id}>
                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-white/90">{p.professor.nome}</td>
                    <td className="py-3 pr-4">{p.professor.codigo}</td>
                    <td className="py-3 pr-4">{p.professor.telefone}</td>
                    <td className="py-3 pr-4"><Badge color={p.professor.status === 'ativo' ? 'success' : 'warning'}>{p.professor.status}</Badge></td>
                    <td className="py-3 pr-4">{p.vinculos.length}</td>
                    {podeGerir && (
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setErroVinculo(null); setGerindo(p); }}>Vínculos</Button>
                          <Button size="sm" variant="outline" onClick={() => acao(() => (p.professor.status === 'ativo' ? professorService.desativar(p.professor.id) : professorService.ativar(p.professor.id)), 'Não foi possível alterar o estado.')}>
                            {p.professor.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setAEliminar(p)}>Excluir</Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Novo professor */}
      <Modal isOpen={modalNovo} onClose={() => setModalNovo(false)} className="max-w-[720px] max-h-[90vh] overflow-y-auto p-6 lg:p-8">
        <form onSubmit={criar} className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Novo professor</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome completo *</Label>
              <InputField value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Género *</Label>
              <select className={CLASSE_SELECT} value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value as Formulario['genero'] })}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
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

          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Vínculos (opcional)</h5>
            {vinculosNovos.map((v, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <SeletorVinculo turmas={turmas} materias={materias} valor={v} onChange={(nv) => setVinculosNovos(vinculosNovos.map((x, j) => (j === i ? nv : x)))} />
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => setVinculosNovos(vinculosNovos.filter((_, j) => j !== i))}>Remover</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" type="button" onClick={() => setVinculosNovos([...vinculosNovos, { codigo_turma: '', materia_id: '' }])}>Adicionar turma e matéria</Button>
          </div>

          {erroForm && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroForm}</p>}
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" type="button" onClick={() => setModalNovo(false)} disabled={salvando}>Cancelar</Button>
            <Button size="sm" type="submit" disabled={salvando}>{salvando ? 'Criando…' : 'Criar professor'}</Button>
          </div>
        </form>
      </Modal>

      {/* Vínculos de um professor */}
      <Modal isOpen={gerindo !== null} onClose={() => { setGerindo(null); setReatribuindo(null); }} className="max-w-[720px] max-h-[90vh] overflow-y-auto p-6 lg:p-8">
        {gerindo && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Vínculos de {gerindo.professor.nome}</h4>
            {gerindo.vinculos.length === 0 ? (
              <p className="text-sm text-gray-500">Sem vínculos.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {gerindo.vinculos.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-gray-800 dark:text-white/90">Turma {v.codigo_turma} · {nomeMateria.get(v.materia_id) ?? v.materia_id}</span>
                    <span className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReatribuindo({ vinculoId: v.id, para: '' })}>Reatribuir</Button>
                      <Button size="sm" variant="outline" onClick={() => removerVinculo(v.id)}>Remover</Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {reatribuindo && (
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                <Label>Passar este par para o professor</Label>
                <select className={CLASSE_SELECT} value={reatribuindo.para} onChange={(e) => setReatribuindo({ ...reatribuindo, para: e.target.value })}>
                  <option value="">Escolha…</option>
                  {outrosAtivos(gerindo.professor.id).map((o) => (
                    <option key={o.professor.id} value={o.professor.id}>{o.professor.nome} ({o.professor.codigo})</option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={confirmarReatribuicao} disabled={!reatribuindo.para}>Confirmar</Button>
                  <Button size="sm" variant="outline" onClick={() => setReatribuindo(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">Novo vínculo</h5>
              <SeletorVinculo turmas={turmas} materias={materias} valor={novoVinculo} onChange={setNovoVinculo} />
              <Button size="sm" onClick={adicionarVinculo} disabled={!novoVinculo.codigo_turma || !novoVinculo.materia_id}>Atribuir</Button>
            </div>
            {erroVinculo && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erroVinculo}</p>}
          </div>
        )}
      </Modal>

      <Modal isOpen={aEliminar !== null} onClose={() => setAEliminar(null)} className="max-w-[480px] p-6 lg:p-8">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">Excluir professor</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {aEliminar?.professor.nome} deixa de poder entrar e os seus vínculos terminam. O histórico fica registado.
          </p>
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setAEliminar(null)}>Cancelar</Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                const alvo = aEliminar;
                setAEliminar(null);
                if (alvo) await acao(() => professorService.eliminar(alvo.professor.id), 'Não foi possível excluir o professor.', 'Professor excluído.');
              }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

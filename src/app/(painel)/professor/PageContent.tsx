// src/app/(painel)/professor/PageContent.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Alert from '@/components/ui/alert/Alert';
import Button from '@/components/ui/button/Button';
import { professorAreaService } from '@/lib/api';
import { formatApiError } from '@/lib/api/client';
import type {
  EstudanteDaTurmaProfessor,
  FaltaConsultaProfessor,
  MeuVinculoProfessor,
  MinhaTurmaProfessor,
  NotaConsultaProfessor,
} from '@/types/contas';

type Aba = 'estudantes' | 'notas' | 'faltas';

/**
 * Área do professor. Só consulta: as turmas e matérias a que está vinculado.
 * O servidor devolve apenas o que os vínculos permitem (turma sem vínculo é
 * 404). Lançar e corrigir notas e faltas é uma etapa posterior do plano.
 */
export default function ProfessorPageContent() {
  const [turmas, setTurmas] = useState<MinhaTurmaProfessor[]>([]);
  const [vinculos, setVinculos] = useState<MeuVinculoProfessor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [turmaAberta, setTurmaAberta] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('estudantes');
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);
  const [estudantes, setEstudantes] = useState<EstudanteDaTurmaProfessor[]>([]);
  const [notas, setNotas] = useState<NotaConsultaProfessor[]>([]);
  const [faltas, setFaltas] = useState<FaltaConsultaProfessor[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [t, v] = await Promise.all([professorAreaService.minhasTurmas(), professorAreaService.meusVinculos()]);
        setTurmas(t.data);
        setVinculos(v.data);
      } catch (e) {
        setErro(formatApiError(e, 'Não foi possível carregar as suas turmas.'));
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const materiasDaTurma = useMemo(() => vinculos.filter((v) => v.codigo_turma === turmaAberta), [vinculos, turmaAberta]);
  const nomeMateria = useMemo(() => new Map(vinculos.map((v) => [v.materia_id, v.materia_nome])), [vinculos]);

  const carregarDetalhe = useCallback(async () => {
    if (!turmaAberta) return;
    setCarregandoDetalhe(true);
    setErroDetalhe(null);
    try {
      const filtros = materiaFiltro ? { materia_id: materiaFiltro } : undefined;
      if (aba === 'notas') setNotas((await professorAreaService.notasDaTurma(turmaAberta, filtros)).data);
      if (aba === 'faltas') setFaltas((await professorAreaService.faltasDaTurma(turmaAberta, filtros)).data);
    } catch (e) {
      setErroDetalhe(formatApiError(e, 'Não foi possível carregar os dados da turma.'));
    } finally {
      setCarregandoDetalhe(false);
    }
  }, [turmaAberta, aba, materiaFiltro]);

  useEffect(() => {
    carregarDetalhe();
  }, [carregarDetalhe]);

  // Os estudantes da turma servem a todas as abas (nomes nas tabelas de notas e faltas).
  useEffect(() => {
    if (!turmaAberta) return;
    setEstudantes([]);
    professorAreaService
      .estudantesDaTurma(turmaAberta)
      .then((r) => setEstudantes(r.data))
      .catch((e) => setErroDetalhe(formatApiError(e, 'Não foi possível carregar os estudantes da turma.')));
  }, [turmaAberta]);

  const nomeEstudante = useMemo(() => new Map(estudantes.map((e) => [e.codigo_estudante, e.nome])), [estudantes]);
  const rotuloEstudante = (codigo: string) => (nomeEstudante.get(codigo) ? `${nomeEstudante.get(codigo)} (${codigo})` : codigo);

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'estudantes', rotulo: 'Estudantes' },
    { id: 'notas', rotulo: 'Notas' },
    { id: 'faltas', rotulo: 'Faltas' },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Minhas turmas" />
      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {erro && <Alert variant="error" title="Erro" message={erro} />}
        {carregando ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : turmas.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não está vinculado a nenhuma turma. A academia atribui os vínculos.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((t) => (
                <button
                  key={t.codigo_turma}
                  type="button"
                  onClick={() => { setTurmaAberta(t.codigo_turma); setAba('estudantes'); setMateriaFiltro(''); }}
                  className={`rounded-xl border p-4 text-left transition ${
                    turmaAberta === t.codigo_turma
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-gray-200 hover:border-brand-300 dark:border-gray-800'
                  }`}
                >
                  <p className="font-semibold text-gray-800 dark:text-white/90">Turma {t.codigo_turma}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.nivel} · {t.turno} · {t.total_estudantes} estudantes</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    {vinculos.filter((v) => v.codigo_turma === t.codigo_turma).map((v) => v.materia_nome).join(', ')}
                  </p>
                </button>
              ))}
            </div>

            {turmaAberta && (
              <div className="space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  {abas.map((a) => (
                    <Button key={a.id} size="sm" variant={aba === a.id ? 'primary' : 'outline'} onClick={() => setAba(a.id)}>{a.rotulo}</Button>
                  ))}
                  {aba !== 'estudantes' && materiasDaTurma.length > 1 && (
                    <select
                      className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      value={materiaFiltro}
                      onChange={(e) => setMateriaFiltro(e.target.value)}
                    >
                      <option value="">Todas as minhas matérias</option>
                      {materiasDaTurma.map((m) => <option key={m.materia_id} value={m.materia_id}>{m.materia_nome}</option>)}
                    </select>
                  )}
                </div>

                {erroDetalhe && <Alert variant="error" title="Erro" message={erroDetalhe} />}
                {carregandoDetalhe ? (
                  <p className="text-sm text-gray-500">Carregando…</p>
                ) : aba === 'estudantes' ? (
                  <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                    {estudantes.map((e) => (
                      <li key={e.codigo_estudante} className="flex justify-between py-2">
                        <span className="text-gray-800 dark:text-white/90">{e.nome}</span>
                        <span className="text-gray-500">{e.codigo_estudante}</span>
                      </li>
                    ))}
                    {estudantes.length === 0 && <li className="py-2 text-gray-500">Turma sem estudantes.</li>}
                  </ul>
                ) : aba === 'notas' ? (
                  <TabelaSimples
                    cabecalho={['Estudante', 'Matéria', 'Período', 'Categoria', 'Nota']}
                    linhas={notas.map((n) => [rotuloEstudante(n.codigo_estudante), nomeMateria.get(n.materia_id) ?? '', `${n.ano_lectivo} · ${n.periodo}`, n.categoria, String(n.nota)])}
                    vazio="Sem notas lançadas."
                  />
                ) : (
                  <TabelaSimples
                    cabecalho={['Estudante', 'Matéria', 'Data', 'Faltas', 'Sumário']}
                    linhas={faltas.map((f) => [rotuloEstudante(f.codigo_estudante), nomeMateria.get(f.materia_id) ?? '', f.data, String(f.quantidade), f.sumario_titulo || '—'])}
                    vazio="Sem faltas lançadas."
                  />
                )}
                {aba !== 'estudantes' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Consulta apenas: ainda não é possível lançar nem corrigir por aqui.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabelaSimples({ cabecalho, linhas, vazio }: { cabecalho: string[]; linhas: string[][]; vazio: string }) {
  if (linhas.length === 0) return <p className="text-sm text-gray-500">{vazio}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
          <tr>{cabecalho.map((c) => <th key={c} className="py-2 pr-4">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {linhas.map((l, i) => (
            <tr key={i}>{l.map((c, j) => <td key={j} className="py-2 pr-4 text-gray-800 dark:text-white/90">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

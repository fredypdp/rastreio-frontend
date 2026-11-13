// src/app/(full-width-pages)/recuperar-senha/[token]/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { tokenStorage } from '@/lib/api';
import { ResetarSenhaComToken } from '@/lib/utils/email';
import { validarNovaSenha } from '@/lib/utils/senha';

/**
 * Página aberta pelo link do e-mail de recuperação (/recuperar-senha/<token>).
 * O titular escolhe aqui a nova senha; só neste passo a senha muda. O token é
 * de uso único e vale 1 hora. A página é pública.
 */
export default function RecuperarSenhaPage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    const errosValidacao = validarNovaSenha(novaSenha, confirmacao);
    setErros(errosValidacao);
    setErroServidor(null);
    if (errosValidacao.length > 0) return;

    setEnviando(true);
    try {
      await ResetarSenhaComToken(token, novaSenha);
      // As sessões anteriores deixaram de valer no servidor: limpa a local.
      tokenStorage.remove();
      setConcluido(true);
    } catch (error) {
      setErroServidor(
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível redefinir a senha. Tente novamente.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        {concluido ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Senha redefinida!</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              A sua nova senha já está ativa. Entre com ela para continuar.
            </p>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Definir nova senha</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escolha a nova senha da sua conta. O link é de uso único e vale por 1 hora.
              </p>
            </div>

            {!token && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                O link de recuperação está incompleto ou inválido.
              </div>
            )}

            <div>
              <Label htmlFor="nova_senha">Nova senha</Label>
              <Input
                id="nova_senha"
                name="nova_senha"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                value={novaSenha}
                disabled={enviando || !token}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmacao">Confirmar nova senha</Label>
              <Input
                id="confirmacao"
                name="confirmacao"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmacao}
                disabled={enviando || !token}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>

            {erros.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <ul className="list-inside list-disc space-y-1">
                  {erros.map((erro) => (
                    <li key={erro} className="text-sm text-red-700 dark:text-red-400">{erro}</li>
                  ))}
                </ul>
              </div>
            )}

            {erroServidor && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{erroServidor}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Se o link expirou ou já foi usado,{' '}
                  <Link href="/esqueci-senha" className="text-brand-500 hover:text-brand-600">
                    peça um novo
                  </Link>
                  .
                </p>
              </div>
            )}

            <Button disabled={enviando || !token} className="w-full" size="sm">
              {enviando ? 'A guardar...' : 'Redefinir senha'}
            </Button>

            <p className="text-sm text-gray-700 dark:text-gray-400">
              <Link href="/login" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// src/app/(full-width-pages)/trocar-senha/page.tsx
'use client';

import { rotaInicial } from '@/lib/perfil-efetivo-regras';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { formatApiError, tokenStorage } from '@/lib/api/client';
import { perfilService } from '@/lib/api';
import { validarNovaSenha } from '@/lib/utils/senha';

/**
 * Troca obrigatória da senha temporária (SEC-04).
 *
 * Toda conta criada por terceiros (estudante, academia, administrador) recebe
 * uma senha temporária por SMS/e-mail. Enquanto ela não for trocada o servidor
 * recusa tudo (403 SENHA_TEMPORARIA) menos ler o perfil, trocar a senha e sair;
 * o RouteGuard e o cliente de API trazem o titular para esta tela.
 */
export default function TrocarSenhaPage() {
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // O servidor é a fonte da verdade: só fica aqui quem de facto precisa trocar.
  useEffect(() => {
    let ativo = true;
    const token = tokenStorage.get();
    if (!token) {
      router.replace('/login');
      return;
    }
    perfilService
      .meuPerfil(token)
      .then((perfil) => {
        if (!ativo) return;
        if (perfil.deve_alterar_senha) {
          tokenStorage.setDeveAlterarSenha(true);
          setVerificando(false);
        } else {
          tokenStorage.setDeveAlterarSenha(false);
          router.replace('/painel');
        }
      })
      .catch(() => {
        if (!ativo) return;
        // Sessão inválida ou encerrada (por exemplo, credenciais reenviadas).
        tokenStorage.remove();
        router.replace('/login');
      });
    return () => {
      ativo = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;

    const errosValidacao = validarNovaSenha(novaSenha, confirmacao, senhaAtual);
    if (!senhaAtual) errosValidacao.unshift('Informe a senha temporária recebida');
    setErros(errosValidacao);
    setErroServidor(null);
    if (errosValidacao.length > 0) return;

    setEnviando(true);
    try {
      const resposta = await perfilService.alterarSenha({ senha_atual: senhaAtual, nova_senha: novaSenha });
      // A troca da senha temporária encerra as sessões emitidas antes (inclusive
      // esta): o servidor devolve um token novo, que passa a ser o da sessão.
      if (resposta.token) {
        tokenStorage.set(resposta.token);
      }
      tokenStorage.setDeveAlterarSenha(false);
      router.replace(rotaInicial(tokenStorage.getWithType().type, false));
    } catch (error) {
      setErroServidor(formatApiError(error, 'Não foi possível alterar a senha. Tente novamente.'));
    } finally {
      setEnviando(false);
    }
  };

  const sair = () => {
    tokenStorage.remove();
    router.replace('/login');
  };

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div>
          <h1 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Defina a sua senha</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Por segurança, a senha temporária que recebeu precisa de ser trocada antes de continuar.
            Escolha uma senha só sua e não a partilhe com ninguém.
          </p>
        </div>

        <div>
          <Label htmlFor="senha_atual">Senha temporária</Label>
          <Input
            id="senha_atual"
            name="senha_atual"
            type="password"
            placeholder="A senha recebida por SMS ou e-mail"
            value={senhaAtual}
            disabled={enviando}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="nova_senha">Nova senha</Label>
          <Input
            id="nova_senha"
            name="nova_senha"
            type="password"
            placeholder="Mínimo de 8 caracteres"
            value={novaSenha}
            disabled={enviando}
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
            disabled={enviando}
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
          </div>
        )}

        <Button disabled={enviando} className="w-full" size="sm">
          {enviando ? 'A guardar...' : 'Guardar nova senha'}
        </Button>
        <button type="button" onClick={sair} className="w-full text-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          Sair
        </button>
      </form>
    </div>
  );
}

// src/components/contas/AvisoCredenciaisConta.tsx
import React from 'react';
import type { CredenciaisEnvio } from '@/types/api';

/**
 * Resultado do envio das credenciais de uma conta NOVA de secretário, professor
 * ou encarregado. A senha nunca aparece no tela: segue por SMS para o telefone
 * da própria pessoa. Para estes tipos ainda não existe "Reenviar credenciais"
 * (fora do escopo da Parte 5): se o SMS falhar, a academia elimina a conta e
 * volta a criá-la.
 */
export default function AvisoCredenciaisConta({ credenciais, quem }: { credenciais?: CredenciaisEnvio; quem: string }) {
  if (!credenciais) return null;
  if (credenciais.enviada || credenciais.motivo === 'em_fila') {
    return (
      <p className="text-sm text-green-700 dark:text-green-400">
        As credenciais temporárias de {quem} foram enviadas por SMS. A senha deve ser trocada no primeiro acesso.
      </p>
    );
  }
  const porque =
    credenciais.motivo === 'ambiente_nao_producao'
      ? 'Este ambiente não é de produção: o SMS não foi enviado.'
      : credenciais.motivo === 'provedor_nao_configurado'
        ? 'Nenhum provedor de SMS padrão está configurado.'
        : 'Não foi possível enviar o SMS.';
  return (
    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      {porque} A conta foi criada, mas {quem} ainda não recebeu as credenciais. Depois de resolver o envio, exclua esta conta e crie-a de novo
      (o reenvio de credenciais para este tipo de conta ainda não está disponível).
    </p>
  );
}

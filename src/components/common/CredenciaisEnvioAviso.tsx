// src/components/common/CredenciaisEnvioAviso.tsx
import type { CredenciaisEnvio } from '@/types/api';

/**
 * Texto do resultado do envio das credenciais temporárias (SEC-04).
 *
 * As credenciais NUNCA aparecem no ecrã: a senha temporária segue por SMS (ou
 * e-mail, para administradores) e tem de ser trocada no primeiro acesso. Falha
 * de envio não desfaz o cadastro; a conta fica elegível a "Reenviar credenciais".
 */
export function descreverEnvioCredenciais(credenciais: CredenciaisEnvio | undefined, destino: string): { tipo: 'ok' | 'aviso'; texto: string } | null {
  if (!credenciais) return null;
  const canal = credenciais.canal === 'email' ? 'e-mail' : 'SMS';
  if (credenciais.enviada) {
    return { tipo: 'ok', texto: `As credenciais temporárias foram enviadas por ${canal} ${destino}. Deverão ser trocadas no primeiro acesso.` };
  }
  switch (credenciais.motivo) {
    case 'ambiente_nao_producao':
      return { tipo: 'aviso', texto: 'Este ambiente não é de produção: as credenciais NÃO foram enviadas por SMS.' };
    case 'provedor_nao_configurado':
      return { tipo: 'aviso', texto: 'Nenhum provedor de SMS padrão está configurado: as credenciais NÃO foram enviadas. Depois de configurar o provedor, use "Reenviar credenciais".' };
    case 'em_fila':
      return { tipo: 'ok', texto: `As credenciais temporárias estão na fila de envio por ${canal} ${destino}.` };
    default:
      return { tipo: 'aviso', texto: `Não foi possível enviar as credenciais por ${canal}. A conta foi criada: use "Reenviar credenciais" para tentar de novo.` };
  }
}

export default function CredenciaisEnvioAviso({ credenciais, destino }: { credenciais?: CredenciaisEnvio; destino: string }) {
  const info = descreverEnvioCredenciais(credenciais, destino);
  if (!info) return null;
  const classes = info.tipo === 'ok'
    ? 'text-green-700 dark:text-green-400'
    : 'rounded-lg bg-amber-50 p-3 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
  return <p className={`text-xs ${classes}`}>{info.texto}</p>;
}

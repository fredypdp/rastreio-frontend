// src/lib/configuracaoSistema.ts
//
// Regras de apresentação e validação da tela "Configurações do sistema"
// (Parte 3 do Plano de Atualizações). Funções puras, sem React.

import type { ConfiguracaoSistemaItem } from '@/types/api';

export const ORIGEM_LABEL: Record<ConfiguracaoSistemaItem["origem"], string> = {
  banco: "Gravada pelo sistema",
  ambiente: "Variável de ambiente",
  nao_definida: "Não definida",
};

export const ORIGEM_COLOR: Record<ConfiguracaoSistemaItem["origem"], "success" | "info" | "light"> = {
  banco: "success",
  ambiente: "info",
  nao_definida: "light",
};

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatData(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("pt-AO");
}

/** Texto do valor atual na tela. Segredo nunca mostra o valor, só a máscara. */
export function valorAtual(item: ConfiguracaoSistemaItem): string {
  if (item.segredo) return item.mascara ?? "Não definido";
  if (item.valor === null || item.valor === "") return "Não definido";
  if (item.tipo === "booleano") return item.valor === "true" ? "Sim" : "Não";
  return item.valor;
}

/**
 * Valida no navegador só para dar retorno imediato; quem decide é sempre o servidor
 * (a mesma regra vive em sysconfig.Definicao.Validar, no backend).
 */
export function validarLocal(item: ConfiguracaoSistemaItem, bruto: string): string | null {
  const v = bruto.trim();
  if (v === "") return "Informe um valor. Para voltar ao valor do ambiente, use “Voltar ao ambiente”.";
  if (item.tipo === "numero") {
    const n = Number(v);
    if (!Number.isFinite(n)) return "Informe um número válido.";
    if (item.inteiro && !Number.isInteger(n)) return "Informe um número inteiro.";
    if (item.min !== undefined && n < item.min) return `O mínimo é ${item.min}.`;
    if (item.max !== undefined && n > item.max) return `O máximo é ${item.max}.`;
  }
  return null;
}

export function valorInicialDoEditor(item: ConfiguracaoSistemaItem): string {
  if (item.segredo) return "";
  if (item.valor !== null) return item.valor;
  if (item.tipo === "booleano") return "true";
  if (item.opcoes && item.opcoes.length > 0) return item.opcoes[0];
  return "";
}


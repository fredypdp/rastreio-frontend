// src/lib/utils/senha.ts

/** Limites aceites pelo backend (utils.ValidateSenha): 8 a 128 caracteres. */
export const SENHA_TAMANHO_MINIMO = 8;
export const SENHA_TAMANHO_MAXIMO = 128;

/**
 * Valida a nova senha escolhida (recuperação por link e troca obrigatória da
 * senha temporária). Devolve a lista de erros em português; vazia = válida.
 * Quando `senhaAtual` é informada, exige uma senha diferente dela.
 */
export function validarNovaSenha(novaSenha: string, confirmacao: string, senhaAtual?: string): string[] {
  const erros: string[] = [];
  if (novaSenha.length < SENHA_TAMANHO_MINIMO) {
    erros.push(`A nova senha deve ter pelo menos ${SENHA_TAMANHO_MINIMO} caracteres`);
  }
  if (novaSenha.length > SENHA_TAMANHO_MAXIMO) {
    erros.push(`A nova senha deve ter no máximo ${SENHA_TAMANHO_MAXIMO} caracteres`);
  }
  if (senhaAtual !== undefined && novaSenha !== '' && novaSenha === senhaAtual) {
    erros.push('A nova senha deve ser diferente da senha atual');
  }
  if (novaSenha !== confirmacao) {
    erros.push('A confirmação não coincide com a nova senha');
  }
  return erros;
}

// src/lib/perfil-efetivo-regras.ts
//
// Regras PURAS (sem rede) de quais páginas o secretário pode abrir. Ficam à
// parte de perfil-efetivo.ts para o guard de rotas poder importá-las sem
// arrastar o cliente HTTP.

/** Páginas da academia que o secretário NUNCA acessa (a rota do servidor é reservada). */
export const ROTAS_RESERVADAS_A_ACADEMIA = [
  '/secretarios',
  '/configuracoes/personalizar',
  '/financas/configuracoes/provedor',
];

/** Páginas que o secretário não acessa nem com permissão: lançar nota/falta é só do professor. */
export const ROTAS_NEGADAS_AO_SECRETARIO = ['/notas/lancar', '/faltas/lancar'];

/**
 * Página → permissão exigida do secretário (prefixo mais específico primeiro).
 * Espelha internal/permissoes/rotas.go do backend, no nível das páginas.
 */
export const PERMISSAO_DA_PAGINA: ReadonlyArray<readonly [string, string]> = [
  ['/estudantes/cadastrar', 'estudantes.cadastrar'],
  ['/estudantes', 'estudantes.ver'],
  ['/solicitacoes', 'estudantes.situacao'],
  ['/gerenciamento/cursos', 'cursos.gerir'],
  ['/gerenciamento/materias', 'materias.ver'],
  ['/gerenciamento/sumarios', 'sumarios.ver'],
  ['/gerenciamento/turmas', 'turmas.ver'],
  ['/notas', 'notas.ver'],
  ['/faltas/configuracoes', 'faltas.configurar'],
  ['/faltas', 'faltas.ver'],
  ['/avaliacoes', 'avaliacoes.ver'],
  ['/configuracoes/regras-avaliacao-final', 'avaliacoes.ver'],
  ['/configuracoes/categorias-nota', 'avaliacoes.ver'],
  ['/configuracoes/ano-letivo', 'ano_letivo.gerir'],
  ['/configuracoes/anos-academicos', 'ano_letivo.gerir'],
  ['/configuracoes/matricula', 'estudantes.cadastrar'],
  ['/servicos-extras/gerenciar-servicos', 'servicos_extras.ver'],
  ['/servicos-extras/categorias-servico', 'servicos_extras.ver'],
  ['/servicos-extras/inscricoes', 'servicos_extras.ver'],
  ['/financas', 'financeiro.ver'],
  ['/comunicacao', 'comunicacao.ver'],
  ['/professores', 'professores.ver'],
];

function dentroDe(pathname: string, prefixo: string): boolean {
  return pathname === prefixo || pathname.startsWith(`${prefixo}/`);
}

/** Permissão exigida pela página (ou null se qualquer secretário a vê). */
export function permissaoDaPagina(pathname: string): string | null {
  const achada = PERMISSAO_DA_PAGINA.find(([prefixo]) => dentroDe(pathname, prefixo));
  return achada ? achada[1] : null;
}

/** O secretário (com estas permissões) pode abrir a página? */
export function secretarioPodeAbrir(pathname: string, permissoes: string[] | undefined): boolean {
  if (ROTAS_RESERVADAS_A_ACADEMIA.some((r) => dentroDe(pathname, r))) return false;
  if (ROTAS_NEGADAS_AO_SECRETARIO.some((r) => dentroDe(pathname, r))) return false;
  const exigida = permissaoDaPagina(pathname);
  return exigida === null || (permissoes ?? []).includes(exigida);
}

/** Rota inicial de cada tipo real depois do login. */
export function rotaInicial(tipo: string | null | undefined, temEducando = false): string {
  if (tipo === 'professor') return '/professor';
  if (tipo === 'encarregado') return temEducando ? '/painel' : '/encarregado';
  return '/painel';
}

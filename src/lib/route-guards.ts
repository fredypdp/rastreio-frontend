// src/lib/route-guards.ts

import { UserType } from '@/types/api';
import { isTestesPageEnabled } from '@/lib/app-env';
import { secretarioPodeAbrir } from '@/lib/perfil-efetivo-regras';

export interface RouteConfig {
  path: string;
  allowedTypes: UserType[] | 'public' | 'authenticated';
  redirectIfUnauthorized?: string;
}

export const ROUTE_PERMISSIONS: RouteConfig[] = [
  // ==========================================
  // ROTAS PÚBLICAS (sem autenticação)
  // ==========================================
  {
    path: '/login',
    allowedTypes: 'public',
    redirectIfUnauthorized: '/',
  },
  {
    path: '/esqueci-senha',
    allowedTypes: 'public',
    redirectIfUnauthorized: '/',
  },
  {
    path: '/instituicoes/cadastrar',
    allowedTypes: 'public',
    redirectIfUnauthorized: '/',
  },
  {
    path: '/dominis/esqueci-senha',
    allowedTypes: 'public',
    redirectIfUnauthorized: '/',
  },
  {
    path: '/verificar-email',
    allowedTypes: 'public',
  },
  {
    // Link do e-mail de recuperação: /recuperar-senha/<token>. Pública e, ao
    // contrário de /login, não redireciona quem já está autenticado.
    path: '/recuperar-senha/[token]',
    allowedTypes: 'public',
  },
  {
    path: '/error-404',
    allowedTypes: 'public',
  },

  // ==========================================
  // ROTAS APENAS PARA ADMIN
  // ==========================================
  {
    path: '/academias',
    allowedTypes: ['admin'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/academias/cadastrar',
    allowedTypes: ['admin'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/solicitacoes-nif',
    allowedTypes: ['admin'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/estudantes',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/solicitacoes',
    allowedTypes: ['admin', 'academia', 'estudante'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/armazenamento',
    allowedTypes: ['admin'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/comunicacao',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/painel',
  },
  {
    path: '/configuracoes/personalizar',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },
  {
    path: '/configuracoes/ano-letivo',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/configuracoes/anos-academicos',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/configuracoes/categorias-nota',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/configuracoes/matricula',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/configuracoes/regras-avaliacao-final',
    allowedTypes: ['admin', 'academia', 'estudante'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/configuracoes/seguranca',
    allowedTypes: ['admin', 'academia', 'estudante'],
    redirectIfUnauthorized: '/',
  },
  {
    // Configurações do sistema (Parte 3): a rota é de admin; a página só abre para os
    // papéis adm e fpp (e só o fpp altera, como exige o backend).
    path: '/configuracoes/sistema',
    allowedTypes: ['admin'],
    redirectIfUnauthorized: '/',
  },

  // ==========================================
  // ROTAS DE FINANÇAS — Admin FPP e Academia
  // ==========================================
  {
    path: '/financas/configuracoes',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/configuracoes/provedor',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/configuracoes/mensalidade',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/configuracoes/mensalidade/criar',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/configuracoes/mensalidade/inicio-cobranca',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/gestao-cobrancas',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/gestao-cobrancas/anular-mensalidade',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/gestao-cobrancas/reativar-mensalidade',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/gestao-cobrancas/cancelar-cobranca',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/pagamentos',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/financas/pagamentos/mensalidades',
    allowedTypes: ['admin', 'academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/pagamentos',
    allowedTypes: ['estudante'],
    redirectIfUnauthorized: '/login',
  },

  // ==========================================
  // ROTAS PARA ACADEMIA — Gerenciamento (sub-páginas)
  // ==========================================
  {
    path: '/gerenciamento/cursos',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/gerenciamento/materias-disciplinares',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/gerenciamento/turmas',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/gerenciamento',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },

  // ==========================================
  // ROTAS PARA ACADEMIA — Serviços (gestão)
  // Movidas de /gerenciamento/servicos-extras* — antes sem entrada própria
  // aqui (caíam no fallback "qualquer usuário autenticado"), agora
  // explicitamente restritas a 'academia', como o resto da gestão.
  // ==========================================
  {
    // Parte 7: o catálogo de serviços é fixo (Transporte e Atividade extracurricular).
    path: '/servicos-extras/transporte',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/servicos-extras/atividades',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/servicos-extras/inscricoes',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },

  // ==========================================
  // ROTAS PARA ESTUDANTE — Serviços Extras (catálogo)
  // Antes sem entrada própria em ROUTE_PERMISSIONS (caíam no fallback
  // "qualquer usuário autenticado"), então uma academia/admin conseguia
  // abrir essas páginas e só descobria que não tinha acesso ao ver um
  // erro vindo da API. Agora restritas a 'estudante' aqui, então o
  // guard bloqueia antes mesmo da página tentar carregar dados.
  // ==========================================
  {
    path: '/servicos-extras/catalogo',
    allowedTypes: ['estudante'],
    redirectIfUnauthorized: '/',
  },
  {
    path: '/servicos-extras/minhas-inscricoes',
    allowedTypes: ['estudante'],
    redirectIfUnauthorized: '/',
  },

  // ==========================================
  // ROTAS DE TESTES — apenas academia em ambiente de teste/desenvolvimento
  // ==========================================
  {
    path: '/testes',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/painel',
  },
  {
    path: '/dev/seed',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/',
  },

  // ==========================================
  // NOTAS / FALTAS
  // ==========================================
  {
    path: '/notas/lancar',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/notas',
  },
  {
    path: '/faltas/lancar',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/faltas',
  },
  {
    path: '/faltas/configuracoes',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/faltas',
  },
  {
    path: '/notas',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },
  {
    path: '/faltas',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },

  // ==========================================
  // ROTAS DE AVALIAÇÕES
  // ==========================================
  {
    path: '/avaliacoes',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },
  {
    path: '/avaliacoes/avaliacoes-finais',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },

  // ==========================================
  // PARTE 4 — SECRETÁRIOS, PROFESSORES E ENCARREGADOS
  // ==========================================
  {
    // Gestão de secretários: só a conta da academia (o secretário é barrado
    // em checkRoutePermission, que vê o tipo REAL).
    path: '/secretarios',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/painel',
  },
  {
    // A academia, ou o secretário com professores.ver.
    path: '/professores',
    allowedTypes: ['academia'],
    redirectIfUnauthorized: '/painel',
  },
  {
    path: '/professor',
    allowedTypes: ['professor'],
    redirectIfUnauthorized: '/painel',
  },
  {
    // 'estudante' cobre o encarregado que já escolheu um educando (tipo efetivo).
    path: '/encarregado',
    allowedTypes: ['encarregado', 'estudante'],
    redirectIfUnauthorized: '/painel',
  },

  // ==========================================
  // ROTAS PARA USUÁRIOS AUTENTICADOS
  // ==========================================
  {
    // Troca obrigatória da senha temporária (SEC-04).
    path: '/trocar-senha',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },
  {
    path: '/perfil',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/login',
  },
  {
    path: '/',
    allowedTypes: 'public',
    redirectIfUnauthorized: '/painel',
  },
  {
    path: '/painel',
    allowedTypes: 'authenticated',
    redirectIfUnauthorized: '/',
  },
];

/** Contexto do perfil REAL, para as regras dos tipos da Parte 4. */
export interface ContextoPerfil {
  /** Tipo real de quem entrou (o `userType` é o efetivo). */
  tipoReal?: UserType | null;
  /** Secretário: permissões concedidas pela academia. */
  permissoes?: string[];
}

/** Páginas das contas pessoais que professor e encarregado (sem educando) podem abrir. */
const PAGINAS_DE_CONTA = ['/perfil', '/trocar-senha', '/configuracoes/seguranca'];

function dentroDe(pathname: string, prefixo: string): boolean {
  return pathname === prefixo || pathname.startsWith(`${prefixo}/`);
}

/**
 * Regras do tipo REAL (Parte 4). Devolve o redirecionamento quando a página não
 * é do perfil; undefined se nada a objetar. Só decide o que mostrar — o
 * servidor continua a ser quem permite.
 */
function restricaoDoTipoReal(
  pathname: string,
  userType: UserType | null,
  contexto: ContextoPerfil
): { allowed: false; redirectTo: string } | undefined {
  const real = contexto.tipoReal ?? userType;
  if (real === 'secretario') {
    return secretarioPodeAbrir(pathname, contexto.permissoes) ? undefined : { allowed: false, redirectTo: '/painel' };
  }
  if (real === 'professor') {
    const ok = dentroDe(pathname, '/professor') || PAGINAS_DE_CONTA.some((p) => dentroDe(pathname, p));
    return ok ? undefined : { allowed: false, redirectTo: '/professor' };
  }
  if (real === 'encarregado') {
    if (dentroDe(pathname, '/encarregado') || PAGINAS_DE_CONTA.some((p) => dentroDe(pathname, p))) return undefined;
    // Sem educando escolhido (tipo efetivo ainda 'encarregado') só há a lista de educandos.
    if (userType === 'encarregado') return { allowed: false, redirectTo: '/encarregado' };
    // Com educando: as páginas pessoais do estudante (dados dele) não são do encarregado.
    if (dentroDe(pathname, '/configuracoes/personalizar')) return { allowed: false, redirectTo: '/perfil' };
    return undefined;
  }
  // Ninguém além do encarregado vê a área do encarregado, nem além do professor a do professor.
  if (dentroDe(pathname, '/encarregado') || dentroDe(pathname, '/professor')) {
    return { allowed: false, redirectTo: '/painel' };
  }
  return undefined;
}

export function checkRoutePermission(
  pathname: string,
  userType: UserType | null,
  isAuthenticated: boolean,
  deveAlterarSenha = false,
  contexto: ContextoPerfil = {}
): {
  allowed: boolean;
  redirectTo?: string;
} {
  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  // SEC-04: com a senha temporária ainda ativa, a única tela permitida é a da
  // troca obrigatória (o servidor recusa o resto com 403 SENHA_TEMPORARIA).
  // O estudante desvinculado (inativo) também troca primeiro.
  if (isAuthenticated && deveAlterarSenha && normalizedPath !== '/trocar-senha') {
    return { allowed: false, redirectTo: '/trocar-senha' };
  }

  if (normalizedPath === '/testes' && !isTestesPageEnabled()) {
    return { allowed: false, redirectTo: '/painel' };
  }

  if (isAuthenticated && userType) {
    const restricao = restricaoDoTipoReal(normalizedPath, userType, contexto);
    if (restricao) return restricao;
  }

  const routeConfig = ROUTE_PERMISSIONS.find(route => {
    if (route.path === normalizedPath) return true;
    if (route.path.includes('[') && normalizedPath.startsWith(route.path.split('[')[0])) {
      return true;
    }
    return false;
  });

  if (!routeConfig) {
    if (!isAuthenticated) {
      return { allowed: false, redirectTo: '/' };
    }
    return { allowed: true };
  }

  if (routeConfig.allowedTypes === 'public') {
    if (isAuthenticated && routeConfig.redirectIfUnauthorized) {
      return { allowed: false, redirectTo: routeConfig.redirectIfUnauthorized };
    }
    return { allowed: true };
  }

  if (routeConfig.allowedTypes === 'authenticated') {
    if (!isAuthenticated) {
      return { allowed: false, redirectTo: routeConfig.redirectIfUnauthorized || '/login' };
    }
    return { allowed: true };
  }

  if (Array.isArray(routeConfig.allowedTypes)) {
    if (!isAuthenticated || !userType) {
      return { allowed: false, redirectTo: routeConfig.redirectIfUnauthorized || '/login' };
    }
    if (!routeConfig.allowedTypes.includes(userType)) {
      return { allowed: false, redirectTo: routeConfig.redirectIfUnauthorized || '/' };
    }
    return { allowed: true };
  }

  return { allowed: false, redirectTo: '/login' };
}

export function getRouteInfo(pathname: string): RouteConfig | null {
  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  return ROUTE_PERMISSIONS.find(route => {
    if (route.path === normalizedPath) return true;
    if (route.path.includes('[') && normalizedPath.startsWith(route.path.split('[')[0])) {
      return true;
    }
    return false;
  }) || null;
}

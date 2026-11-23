// src/hooks/useRoutePermission.ts

import { usePathname } from 'next/navigation';
import { useUserCookie } from './useUserCookie';
import { tokenStorage } from '@/lib/api';
import { checkRoutePermission, getRouteInfo } from '@/lib/route-guards';
import type { UserType } from '@/types/api';

/**
 * Hook para verificar permissões de rota
 */
export function useRoutePermission() {
  const pathname = usePathname();
  const { user, loading } = useUserCookie();
  const token = tokenStorage.get();
  const isAuthenticated = !!token;
  const userType = user?.tipo || null;

  const permission = checkRoutePermission(
    pathname,
    userType,
    isAuthenticated,
    tokenStorage.deveAlterarSenha(),
    { tipoReal: user?.tipo_real ?? user?.tipo ?? null, permissoes: user?.permissoes }
  );
  const routeInfo = getRouteInfo(pathname);

  return {
    loading,
    isAuthenticated,
    userType,
    isAllowed: permission.allowed,
    redirectTo: permission.redirectTo,
    routeInfo,
  };
}

/**
 * Hook para verificar se o usuário tem um tipo específico
 */
export function useUserType() {
  const { user, loading } = useUserCookie();

  const isAdmin = user?.tipo === 'admin';
  const isAcademia = user?.tipo === 'academia';
  const isEstudante = user?.tipo === 'estudante';
  const isSecretario = user?.tipo_real === 'secretario';
  const isProfessor = user?.tipo === 'professor';
  const isEncarregado = user?.tipo_real === 'encarregado' || user?.tipo === 'encarregado';

  const hasType = (type: UserType | UserType[]) => {
    if (!user) return false;
    
    if (Array.isArray(type)) {
      return type.includes(user.tipo);
    }
    
    return user.tipo === type;
  };

  return {
    loading,
    userType: user?.tipo || null,
    isAdmin,
    isAcademia,
    isEstudante,
    isSecretario,
    isProfessor,
    isEncarregado,
    hasType,
    user,
  };
}
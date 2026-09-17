"use client"
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { tokenStorage, useApi, perfilService } from '@/lib/api';
import { setCookie } from '@/lib/utils/cookies';
import { useUserCookie } from '@/hooks/useUserCookie';
import RouteGuard from "@/components/guards/RouteGuard";

/**
 * Tela de espera reutilizada enquanto ainda confirmamos se há um perfil mais
 * recente por trás do cookie "user" (ver useEffect abaixo). Usa o mesmo
 * visual da tela de carregamento do RouteGuard para não haver troca de
 * layout perceptível entre as duas fases de verificação.
 */
function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const hasLoadedProfile = useRef(false);

  const { user, loading: loadingUser } = useUserCookie();
  const { execute: executarPegarPerfil } = useApi(perfilService.meuPerfil);
  // Verdadeiro apenas durante a janela entre "não havia cookie 'user' ainda"
  // e "o perfil buscado da API terminou de chegar (e a página vai recarregar
  // sozinha) ou falhou". Enquanto verdadeiro, o conteúdo do painel (children)
  // não tem dados suficientes para ser desenhado corretamente — por isso
  // mostramos esta tela de espera em vez de deixar `children` renderizar em
  // branco até o reload automático abaixo acontecer.
  const [verificandoPerfilInicial, setVerificandoPerfilInicial] = useState(false);

  useEffect(() => {
    // Só executa uma vez por montagem do layout
    if (hasLoadedProfile.current) return;
    if (loadingUser) return;

    const token = tokenStorage.get();
    if (!token) return;
    if (tokenStorage.isRestrictedFinance()) return;

    hasLoadedProfile.current = true;

    const tinhaUserAoIniciar = !!user;
    if (!tinhaUserAoIniciar) {
      setVerificandoPerfilInicial(true);
    }

    executarPegarPerfil(token).then((data) => {
      if (!data) {
        setVerificandoPerfilInicial(false);
        return;
      }

      const userNovo = JSON.stringify(data);

      // Atualiza o cookie silenciosamente com a data mais recente do servidor
      setCookie("user", userNovo, 1);

      // Só recarrega a página se não havia dados antes (primeiro carregamento sem cookie)
      // Evita o loop: se já havia user, NÃO recarrega — apenas atualiza o cookie
      if (!tinhaUserAoIniciar) {
        // Sem dados anteriores: força reload para o cookie novo ser lido pelos componentes
        window.location.reload();
      }
    }).catch(() => {
      // Silencia erros de perfil (ex: token expirado é tratado pelo RouteGuard)
      setVerificandoPerfilInicial(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser]); // Só re-executa se o estado de loading mudar

  const contentPadding = isExpanded || isHovered
    ? "lg:pl-[290px]"
    : "lg:pl-[90px]";

  return (
    <RouteGuard>
      {verificandoPerfilInicial ? (
        <LoadingScreen message="Espere um pouco..." />
      ) : (
        <div className="flex min-h-screen">
          <AppSidebar />
          <Backdrop />

          <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${contentPadding}`}>
            <AppHeader />

            <div className="p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6">
              {children}
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}

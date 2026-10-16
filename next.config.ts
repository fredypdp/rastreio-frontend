import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ENV: process.env.ENV ?? '',
  },
  // A configuração do provedor de pagamento mudou para dentro de Configurações
  // (Tarefa 30); o endereço antigo continua a funcionar (favoritos, links).
  async redirects() {
    return [
      { source: '/financas/credenciais', destination: '/financas/configuracoes/provedor', permanent: false },
    ];
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
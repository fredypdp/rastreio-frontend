// src/hooks/useContagemRegressiva.ts
//
// Contagem regressiva em segundos (ex.: intervalo até poder pedir outro código
// de verificação). Usa o relógio do navegador (Date.now), não só o intervalo,
// para continuar correta mesmo quando a aba fica em segundo plano.

import { useCallback, useEffect, useRef, useState } from 'react';

export function useContagemRegressiva() {
  const [segundos, setSegundos] = useState(0);
  const fimEm = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const parar = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const iniciar = useCallback(
    (total: number) => {
      parar();
      const duracao = Math.max(0, Math.ceil(total));
      setSegundos(duracao);
      if (duracao === 0) return;

      fimEm.current = Date.now() + duracao * 1000;
      timer.current = setInterval(() => {
        const restante = Math.max(0, Math.ceil((fimEm.current - Date.now()) / 1000));
        setSegundos(restante);
        if (restante === 0) parar();
      }, 500);
    },
    [parar]
  );

  useEffect(() => parar, [parar]);

  return { segundos, iniciar, parar };
}

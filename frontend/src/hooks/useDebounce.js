import { useEffect, useState } from 'react';

/**
 * Retrasa la propagacion de un valor.
 *
 * Se usa en los buscadores para no lanzar una peticion por cada tecla
 * pulsada, lo que ademas respeta RNF-005: solo se consulta lo necesario.
 */
export function useDebounce(valor, milisegundos = 300) {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), milisegundos);
    return () => clearTimeout(temporizador);
  }, [valor, milisegundos]);

  return retrasado;
}

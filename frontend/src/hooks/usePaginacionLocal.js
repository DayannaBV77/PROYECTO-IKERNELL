import { useCallback, useMemo, useState } from 'react';

function leerEstadoGuardado(clave, campo, valorPorDefecto) {
  if (!clave) return valorPorDefecto;
  try {
    const raw = sessionStorage.getItem(`ikernell-pag-${clave}`);
    if (!raw) return valorPorDefecto;
    const parsed = JSON.parse(raw);
    const val = Number(parsed?.[campo]);
    return Number.isFinite(val) && val >= 0 ? val : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function guardarEstado(clave, pagina, tamano) {
  if (!clave) return;
  try {
    sessionStorage.setItem(`ikernell-pag-${clave}`, JSON.stringify({ pagina, tamano }));
  } catch {
    // sessionStorage puede estar deshabilitado.
  }
}

/**
 * Mantiene pagina y tamano con persistencia opcional en sessionStorage,
 * evitando reiniciar la navegacion al volver desde un detalle.
 */
export function useEstadoPaginacion(clavePersistencia, tamanoInicial = 10) {
  const [pagina, setPaginaInterna] = useState(() =>
    leerEstadoGuardado(clavePersistencia, 'pagina', 0),
  );
  const [tamano, setTamanoInterno] = useState(() => {
    const guardado = leerEstadoGuardado(clavePersistencia, 'tamano', tamanoInicial);
    return guardado > 0 ? guardado : tamanoInicial;
  });

  const setPagina = useCallback(
    (nuevaPagina) => {
      setPaginaInterna((prev) => {
        const valor = typeof nuevaPagina === 'function' ? nuevaPagina(prev) : nuevaPagina;
        const limpio = Math.max(0, Number(valor) || 0);
        guardarEstado(clavePersistencia, limpio, tamano);
        return limpio;
      });
    },
    [clavePersistencia, tamano],
  );

  const alCambiarTamano = useCallback(
    (nuevoTamano) => {
      const limpio = Math.max(1, Number(nuevoTamano) || tamanoInicial);
      setTamanoInterno(limpio);
      setPaginaInterna(0);
      guardarEstado(clavePersistencia, 0, limpio);
    },
    [clavePersistencia, tamanoInicial],
  );

  return { pagina, setPagina, tamano, alCambiarTamano };
}

/**
 * Paginacion en cliente para tablas que reciben la lista completa desde el servidor.
 */
export function usePaginacionLocal(items = [], { clavePersistencia, tamanoInicial = 10 } = {}) {
  const lista = Array.isArray(items) ? items : [];
  const { pagina, setPagina, tamano, alCambiarTamano } = useEstadoPaginacion(
    clavePersistencia,
    tamanoInicial,
  );

  const totalElementos = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(totalElementos / tamano));
  const paginaSegura = Math.min(pagina, totalPaginas - 1);

  const itemsPaginados = useMemo(() => {
    const inicio = paginaSegura * tamano;
    return lista.slice(inicio, inicio + tamano);
  }, [lista, paginaSegura, tamano]);

  const datosPaginacion = useMemo(
    () => ({
      totalPaginas,
      totalElementos,
      tamano,
      pagina: paginaSegura,
    }),
    [totalPaginas, totalElementos, tamano, paginaSegura],
  );

  return {
    itemsPaginados,
    datosPaginacion,
    pagina: paginaSegura,
    setPagina,
    tamano,
    alCambiarTamano,
  };
}

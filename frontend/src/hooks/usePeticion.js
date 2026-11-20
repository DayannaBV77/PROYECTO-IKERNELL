import { useCallback, useEffect, useRef, useState } from 'react';

const INTERVALO_MINIMO_FOCO_MS = 1500;

/**
 * Ejecuta una peticion a la API y expone sus cuatro estados: cargando, error,
 * datos y la posibilidad de reintentar, ademas de revalidar silenciosamente
 * al retomar el foco de la ventana (Fresh Data on Focus).
 *
 * @param {Function} ejecutar  recibe { senal } y devuelve una promesa
 * @param {Array}    claves    dependencias que disparan una nueva peticion
 */
export function usePeticion(ejecutar, claves = []) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null });

  const clave = JSON.stringify([claves, intento]);
  const cargando = resultado.clave !== clave;

  const ejecutarRef = useRef(ejecutar);
  useEffect(() => {
    ejecutarRef.current = ejecutar;
  });

  const ultimaConsultaRef = useRef(0);
  const controladorFocoRef = useRef(null);

  const reintentar = useCallback(() => setIntento((numero) => numero + 1), []);

  const revalidarSilencioso = useCallback(() => {
    if (cargando) return;
    const ahora = Date.now();
    if (ahora - ultimaConsultaRef.current < INTERVALO_MINIMO_FOCO_MS) return;

    if (controladorFocoRef.current) {
      controladorFocoRef.current.abort();
    }
    const controlador = new AbortController();
    controladorFocoRef.current = controlador;
    ultimaConsultaRef.current = ahora;

    ejecutarRef
      .current({ senal: controlador.signal })
      .then((datos) => {
        if (!controlador.signal.aborted) {
          setResultado({ clave, datos, error: null });
        }
      })
      .catch((fallo) => {
        if (!controlador.signal.aborted && fallo?.name !== 'AbortError') {
          setResultado((prev) => ({ ...prev, error: fallo }));
        }
      });
  }, [cargando, clave]);

  useEffect(() => {
    const controlador = new AbortController();
    let vigente = true;
    ultimaConsultaRef.current = Date.now();

    ejecutarRef
      .current({ senal: controlador.signal })
      .then((datos) => {
        if (vigente) {
          setResultado({ clave, datos, error: null });
        }
      })
      .catch((fallo) => {
        if (vigente && fallo?.name !== 'AbortError') {
          setResultado({ clave, datos: null, error: fallo });
        }
      });

    return () => {
      vigente = false;
      controlador.abort();
      if (controladorFocoRef.current) {
        controladorFocoRef.current.abort();
      }
    };
  }, [clave]);

  useEffect(() => {
    function alRetomarFoco() {
      if (document.visibilityState === 'visible') {
        revalidarSilencioso();
      }
    }

    window.addEventListener('focus', revalidarSilencioso);
    document.addEventListener('visibilitychange', alRetomarFoco);
    return () => {
      window.removeEventListener('focus', revalidarSilencioso);
      document.removeEventListener('visibilitychange', alRetomarFoco);
    };
  }, [revalidarSilencioso]);

  return {
    datos: resultado.datos,
    error: resultado.error,
    cargando,
    reintentar,
    revalidarSilencioso,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una peticion a la API y expone sus cuatro estados: cargando, error,
 * datos y la posibilidad de reintentar.
 *
 * Cada pantalla debe contemplar carga, error, ausencia de datos y ausencia de
 * resultados; este hook entrega la informacion necesaria para distinguirlos sin
 * repetir la misma logica en cada vista.
 *
 * El estado de carga se deduce comparando la peticion en curso con la que
 * produjo los datos guardados, en lugar de activarse al entrar en el efecto.
 * Asi el efecto solo escribe estado desde las devoluciones de la promesa, que
 * es lo que evita los renders en cascada.
 *
 * @param {Function} ejecutar  recibe { senal } y devuelve una promesa
 * @param {Array}    claves    dependencias que disparan una nueva peticion
 */
export function usePeticion(ejecutar, claves = []) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null });

  const clave = JSON.stringify([claves, intento]);
  const cargando = resultado.clave !== clave;

  // Se guarda en una referencia para que redefinir la funcion en cada render no
  // vuelva a lanzar la peticion: quien decide eso son las claves.
  const ejecutarRef = useRef(ejecutar);
  useEffect(() => {
    ejecutarRef.current = ejecutar;
  });

  const reintentar = useCallback(() => setIntento((numero) => numero + 1), []);

  useEffect(() => {
    const controlador = new AbortController();
    let vigente = true;

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
    };
  }, [clave]);

  return { datos: resultado.datos, error: resultado.error, cargando, reintentar };
}

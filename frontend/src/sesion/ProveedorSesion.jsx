import { useCallback, useEffect, useMemo, useState } from 'react';

import { cerrarSesion, iniciarSesion, obtenerSesion } from '../api/autenticacion.js';
import { ContextoSesion } from './contexto.js';

/**
 * Estado de la sesion para toda la aplicacion.
 *
 * La sesion vive en la cookie JSESSIONID, no en el cliente: por eso al arrancar
 * no se lee ningun almacenamiento local, se le pregunta al servidor quien esta
 * dentro. Es tambien lo que hace que la sesion sobreviva a una recarga y que
 * cerrarla en otra pestana acabe notandose aqui.
 *
 * Guardar el trabajador en localStorage seria mas rapido de pintar, pero el
 * cliente mostraria una sesion que el servidor ya pudo haber invalidado.
 */
export default function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ sesion: null, fallo: null, comprobando: true });

  useEffect(() => {
    const controlador = new AbortController();
    let vigente = true;

    obtenerSesion({ senal: controlador.signal })
      .then((sesion) => {
        if (vigente) {
          setEstado({ sesion, fallo: null, comprobando: false });
        }
      })
      .catch((fallo) => {
        if (!vigente || fallo?.name === 'AbortError') {
          return;
        }
        // El 401 es la respuesta normal cuando nadie ha entrado todavia; no es
        // un error que haya que mostrar.
        setEstado({ sesion: null, fallo: fallo.esSinSesion ? null : fallo, comprobando: false });
      });

    return () => {
      vigente = false;
      controlador.abort();
    };
  }, []);

  /** Propaga el error del servidor para que el formulario marque los campos. */
  const entrar = useCallback(async (credenciales) => {
    const sesion = await iniciarSesion(credenciales);
    setEstado({ sesion, fallo: null, comprobando: false });
    return sesion;
  }, []);

  /**
   * Cierra la sesion. No propaga el fallo: si la peticion no llego, la sesion
   * del cliente se descarta igual y la siguiente pantalla privada volvera a
   * preguntar al servidor.
   */
  const salir = useCallback(async () => {
    try {
      await cerrarSesion();
    } catch {
      // Intencionado: el estado local se limpia en cualquier caso.
    } finally {
      setEstado({ sesion: null, fallo: null, comprobando: false });
    }
  }, []);

  const valor = useMemo(() => ({ ...estado, entrar, salir }), [estado, entrar, salir]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

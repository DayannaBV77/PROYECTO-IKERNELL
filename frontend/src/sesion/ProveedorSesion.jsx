import { useCallback, useEffect, useMemo, useState } from 'react';

import { cerrarSesion, iniciarSesion, obtenerSesion } from '../api/autenticacion.js';
import { cambiarContextoProyectoActivo, obtenerMisProyectos } from '../api/asignaciones.js';
import { ContextoSesion } from './contexto.js';

/**
 * Estado de la sesion y contexto de proyectos para toda la aplicacion.
 *
 * La sesion vive en la cookie JSESSIONID, no en el cliente: por eso al arrancar
 * no se lee ningun almacenamiento local, se le pregunta al servidor quien esta
 * dentro.
 */
export default function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ sesion: null, fallo: null, comprobando: true });
  const [misProyectos, setMisProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);

  const cargarProyectosUsuario = useCallback(async () => {
    setCargandoProyectos(true);
    try {
      const respuesta = await obtenerMisProyectos();
      setMisProyectos(respuesta?.contenido || []);
    } catch {
      setMisProyectos([]);
    } finally {
      setCargandoProyectos(false);
    }
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    let vigente = true;

    obtenerSesion({ senal: controlador.signal })
      .then((sesion) => {
        if (vigente) {
          setEstado({ sesion, fallo: null, comprobando: false });
          if (sesion) {
            cargarProyectosUsuario();
          }
        }
      })
      .catch((fallo) => {
        if (!vigente || fallo?.name === 'AbortError') {
          return;
        }
        setEstado({ sesion: null, fallo: fallo.esSinSesion ? null : fallo, comprobando: false });
      });

    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [cargarProyectosUsuario]);

  /** Propaga el error del servidor para que el formulario marque los campos. */
  const entrar = useCallback(async (credenciales) => {
    const sesion = await iniciarSesion(credenciales);
    setEstado({ sesion, fallo: null, comprobando: false });
    if (sesion) {
      cargarProyectosUsuario();
    }
    return sesion;
  }, [cargarProyectosUsuario]);

  /**
   * Cambia el contexto de proyecto activo en el backend y actualiza la sesión local.
   */
  const cambiarProyecto = useCallback(async ({ proyectoId, rol }) => {
    const respuesta = await cambiarContextoProyectoActivo({ proyectoId, rol });
    setEstado((prev) => ({
      ...prev,
      sesion: prev.sesion
        ? {
            ...prev.sesion,
            proyectoActivoId: respuesta.proyectoId,
            proyectoActivoNombre: respuesta.proyectoNombre,
            rolActivo: respuesta.rolActivo,
          }
        : null,
    }));
    return respuesta;
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
      setMisProyectos([]);
    }
  }, []);

  const valor = useMemo(
    () => ({
      ...estado,
      entrar,
      salir,
      misProyectos,
      cargandoProyectos,
      cambiarProyecto,
      recargarProyectos: cargarProyectosUsuario,
    }),
    [estado, entrar, salir, misProyectos, cargandoProyectos, cambiarProyecto, cargarProyectosUsuario],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

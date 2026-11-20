import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cerrarSesion, iniciarSesion, obtenerSesion } from '../api/autenticacion.js';
import { cambiarContextoProyectoActivo, obtenerMisProyectos } from '../api/asignaciones.js';
import { ContextoSesion } from './contexto.js';

const CLAVES_ALMACENAMIENTO_SENSIBLE = [
  'token',
  'authToken',
  'sesion',
  'usuario',
  'ikernell_sesion',
  'ikernell_usuario',
  'ikernell_cache',
];

function purgarAlmacenamientoCliente() {
  try {
    sessionStorage.clear();
  } catch {
    // Ignorar en entornos restringidos.
  }
  try {
    CLAVES_ALMACENAMIENTO_SENSIBLE.forEach((clave) => localStorage.removeItem(clave));
  } catch {
    // Ignorar en entornos restringidos.
  }
}

/**
 * Estado de la sesion y contexto de proyectos para toda la aplicacion.
 *
 * La sesion vive en la cookie JSESSIONID (HttpOnly), no en el cliente.
 * Incluye purga total al salir, revalidacion silenciosa al retomar el foco
 * y reaccion inmediata ante revocacion de cuenta en el servidor.
 */
export default function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ sesion: null, fallo: null, comprobando: true, aviso: null });
  const [misProyectos, setMisProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  const ultimaRevalidacionRef = useRef(0);

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
          setEstado({ sesion, fallo: null, comprobando: false, aviso: null });
          if (sesion) {
            cargarProyectosUsuario();
          }
        }
      })
      .catch((fallo) => {
        if (!vigente || fallo?.name === 'AbortError') {
          return;
        }
        setEstado({
          sesion: null,
          fallo: fallo.esSinSesion ? null : fallo,
          comprobando: false,
          aviso: null,
        });
      });

    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [cargarProyectosUsuario]);

  const invalidarLocalmente = useCallback((aviso = null) => {
    purgarAlmacenamientoCliente();
    setEstado({ sesion: null, fallo: null, comprobando: false, aviso });
    setMisProyectos([]);
  }, []);

  useEffect(() => {
    function alInvalidarseSesion(evento) {
      const mensaje =
        evento?.detail?.mensaje ||
        'Tu sesión ha finalizado o tu cuenta ha sido suspendida. Por favor, contacta al administrador.';
      invalidarLocalmente(mensaje);
    }

    window.addEventListener('ikernell:sesion-invalidada', alInvalidarseSesion);
    return () => {
      window.removeEventListener('ikernell:sesion-invalidada', alInvalidarseSesion);
    };
  }, [invalidarLocalmente]);

  useEffect(() => {
    if (!estado.sesion) return undefined;

    function revalidarSesionAlFoco() {
      const ahora = Date.now();
      if (ahora - ultimaRevalidacionRef.current < 2000) return;
      ultimaRevalidacionRef.current = ahora;

      obtenerSesion()
        .then((sesionActual) => {
          if (!sesionActual) {
            invalidarLocalmente(
              'Tu sesión ha finalizado o tu cuenta ha sido suspendida. Por favor, contacta al administrador.',
            );
            return;
          }
          setEstado((prev) => ({
            ...prev,
            sesion: sesionActual,
            fallo: null,
          }));
        })
        .catch((fallo) => {
          if (fallo?.esSinSesion || fallo?.estado === 401) {
            invalidarLocalmente(
              fallo?.mensaje ||
                'Tu sesión ha finalizado o tu cuenta ha sido suspendida. Por favor, contacta al administrador.',
            );
          }
        });
    }

    function alMostrarPagina(evento) {
      if (evento.persisted) {
        revalidarSesionAlFoco();
      }
    }

    window.addEventListener('focus', revalidarSesionAlFoco);
    window.addEventListener('pageshow', alMostrarPagina);
    return () => {
      window.removeEventListener('focus', revalidarSesionAlFoco);
      window.removeEventListener('pageshow', alMostrarPagina);
    };
  }, [estado.sesion, invalidarLocalmente]);

  /** Propaga el error del servidor para que el formulario marque los campos. */
  const entrar = useCallback(
    async (credenciales) => {
      const sesion = await iniciarSesion(credenciales);
      setEstado({ sesion, fallo: null, comprobando: false, aviso: null });
      if (sesion) {
        cargarProyectosUsuario();
      }
      return sesion;
    },
    [cargarProyectosUsuario],
  );

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
   * Cierra la sesion de forma absoluta (Zero-Ghost Sessions):
   * revoca en backend, purga almacenamiento y borra el estado de React.
   */
  const salir = useCallback(async () => {
    try {
      await cerrarSesion();
    } catch {
      // Intencionado: el estado local y almacenamiento se purgan en cualquier caso.
    } finally {
      invalidarLocalmente(null);
    }
  }, [invalidarLocalmente]);

  const limpiarAviso = useCallback(() => {
    setEstado((prev) => (prev.aviso ? { ...prev, aviso: null } : prev));
  }, []);

  const valor = useMemo(
    () => ({
      ...estado,
      entrar,
      salir,
      limpiarAviso,
      misProyectos,
      cargandoProyectos,
      cambiarProyecto,
      recargarProyectos: cargarProyectosUsuario,
    }),
    [
      estado,
      entrar,
      salir,
      limpiarAviso,
      misProyectos,
      cargandoProyectos,
      cambiarProyecto,
      cargarProyectosUsuario,
    ],
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

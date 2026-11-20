import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import EstadoCarga from '../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../componentes/estados/EstadoError.jsx';
import PaginaSinPermiso from '../modulos/privado/PaginaSinPermiso.jsx';
import { useSesion } from '../sesion/contexto.js';

/**
 * Guarda de las rutas privadas.
 *
 * Previene ademas que el cache de historial del navegador (bfcache) muestre
 * pantallas privadas tras cerrar sesion al pulsar el boton "Atras".
 *
 * @param {Array} [tipos] tipos de trabajador admitidos; sin el, basta la sesion
 */
export default function RutaProtegida({ tipos }) {
  const { sesion, fallo, comprobando, aviso } = useSesion();
  const ubicacion = useLocation();

  useEffect(() => {
    function protegerBfcache(evento) {
      if (evento.persisted && !sesion) {
        window.location.replace('/ingresar');
      }
    }
    window.addEventListener('pageshow', protegerBfcache);
    return () => window.removeEventListener('pageshow', protegerBfcache);
  }, [sesion]);

  if (comprobando) {
    return <EstadoCarga mensaje="Comprobando la sesión..." />;
  }

  if (fallo) {
    return <EstadoError error={fallo} titulo="No se pudo comprobar la sesión" />;
  }

  if (!sesion) {
    return (
      <Navigate
        to="/ingresar"
        replace
        state={{ destino: ubicacion.pathname, aviso: aviso || undefined }}
      />
    );
  }

  const rolEfectivo = sesion.rolActivo || sesion.tipoTrabajador;
  const autorizado = tipos
    ? tipos.includes(rolEfectivo) ||
      (sesion.tipoTrabajador === 'COORDINADOR' && tipos.includes('COORDINADOR'))
    : true;

  if (!autorizado) {
    return <PaginaSinPermiso />;
  }

  return <Outlet />;
}

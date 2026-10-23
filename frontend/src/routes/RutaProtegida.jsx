import { Navigate, Outlet, useLocation } from 'react-router-dom';

import EstadoCarga from '../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../componentes/estados/EstadoError.jsx';
import PaginaSinPermiso from '../modulos/privado/PaginaSinPermiso.jsx';
import { useSesion } from '../sesion/contexto.js';

/**
 * Guarda de las rutas privadas.
 *
 * Esto NO es la medida de seguridad: la decision real la toma el servidor con
 * @PreAuthorize y la configuracion de seguridad, que responden 401 y 403 por su
 * cuenta. Aqui solo se evita ofrecer una pantalla que iba a ser rechazada, que
 * es lo que pide HU-03 C02: el trabajador ve las funciones de su tipo "y
 * ninguna de las que corresponden a otro tipo".
 *
 * Mientras la sesion se comprueba no se redirige: echar a /ingresar a quien
 * acaba de recargar la pagina con la sesion abierta seria un fallo propio del
 * cliente.
 *
 * @param {Array} [tipos] tipos de trabajador admitidos; sin el, basta la sesion
 */
export default function RutaProtegida({ tipos }) {
  const { sesion, fallo, comprobando } = useSesion();
  const ubicacion = useLocation();

  if (comprobando) {
    return <EstadoCarga mensaje="Comprobando la sesion..." />;
  }

  // Un corte de red no es una sesion cerrada: mandar a /ingresar aqui haria
  // perder la sesion por un fallo pasajero.
  if (fallo) {
    return <EstadoError error={fallo} titulo="No se pudo comprobar la sesion" />;
  }

  if (!sesion) {
    // Se recuerda el destino para volver a el despues de entrar.
    return <Navigate to="/ingresar" replace state={{ destino: ubicacion.pathname }} />;
  }

  if (tipos && !tipos.includes(sesion.tipoTrabajador)) {
    return <PaginaSinPermiso />;
  }

  return <Outlet />;
}

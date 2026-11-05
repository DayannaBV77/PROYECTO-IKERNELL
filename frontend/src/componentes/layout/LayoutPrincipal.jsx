import { Outlet, useLocation } from 'react-router-dom';

import { useSesion } from '../../sesion/contexto.js';
import AccionesSesion from './AccionesSesion.jsx';
import Encabezado from './Encabezado.jsx';
import PieDePagina from './PieDePagina.jsx';
import { ENLACES_PUBLICOS, enlacesPara } from './enlaces.js';
import estilos from './LayoutPrincipal.module.css';

/**
 * Estructura de la aplicacion: banda lateral, encabezado, contenido y pie.
 *
 * El pie corporativo completo se presenta en las páginas del portal público,
 * y en la zona privada se presenta en una versión simplificada/técnica de soporte
 * para mantener la vista del panel despejada y enfocada.
 */
export default function LayoutPrincipal() {
  const { sesion } = useSesion();
  const ubicacion = useLocation();

  // En la vista de chat interna no mostramos pie para permitir el scroll natural del historial
  const esPantallaChat = ubicacion.pathname.startsWith('/app/chat');

  return (
    <div className={estilos.pagina}>
      <span className={estilos.banda} aria-hidden="true" />

      <a className="saltar-al-contenido" href="#contenido-principal">
        Saltar al contenido
      </a>

      <Encabezado enlaces={enlacesPara(sesion)} acciones={<AccionesSesion />} />

      <main className={estilos.contenido} id="contenido-principal">
        <Outlet />
      </main>

      {!esPantallaChat && (
        <PieDePagina
          enZonaPrivada={ubicacion.pathname.startsWith('/app')}
          enlaces={ENLACES_PUBLICOS.filter((enlace) => enlace.a !== '/')}
          trabajadores={
            sesion ? { a: '/app', texto: 'Ir al panel de gestión' } : { a: '/ingresar', texto: 'Iniciar sesión' }
          }
        />
      )}
    </div>
  );
}

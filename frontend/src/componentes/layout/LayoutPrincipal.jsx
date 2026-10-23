import { Outlet } from 'react-router-dom';

import { useSesion } from '../../sesion/contexto.js';
import AccionesSesion from './AccionesSesion.jsx';
import Encabezado from './Encabezado.jsx';
import PieDePagina from './PieDePagina.jsx';
import { ENLACES_PUBLICOS, enlacesPara } from './enlaces.js';
import estilos from './LayoutPrincipal.module.css';

/**
 * Estructura de la aplicacion: banda lateral, encabezado, contenido y pie.
 *
 * Es un solo layout para el sitio publico y para la zona privada, y no dos, por
 * el mismo motivo que el encabezado es uno: HU-03 C02 dice que el trabajador
 * autenticado "sigue viendo la informacion empresarial publica y, ademas, ve los
 * servicios internos". Con dos layouts, entrar en el panel significaria salir
 * del sitio publico, que es justo lo que el criterio descarta.
 *
 * Lo que cambia con la sesion son las entradas del menu y la zona de acciones,
 * no el marco.
 */
export default function LayoutPrincipal() {
  const { sesion } = useSesion();

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

      {/* El pie conserva solo las secciones publicas: es la navegacion del
          sitio, no un duplicado del menu de la sesion. */}
      <PieDePagina
        enlaces={ENLACES_PUBLICOS.filter((enlace) => enlace.a !== '/')}
        trabajadores={
          sesion ? { a: '/app', texto: 'Ir al panel' } : { a: '/ingresar', texto: 'Iniciar sesion' }
        }
      />
    </div>
  );
}

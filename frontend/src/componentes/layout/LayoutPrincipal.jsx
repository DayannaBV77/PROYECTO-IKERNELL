import { Outlet } from 'react-router-dom';

import Boton from '../ui/Boton.jsx';
import Encabezado from './Encabezado.jsx';
import PieDePagina from './PieDePagina.jsx';
import { ENLACES_PUBLICOS } from './enlaces.js';
import estilos from './LayoutPublico.module.css';

/** Estructura del sitio publico: banda lateral, encabezado, contenido y pie. */
export default function LayoutPublico() {
  return (
    <div className={estilos.pagina}>
      <span className={estilos.banda} aria-hidden="true" />

      <a className="saltar-al-contenido" href="#contenido-principal">
        Saltar al contenido
      </a>

      <Encabezado
        enlaces={ENLACES_PUBLICOS}
        acciones={
          <Boton a="/ingresar" variante="primario">
            Iniciar sesion
          </Boton>
        }
      />

      <main className={estilos.contenido} id="contenido-principal">
        <Outlet />
      </main>

      <PieDePagina enlaces={ENLACES_PUBLICOS.filter((enlace) => enlace.a !== '/')} />
    </div>
  );
}

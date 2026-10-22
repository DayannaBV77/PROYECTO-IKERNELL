import { Link } from 'react-router-dom';

import estilos from './PieDePagina.module.css';

/**
 * Pie del sitio publico.
 *
 * Solo contiene navegacion y la nota legal. No reproduce datos de contacto ni
 * direcciones: esa informacion vive en la seccion de contacto y la publica la
 * empresa desde el backend, de modo que duplicarla aqui obligaria a inventarla.
 */
export default function PieDePagina({ enlaces }) {
  const anio = new Date().getFullYear();

  return (
    <footer className={estilos.pie}>
      <div className={estilos.contenido}>
        <div className={estilos.bloque}>
          <p className={estilos.nombre}>IKernell Soluciones Software</p>
          <p className={estilos.descripcion}>
            Soluciones de software para la gestion de procesos, informacion y proyectos.
          </p>
        </div>

        <nav className={estilos.bloque} aria-label="Navegacion del pie de pagina">
          <p className={estilos.titulo}>Secciones</p>
          <div className={estilos.lista}>
            {enlaces.map(({ a, texto }) => (
              <Link key={a} to={a}>
                {texto}
              </Link>
            ))}
          </div>
        </nav>

        <div className={estilos.bloque}>
          <p className={estilos.titulo}>Trabajadores</p>
          <div className={estilos.lista}>
            <Link to="/ingresar">Iniciar sesion</Link>
          </div>
        </div>
      </div>

      <p className={estilos.legal}>© {anio} IKernell Soluciones Software</p>
    </footer>
  );
}

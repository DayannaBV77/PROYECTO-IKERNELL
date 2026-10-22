import { Link } from 'react-router-dom';

import estilos from './Boton.module.css';

/**
 * Boton del sistema de diseno.
 *
 * Con `a` renderiza un enlace de React Router en vez de un <button>: una accion
 * que navega debe ser un enlace para que funcionen el teclado, el menu
 * contextual y la apertura en pestana nueva.
 */
export default function Boton({
  variante = 'primario',
  a,
  href,
  icono: Icono,
  completo = false,
  children,
  ...resto
}) {
  const clases = [estilos.boton, estilos[variante], completo ? estilos.completo : '']
    .filter(Boolean)
    .join(' ');

  const contenido = (
    <>
      {Icono && <Icono size={16} aria-hidden="true" />}
      {children}
    </>
  );

  if (a) {
    return (
      <Link to={a} className={clases} {...resto}>
        {contenido}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={clases} {...resto}>
        {contenido}
      </a>
    );
  }

  return (
    <button type="button" className={clases} {...resto}>
      {contenido}
    </button>
  );
}

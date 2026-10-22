import estilos from './Seccion.module.css';

/**
 * Seccion de pagina con su titular.
 *
 * El titulo se renderiza como <h2> y queda enlazado a la region con
 * `aria-labelledby`, de modo que la navegacion por encabezados de un lector de
 * pantalla recorra la pagina en el mismo orden en que se ve.
 */
export default function Seccion({
  titulo,
  descripcion,
  fondo = 'clara',
  id,
  children,
  sinCabecera = false,
}) {
  const idTitulo = id ? `${id}-titulo` : undefined;

  return (
    <section
      className={`${estilos.seccion} ${estilos[fondo]}`}
      id={id}
      aria-labelledby={idTitulo}
    >
      <div className={estilos.contenedor}>
        {!sinCabecera && titulo && (
          <div className={estilos.cabecera}>
            <h2 className={estilos.titulo} id={idTitulo}>
              {titulo}
            </h2>
            {descripcion && <p className={estilos.descripcion}>{descripcion}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Rejilla({ columnas = 3, children }) {
  return (
    <div className={`${estilos.rejilla} ${estilos[`de${columnas}`]}`}>{children}</div>
  );
}

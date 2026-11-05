import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Boton from './Boton.jsx';
import estilos from './PaginacionTabla.module.css';

/**
 * Control avanzado y profesional de paginación y cantidad de registros para tablas.
 *
 * @param {Object}   datos             Respuesta paginada del backend (totalPaginas, totalElementos, tamano, pagina)
 * @param {number}   pagina            Página actual (índice 0-based)
 * @param {Function} alCambiarPagina   Función para alternar la página
 * @param {number}   [tamano]          Cantidad actual de filas por página
 * @param {Function} [alCambiarTamano] Callback al cambiar cantidad por página (opcional)
 * @param {string}   [etiquetaItem]    Nombre del elemento en plural ("proyectos", "actividades", etc.)
 */
export default function PaginacionTabla({
  datos,
  pagina = 0,
  alCambiarPagina,
  tamano = 10,
  alCambiarTamano,
  etiquetaItem = 'registros',
}) {
  const { totalPaginas = 1, totalElementos = 0 } = datos || {};

  const inicio = totalElementos === 0 ? 0 : pagina * tamano + 1;
  const fin = Math.min((pagina + 1) * tamano, totalElementos);

  const opcionesTamano = [5, 10, 20, 50];

  return (
    <div className={estilos.contenedor} aria-label="Controles de tabla y paginación">
      <div className={estilos.seccionCantidad}>
        {alCambiarTamano && (
          <div className={estilos.selectorTamano}>
            <label htmlFor="tamano-pagina-select" className={estilos.etiquetaTamano}>
              Mostrar
            </label>
            <select
              id="tamano-pagina-select"
              value={tamano}
              onChange={(e) => alCambiarTamano(Number(e.target.value))}
              className={estilos.selectTamano}
            >
              {opcionesTamano.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            <span className={estilos.etiquetaTamano}>por página</span>
          </div>
        )}

        <p className={estilos.recuento} aria-live="polite">
          Mostrando <strong>{inicio}</strong> a <strong>{fin}</strong> de{' '}
          <strong>{totalElementos}</strong> {etiquetaItem}
        </p>
      </div>

      <nav className={estilos.navegacion} aria-label="Navegación de páginas">
        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(0)}
          disabled={pagina <= 0}
          title="Primera página"
          aria-label="Ir a la primera página"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(pagina - 1)}
          disabled={pagina <= 0}
          title="Página anterior"
          aria-label="Ir a la página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <span className={estilos.indicadorPagina}>
          Página <strong>{pagina + 1}</strong> de <strong>{Math.max(totalPaginas, 1)}</strong>
        </span>

        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(pagina + 1)}
          disabled={pagina + 1 >= totalPaginas}
          title="Página siguiente"
          aria-label="Ir a la página siguiente"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(totalPaginas - 1)}
          disabled={pagina + 1 >= totalPaginas}
          title="Última página"
          aria-label="Ir a la última página"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

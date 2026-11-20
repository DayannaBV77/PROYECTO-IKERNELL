import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import estilos from './PaginacionTabla.module.css';

/**
 * Calcula la ventana de numeros de pagina a mostrar (maximo 5 botones numericos).
 */
function calcularVentanaPaginas(paginaActual, totalPaginas) {
  const total = Math.max(1, totalPaginas);
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i);
  }
  let inicio = Math.max(0, paginaActual - 2);
  let fin = Math.min(total - 1, inicio + 4);
  if (fin - inicio < 4) {
    inicio = Math.max(0, fin - 4);
  }
  const paginas = [];
  for (let i = inicio; i <= fin; i += 1) {
    paginas.push(i);
  }
  return paginas;
}

/**
 * Control avanzado y estandarizado de paginacion y cantidad de registros para tablas.
 *
 * @param {Object}   datos             Respuesta paginada (totalPaginas, totalElementos, tamano, pagina)
 * @param {number}   pagina            Pagina actual (indice 0-based)
 * @param {Function} alCambiarPagina   Funcion para alternar la pagina
 * @param {number}   [tamano]          Cantidad actual de filas por pagina
 * @param {Function} [alCambiarTamano] Callback al cambiar cantidad por pagina
 * @param {string}   [etiquetaItem]    Nombre del elemento en plural ("proyectos", "actividades", etc.)
 */
export default function PaginacionTabla({
  datos,
  pagina = 0,
  alCambiarPagina,
  tamano = 10,
  alCambiarTamano,
  etiquetaItem = 'registros',
  opciones = [10, 25, 50, 100],
}) {
  const totalPaginas = Math.max(1, datos?.totalPaginas ?? 1);
  const totalElementos = datos?.totalElementos ?? 0;

  const inicio = totalElementos === 0 ? 0 : pagina * tamano + 1;
  const fin = Math.min((pagina + 1) * tamano, totalElementos);

  const opcionesTamano = opciones.includes(tamano)
    ? opciones
    : [...opciones, tamano].sort((a, b) => a - b);

  const ventanaPaginas = calcularVentanaPaginas(pagina, totalPaginas);

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
          {totalElementos === 0 ? (
            <>Mostrando <strong>0</strong> de <strong>0</strong> {etiquetaItem}</>
          ) : (
            <>
              Mostrando registros del <strong>{inicio}</strong> al <strong>{fin}</strong> de{' '}
              <strong>{totalElementos}</strong> {etiquetaItem}
            </>
          )}
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
          <ChevronsLeft size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(pagina - 1)}
          disabled={pagina <= 0}
          title="Página anterior"
          aria-label="Ir a la página anterior"
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </button>

        <div className={estilos.numerosPagina}>
          {ventanaPaginas.map((num) => {
            const activa = num === pagina;
            return (
              <button
                key={num}
                type="button"
                className={`${estilos.botonNumero} ${activa ? estilos.botonNumeroActivo : ''}`}
                onClick={() => alCambiarPagina(num)}
                aria-current={activa ? 'page' : undefined}
                aria-label={`Página ${num + 1}`}
              >
                {num + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(pagina + 1)}
          disabled={pagina + 1 >= totalPaginas}
          title="Página siguiente"
          aria-label="Ir a la página siguiente"
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={estilos.botonPaginacion}
          onClick={() => alCambiarPagina(totalPaginas - 1)}
          disabled={pagina + 1 >= totalPaginas}
          title="Última página"
          aria-label="Ir a la última página"
        >
          <ChevronsRight size={15} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

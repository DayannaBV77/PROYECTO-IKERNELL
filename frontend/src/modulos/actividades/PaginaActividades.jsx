import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Search } from 'lucide-react';

import { buscarActividades } from '../../api/actividades.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import {
  useContextoDeProyecto,
  useProyectosComoOpciones,
} from './componentes/useContextoDeProyecto.js';

const SIN_CRITERIOS = { identificador: '', proyectoId: '', etapaId: '', desarrolladorId: '' };

/**
 * Busqueda de actividades (RF-020, HU-13 C03 y C04).
 *
 * Los cuatro criterios son los que nombra C03: "el proyecto, el desarrollador,
 * la etapa o el identificador de la actividad". Los tres primeros se eligen de
 * una lista en vez de escribirse, porque el backend espera identificadores y
 * nadie los conoce de memoria.
 *
 * Etapa y desarrollador dependen del proyecto elegido: no tiene sentido buscar
 * por una etapa sin saber de que proyecto es. Cambiar de proyecto los limpia,
 * para no arrastrar un filtro que ya no corresponde.
 */
export default function PaginaActividades() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);

  const { opcionesDeProyecto } = useProyectosComoOpciones();
  const { opcionesDeEtapa, opcionesDeDesarrollador } = useContextoDeProyecto(borrador.proyectoId);

  const cargar = useCallback(
    ({ senal }) => buscarActividades({ ...criterios, pagina }, { senal }),
    [criterios, pagina],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios, pagina]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setBorrador((previos) =>
      name === 'proyectoId'
        ? { ...previos, proyectoId: value, etapaId: '', desarrolladorId: '' }
        : { ...previos, [name]: value },
    );
  }

  function alBuscar(evento) {
    evento.preventDefault();
    setCriterios(borrador);
    setPagina(0);
  }

  function alLimpiar() {
    setBorrador(SIN_CRITERIOS);
    setCriterios(SIN_CRITERIOS);
    setPagina(0);
  }

  const resultados = datos?.contenido || [];

  return (
    <Seccion
      titulo="Actividades"
      descripcion="Planificacion del trabajo de cada desarrollador dentro de un proyecto."
      id="actividades"
    >
      <div className={estilos.barraSuperior}>
        <Boton a="/app/actividades/nueva" icono={Plus}>
          Registrar actividad
        </Boton>
      </div>

      <form className={estilos.buscador} onSubmit={alBuscar}>
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Identificador"
            nombre="identificador"
            tipo="number"
            min="1"
            value={borrador.identificador}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Proyecto"
            nombre="proyectoId"
            opciones={opcionesDeProyecto}
            textoVacio="Cualquiera"
            value={borrador.proyectoId}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Etapa"
            nombre="etapaId"
            opciones={opcionesDeEtapa}
            textoVacio="Cualquiera"
            value={borrador.etapaId}
            onChange={alCambiar}
            disabled={!borrador.proyectoId}
            pista={borrador.proyectoId ? undefined : 'Elija primero un proyecto.'}
          />
          <Campo
            etiqueta="Desarrollador"
            nombre="desarrolladorId"
            opciones={opcionesDeDesarrollador}
            textoVacio="Cualquiera"
            value={borrador.desarrolladorId}
            onChange={alCambiar}
            disabled={!borrador.proyectoId}
            pista={borrador.proyectoId ? undefined : 'Elija primero un proyecto.'}
          />
        </div>

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={cargando}>
            Buscar
          </Boton>
          <Boton type="button" variante="texto" onClick={alLimpiar} disabled={cargando}>
            Limpiar criterios
          </Boton>
        </div>
      </form>

      {cargando && <EstadoCarga mensaje="Buscando actividades..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* C04: el aviso lo redacta el servidor, no se muestra una lista vacia. */}
      {!cargando && !error && resultados.length === 0 && (
        <EstadoVacio
          mensaje={
            datos?.mensaje || 'No hay actividades que coincidan con los criterios indicados.'
          }
          icono={ClipboardList}
        />
      )}

      {!cargando && !error && resultados.length > 0 && (
        <>
          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tabla}>
              <caption className="solo-lectores">Resultados de la busqueda de actividades</caption>
              <thead>
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">Actividad</th>
                  <th scope="col">Proyecto</th>
                  <th scope="col">Etapa</th>
                  <th scope="col">Desarrollador</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((actividad) => (
                  <tr key={actividad.id}>
                    <td>{actividad.id}</td>
                    <th scope="row" className={estilos.celdaDescripcion}>
                      {actividad.descripcion}
                    </th>
                    <td>{actividad.proyectoNombre}</td>
                    <td>{actividad.etapaNombre}</td>
                    <td>{actividad.desarrolladorNombreCompleto}</td>
                    {/* Los estados posibles los define la empresa (D-04). */}
                    <td>{actividad.estado || '—'}</td>
                    <td>
                      <Link className={estilos.abrir} to={`/app/actividades/${actividad.id}`}>
                        Abrir
                        <span className="solo-lectores"> la actividad {actividad.id}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion datos={datos} pagina={pagina} alCambiarPagina={setPagina} />
        </>
      )}
    </Seccion>
  );
}

/** Navegacion entre paginas: el backend pagina los resultados (RNF-005). */
function Paginacion({ datos, pagina, alCambiarPagina }) {
  const { totalPaginas = 0, totalElementos = 0 } = datos || {};

  if (totalPaginas <= 1) {
    return <p className={estilos.recuento}>{totalElementos} actividad(es).</p>;
  }

  return (
    <nav className={estilos.paginacion} aria-label="Paginas de resultados">
      <Boton
        variante="secundario"
        onClick={() => alCambiarPagina(pagina - 1)}
        disabled={pagina <= 0}
      >
        Anterior
      </Boton>
      <p className={estilos.recuento} aria-live="polite">
        Pagina {pagina + 1} de {totalPaginas} · {totalElementos} actividad(es)
      </p>
      <Boton
        variante="secundario"
        onClick={() => alCambiarPagina(pagina + 1)}
        disabled={pagina + 1 >= totalPaginas}
      >
        Siguiente
      </Boton>
    </nav>
  );
}

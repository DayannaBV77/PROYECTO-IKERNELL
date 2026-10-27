import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, FolderPlus, Search } from 'lucide-react';

import {
  ESTADOS_HABILITACION,
  buscarProyectos,
  etiquetaEstadoOperativo,
} from '../../api/proyectos.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import EtiquetaEstado from '../../componentes/ui/EtiquetaEstado.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

const SIN_CRITERIOS = { identificador: '', nombre: '', estado: '' };

/**
 * Busqueda de proyectos (RF-013, HU-09 C01 y C02).
 *
 * Los tres criterios son los que C01 nombra: "el identificador, el nombre o el
 * estado del proyecto". Como en la busqueda de trabajadores, se lanza al pulsar
 * el boton -"y pulso buscar"- y los criterios confirmados se guardan aparte del
 * borrador para no cambiar las claves de la peticion en cada tecla.
 */
export default function PaginaProyectos() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);

  const cargar = useCallback(
    ({ senal }) => buscarProyectos({ ...criterios, pagina }, { senal }),
    [criterios, pagina],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios, pagina]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setBorrador((previos) => ({ ...previos, [name]: value }));
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
      titulo="Proyectos"
      descripcion="Busque un proyecto por su identificador, su nombre o su estado."
      id="proyectos"
    >
      <div className={estilos.barraSuperior}>
        <Boton a="/app/proyectos/nuevo" icono={FolderPlus}>
          Registrar proyecto
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
          <Campo etiqueta="Nombre" nombre="nombre" value={borrador.nombre} onChange={alCambiar} />
          <Campo
            etiqueta="Estado"
            nombre="estado"
            opciones={ESTADOS_HABILITACION}
            textoVacio="Cualquiera"
            value={borrador.estado}
            onChange={alCambiar}
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

      {cargando && <EstadoCarga mensaje="Buscando proyectos..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {/* C02: el aviso lo redacta el servidor, no se muestra una lista vacia. */}
      {!cargando && !error && resultados.length === 0 && (
        <EstadoVacio
          mensaje={datos?.mensaje || 'No hay proyectos que coincidan con los criterios indicados.'}
          icono={FolderKanban}
        />
      )}

      {!cargando && !error && resultados.length > 0 && (
        <>
          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tabla}>
              <caption className="solo-lectores">Resultados de la busqueda de proyectos</caption>
              <thead>
                <tr>
                  <th scope="col">Identificador</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Estado operativo</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((proyecto) => (
                  <tr key={proyecto.id}>
                    <td>{proyecto.id}</td>
                    <th scope="row" className={estilos.celdaNombre}>
                      {proyecto.nombre}
                    </th>
                    <td>
                      <EtiquetaEstado estado={proyecto.estadoHabilitacion} />
                    </td>
                    <td>{etiquetaEstadoOperativo(proyecto.estadoOperativo)}</td>
                    <td>
                      <Link className={estilos.abrir} to={`/app/proyectos/${proyecto.id}`}>
                        Abrir detalle
                        <span className="solo-lectores"> del proyecto {proyecto.nombre}</span>
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
    return <p className={estilos.recuento}>{totalElementos} proyecto(s).</p>;
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
        Pagina {pagina + 1} de {totalPaginas} · {totalElementos} proyecto(s)
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

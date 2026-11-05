import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FolderKanban, FolderPlus, RotateCcw, Search } from 'lucide-react';

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
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';

const SIN_CRITERIOS = { identificador: '', nombre: '', estado: '' };

export default function PaginaProyectos() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(10);

  const cargar = useCallback(
    ({ senal }) => buscarProyectos({ ...criterios, pagina, tamano }, { senal }),
    [criterios, pagina, tamano],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios, pagina, tamano]);

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

  function alCambiarTamano(nuevoTamano) {
    setTamano(nuevoTamano);
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
            placeholder="Ej: 101"
            value={borrador.identificador}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Nombre del proyecto"
            nombre="nombre"
            placeholder="Buscar por nombre..."
            value={borrador.nombre}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Estado"
            nombre="estado"
            opciones={ESTADOS_HABILITACION}
            textoVacio="Todos los estados"
            value={borrador.estado}
            onChange={alCambiar}
          />
        </div>

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={cargando}>
            Buscar
          </Boton>
          <Boton type="button" variante="secundario" icono={RotateCcw} onClick={alLimpiar} disabled={cargando}>
            Limpiar filtros
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
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
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
                        <span>Abrir detalle</span>
                        <ArrowRight size={14} aria-hidden="true" />
                        <span className="solo-lectores"> del proyecto {proyecto.nombre}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginacionTabla
            datos={datos}
            pagina={pagina}
            alCambiarPagina={setPagina}
            tamano={tamano}
            alCambiarTamano={alCambiarTamano}
            etiquetaItem="proyectos"
          />
        </>
      )}
    </Seccion>
  );
}

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, RotateCcw } from 'lucide-react';

import { ETIQUETA_PRIORIDAD, buscarActividades } from '../../api/actividades.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { useDebounce } from '../../hooks/useDebounce.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha, formatearTipoTitulo } from '../../utilidades/formato.js';
import ModalRegistroActividad from './ModalRegistroActividad.jsx';
import {
  useContextoDeProyecto,
  useProyectosComoOpciones,
} from './componentes/useContextoDeProyecto.js';

const SIN_CRITERIOS = { identificador: '', proyectoId: '', etapaId: '', desarrolladorId: '' };

export default function PaginaActividades() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(10);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);

  const { opcionesDeProyecto } = useProyectosComoOpciones();
  const { opcionesDeEtapa, opcionesDeDesarrollador } = useContextoDeProyecto(borrador.proyectoId);

  // Filtrado en tiempo real con debounce
  const criteriosEnTiempoReal = useDebounce(borrador, 250);

  const cargar = useCallback(
    ({ senal }) => buscarActividades({ ...criteriosEnTiempoReal, pagina, tamano }, { senal }),
    [criteriosEnTiempoReal, pagina, tamano],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criteriosEnTiempoReal, pagina, tamano]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setPagina(0);
    setBorrador((previos) =>
      name === 'proyectoId'
        ? { ...previos, proyectoId: value, etapaId: '', desarrolladorId: '' }
        : { ...previos, [name]: value },
    );
  }

  function alLimpiar() {
    setPagina(0);
    setBorrador(SIN_CRITERIOS);
  }

  function alCambiarTamano(nuevoTamano) {
    setTamano(nuevoTamano);
    setPagina(0);
  }

  function alRegistrarActividad() {
    reintentar();
  }

  const resultados = datos?.contenido || [];

  return (
    <Seccion
      titulo="Actividades"
      descripcion="Planificacion del trabajo de cada desarrollador dentro de un proyecto."
      id="actividades"
    >
      <div className={estilos.barraSuperior}>
        <Boton type="button" onClick={() => setModalRegistroAbierto(true)} icono={Plus}>
          Registrar actividad
        </Boton>
      </div>

      <ModalRegistroActividad
        abierto={modalRegistroAbierto}
        alCerrar={() => setModalRegistroAbierto(false)}
        alRegistrar={alRegistrarActividad}
      />

      <form className={estilos.buscador} onSubmit={(e) => e.preventDefault()}>
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Identificador"
            nombre="identificador"
            tipo="number"
            min="1"
            placeholder="Ej: 1"
            value={borrador.identificador}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Proyecto"
            nombre="proyectoId"
            opciones={opcionesDeProyecto}
            textoVacio="Todos los proyectos"
            value={borrador.proyectoId}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Etapa"
            nombre="etapaId"
            opciones={opcionesDeEtapa}
            textoVacio="Todas las etapas"
            value={borrador.etapaId}
            onChange={alCambiar}
            disabled={!borrador.proyectoId}
          />
          <Campo
            etiqueta="Desarrollador asignado"
            nombre="desarrolladorId"
            opciones={opcionesDeDesarrollador}
            textoVacio="Todos los desarrolladores"
            value={borrador.desarrolladorId}
            onChange={alCambiar}
            disabled={!borrador.proyectoId}
          />
        </div>

        <div className={estilos.accionesBuscador}>
          <Boton type="button" variante="secundario" icono={RotateCcw} onClick={alLimpiar} disabled={cargando}>
            Limpiar filtros
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
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">Actividad</th>
                  <th scope="col">Proyecto</th>
                  <th scope="col">Etapa</th>
                  <th scope="col">Desarrollador</th>
                  <th scope="col" className={estilos.celdaCentrada}>Prioridad</th>
                  <th scope="col">Dia</th>
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
                    {/* Prioridad y dia los anade RF-038; pueden faltar en las
                        actividades registradas antes de que existieran. */}
                    <td className={estilos.celdaCentrada}>{ETIQUETA_PRIORIDAD[actividad.prioridad] || '—'}</td>
                    <td>{formatearFecha(actividad.fechaPlanificada) || '—'}</td>
                    {/* Los estados posibles formateados tipo título (ej: "Pendiente", "Finalizada") */}
                    <td>{formatearTipoTitulo(actividad.estado)}</td>
                    <td>
                      <Link className={estilos.abrir} to={`/app/actividades/${actividad.id}`}>
                        <span>Ver detalle</span>
                        <span className="solo-lectores"> la actividad {actividad.id}</span>
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
            etiquetaItem="actividades"
          />
        </>
      )}
    </Seccion>
  );
}

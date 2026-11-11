import { useCallback, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Info,
  Plus,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react';

import {
  buscarProyectosParaAsignaciones,
  obtenerEquipoCompleto,
  obtenerProyectoParaAsignaciones,
} from '../../api/asignaciones.js';
import { buscarActividades } from '../../api/actividades.js';
import {
  ESTADOS_HABILITACION,
  etiquetaEstadoOperativo,
  obtenerEtapas,
} from '../../api/proyectos.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import EtiquetaEstado from '../../componentes/ui/EtiquetaEstado.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import ModalAsignarTrabajadores from './ModalAsignarTrabajadores.jsx';
import estilos from './PaginaAsignaciones.module.css';

const FILTROS_VACIOS = { q: '', estado: '', orden: 'recientes' };
const TAMANO_PAGINA = 6;

const PESTANAS = [
  { id: 'general', etiqueta: 'General' },
  { id: 'equipo', etiqueta: 'Equipo de trabajo' },
  { id: 'etapas', etiqueta: 'Etapas' },
  { id: 'actividades', etiqueta: 'Actividades' },
];

export default function PaginaAsignaciones() {
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(0);
  const [proyectoIdSeleccionado, setProyectoIdSeleccionado] = useState('');
  const [pestana, setPestana] = useState('general');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recarga, setRecarga] = useState(0);

  const cargarProyectos = useCallback(
    ({ senal }) =>
      buscarProyectosParaAsignaciones(
        { ...filtros, pagina, tamano: TAMANO_PAGINA },
        { senal },
      ),
    [filtros, pagina],
  );
  const proyectos = usePeticion(cargarProyectos, [filtros, pagina, recarga]);
  const resultados = proyectos.datos?.contenido || [];
  const proyectoSeleccionado =
    resultados.find((proyecto) => String(proyecto.id) === proyectoIdSeleccionado) ||
    resultados[0] ||
    null;
  const idActivo = proyectoSeleccionado ? String(proyectoSeleccionado.id) : '';

  const cargarDetalle = useCallback(
    ({ senal }) =>
      idActivo ? obtenerProyectoParaAsignaciones(idActivo, { senal }) : Promise.resolve(null),
    [idActivo],
  );
  const detalle = usePeticion(cargarDetalle, [idActivo, recarga]);

  function alCambiarFiltro(evento) {
    const { name, value } = evento.target;
    setBorrador((actual) => ({ ...actual, [name]: value }));
  }

  function buscar(evento) {
    evento.preventDefault();
    setFiltros({ ...borrador });
    setPagina(0);
    setProyectoIdSeleccionado('');
  }

  function limpiarFiltros() {
    setBorrador(FILTROS_VACIOS);
    setFiltros(FILTROS_VACIOS);
    setPagina(0);
    setProyectoIdSeleccionado('');
  }

  function seleccionarProyecto(proyecto) {
    setProyectoIdSeleccionado(String(proyecto.id));
    setPestana('general');
  }

  function asignacionGuardada() {
    setModalAbierto(false);
    setRecarga((actual) => actual + 1);
  }

  return (
    <Seccion
      titulo="Gestión de proyectos"
      descripcion="Consulta la información de los proyectos y gestiona sus equipos de trabajo."
      id="asignaciones"
    >
      <div className={estilos.pagina}>
        <form className={estilos.busquedaProyectos} onSubmit={buscar}>
          <div className={estilos.tituloBuscador}>
            <span className={estilos.iconoBuscador}><Search size={22} aria-hidden="true" /></span>
            <div>
              <h2>Buscar proyectos</h2>
              <p>Encuentra un proyecto por nombre, identificador o estado.</p>
            </div>
          </div>
          <div className={estilos.filtrosProyecto}>
            <label className={estilos.busquedaTexto} htmlFor="buscar-proyectos-asignaciones">
              <Search size={17} aria-hidden="true" />
              <input
                id="buscar-proyectos-asignaciones"
                name="q"
                type="search"
                value={borrador.q}
                onChange={alCambiarFiltro}
                placeholder="Buscar por nombre o identificador..."
              />
            </label>
            <Campo
              etiqueta="Estado"
              nombre="estado"
              opciones={ESTADOS_HABILITACION}
              textoVacio="Todos los estados"
              value={borrador.estado}
              onChange={alCambiarFiltro}
            />
            <Campo
              etiqueta="Ordenar por"
              nombre="orden"
              opciones={[
                { valor: 'recientes', texto: 'Más recientes' },
                { valor: 'nombre', texto: 'Nombre' },
              ]}
              textoVacio={null}
              value={borrador.orden}
              onChange={alCambiarFiltro}
            />
            <Boton type="submit" icono={Search} disabled={proyectos.cargando}>
              Buscar
            </Boton>
            <Boton type="button" variante="secundario" icono={RotateCcw} onClick={limpiarFiltros}>
              Limpiar filtros
            </Boton>
          </div>
        </form>

        <section className={estilos.panelResultados} aria-labelledby="proyectos-encontrados">
          <div className={estilos.cabeceraResultados}>
            <h2 id="proyectos-encontrados">
              <FolderKanban size={19} aria-hidden="true" />
              Proyectos encontrados
            </h2>
            {proyectos.datos && (
              <span>
                Mostrando {resultados.length} de {proyectos.datos.totalElementos} proyectos
              </span>
            )}
          </div>

          {proyectos.cargando && <EstadoCarga mensaje="Buscando proyectos..." />}
          {!proyectos.cargando && proyectos.error && (
            <EstadoError error={proyectos.error} alReintentar={proyectos.reintentar} />
          )}
          {!proyectos.cargando && !proyectos.error && resultados.length === 0 && (
            <EstadoVacio
              mensaje={proyectos.datos?.mensaje || 'No hay proyectos que coincidan con los filtros.'}
              icono={FolderKanban}
            />
          )}

          {!proyectos.cargando && !proyectos.error && resultados.length > 0 && (
            <>
              <div className={estilos.tarjetas}>
                {resultados.map((proyecto) => (
                  <TarjetaProyecto
                    key={proyecto.id}
                    proyecto={proyecto}
                    seleccionada={String(proyecto.id) === idActivo}
                    onSelect={() => seleccionarProyecto(proyecto)}
                  />
                ))}
              </div>
              {proyectos.datos.totalPaginas > 1 && (
                <nav className={estilos.paginacion} aria-label="Paginación de proyectos">
                  <button
                    type="button"
                    disabled={pagina === 0 || proyectos.cargando}
                    onClick={() => setPagina((actual) => actual - 1)}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Anterior
                  </button>
                  <span>Página {pagina + 1} de {proyectos.datos.totalPaginas}</span>
                  <button
                    type="button"
                    disabled={pagina + 1 >= proyectos.datos.totalPaginas || proyectos.cargando}
                    onClick={() => setPagina((actual) => actual + 1)}
                  >
                    Siguiente
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

        {proyectoSeleccionado && (
          <section className={estilos.panelDetalle} aria-labelledby="detalle-proyecto-asignaciones">
            <header className={estilos.cabeceraDetalle}>
              <div className={estilos.tituloDetalle}>
                <span className={estilos.iconoDetalle}><Info size={20} aria-hidden="true" /></span>
                <div>
                  <h2 id="detalle-proyecto-asignaciones">Detalle del proyecto</h2>
                  <p>Información general y gestión del equipo.</p>
                </div>
              </div>
              <Boton
                type="button"
                icono={Plus}
                disabled={proyectoSeleccionado.estadoHabilitacion === 'INHABILITADO'}
                onClick={() => setModalAbierto(true)}
              >
                Asignar trabajadores
              </Boton>
            </header>

            <div className={estilos.pestanas} role="tablist" aria-label="Secciones del proyecto">
              {PESTANAS.map(({ id, etiqueta }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`pestana-${id}`}
                  aria-selected={pestana === id}
                  aria-controls={`panel-${id}`}
                  className={pestana === id ? estilos.pestanaActiva : ''}
                  onClick={() => setPestana(id)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>

            <div
              id={`panel-${pestana}`}
              className={estilos.contenidoPestana}
              role="tabpanel"
              aria-labelledby={`pestana-${pestana}`}
              tabIndex={0}
            >
              {detalle.cargando && <EstadoCarga mensaje="Cargando detalle del proyecto..." />}
              {!detalle.cargando && detalle.error && (
                <EstadoError error={detalle.error} alReintentar={detalle.reintentar} />
              )}
              {!detalle.cargando && !detalle.error && detalle.datos && (
                <ContenidoPestana
                  pestana={pestana}
                  proyecto={detalle.datos}
                />
              )}
            </div>
          </section>
        )}
      </div>

      {modalAbierto && proyectoSeleccionado && (
        <ModalAsignarTrabajadores
          abierto={modalAbierto}
          proyecto={proyectoSeleccionado}
          alCerrar={() => setModalAbierto(false)}
          alGuardar={asignacionGuardada}
        />
      )}
    </Seccion>
  );
}

function TarjetaProyecto({ proyecto, seleccionada, onSelect }) {
  const fechaCreacion = proyecto.fechaCreacion
    ? formatearFecha(proyecto.fechaCreacion.slice(0, 10))
    : 'Sin dato histórico';

  return (
    <article className={`${estilos.tarjetaProyecto} ${seleccionada ? estilos.tarjetaSeleccionada : ''}`}>
      <div className={estilos.resumenTarjeta}>
        <span className={estilos.marcaProyecto} aria-hidden="true">K</span>
        <div className={estilos.nombreProyecto}>
          <h3>{proyecto.nombre}</h3>
          <span>{proyecto.codigo}</span>
        </div>
        <EtiquetaEstado estado={proyecto.estadoHabilitacion} />
      </div>
      <div className={estilos.datosTarjeta}>
        <span><Users size={15} aria-hidden="true" /> {proyecto.numeroIntegrantes} integrantes</span>
        <span><CalendarDays size={15} aria-hidden="true" /> Creado: {fechaCreacion}</span>
      </div>
      <button className={estilos.verDetalle} type="button" onClick={onSelect}>
        Ver detalles <ArrowRight size={15} aria-hidden="true" />
      </button>
    </article>
  );
}

function ContenidoPestana({ pestana, proyecto }) {
  if (pestana === 'equipo') {
    return <EquipoProyectoTab proyecto={proyecto} />;
  }
  if (pestana === 'etapas') {
    return <EtapasTab proyecto={proyecto} />;
  }
  if (pestana === 'actividades') {
    return <ActividadesTab proyecto={proyecto} />;
  }
  return <GeneralTab proyecto={proyecto} />;
}

function GeneralTab({ proyecto }) {
  return (
    <div className={estilos.general}>
      <div className={estilos.resumenGeneral}>
        <span className={estilos.marcaGrande} aria-hidden="true">K</span>
        <div className={estilos.detalleGeneral}>
          <div className={estilos.nombreConEstado}>
            <div>
              <h3>{proyecto.nombre}</h3>
              <span className={estilos.codigo}>{proyecto.codigo}</span>
            </div>
            <EtiquetaEstado estado={proyecto.estadoHabilitacion} />
          </div>
          <p>{proyecto.descripcion || 'Este proyecto no tiene descripción registrada.'}</p>
          <div className={estilos.metadatosGeneral}>
            <span><CalendarDays size={16} aria-hidden="true" /> Creado: {proyecto.fechaCreacion ? formatearFecha(proyecto.fechaCreacion.slice(0, 10)) : 'Sin dato histórico'}</span>
            <span><Users size={16} aria-hidden="true" /> Líder: {proyecto.liderResponsableNombre || 'Sin líder registrado'}</span>
            <span>{etiquetaEstadoOperativo(proyecto.estadoOperativo)}</span>
          </div>
        </div>
      </div>
      <EquipoVistaPrevia proyectoId={proyecto.id} />
    </div>
  );
}

function EquipoProyectoTab({ proyecto }) {
  return (
    <div className={estilos.contenidoListado}>
      <div className={estilos.encabezadoListado}>
        <div>
          <h3>Equipo de trabajo actual</h3>
          <p>{proyecto.numeroIntegrantes} integrantes en el proyecto.</p>
        </div>
        {proyecto.estadoHabilitacion === 'INHABILITADO' && (
          <p className={estilos.avisoInhabilitado}>No se pueden registrar nuevas asignaciones en un proyecto inhabilitado.</p>
        )}
      </div>
      <EquipoLista proyectoId={proyecto.id} />
    </div>
  );
}

function EquipoVistaPrevia({ proyectoId }) {
  const equipo = useEquipo(proyectoId);
  if (equipo.cargando) {
    return <div className={estilos.panelEquipo}><EstadoCarga mensaje="Cargando equipo..." /></div>;
  }
  if (equipo.error) {
    return <div className={estilos.panelEquipo}><EstadoError error={equipo.error} alReintentar={equipo.reintentar} /></div>;
  }
  const integrantes = equipo.datos || [];
  return (
    <aside className={estilos.panelEquipo} aria-label="Equipo de trabajo actual">
      <div className={estilos.encabezadoEquipo}>
        <h3><Users size={17} aria-hidden="true" /> Equipo de trabajo actual</h3>
        <span>{integrantes.length} asignaciones</span>
      </div>
      {integrantes.length === 0 ? (
        <p className={estilos.sinEquipo}>Aún no hay trabajadores asignados.</p>
      ) : (
        <ul className={estilos.listaEquipoCompacta}>
          {integrantes.slice(0, 3).map((asignacion) => (
            <li key={asignacion.id}>
              <span className={estilos.avatarInicial}>{asignacion.trabajadorNombreCompleto?.[0] || '?'}</span>
              <strong>{asignacion.trabajadorNombreCompleto}</strong>
              <span className={estilos.badgeRol}>{nombreRol(asignacion.rolEnProyecto)}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function EquipoLista({ proyectoId }) {
  const equipo = useEquipo(proyectoId);
  if (equipo.cargando) return <EstadoCarga mensaje="Cargando el equipo..." />;
  if (equipo.error) return <EstadoError error={equipo.error} alReintentar={equipo.reintentar} />;
  if (!equipo.datos?.length) {
    return <EstadoVacio mensaje="Todavía no hay asignaciones activas para este proyecto." icono={Users} />;
  }

  return (
    <ul className={estilos.listaEquipo}>
      {equipo.datos.map((asignacion) => (
        <li key={asignacion.id}>
          <span className={estilos.avatarInicial}>{asignacion.trabajadorNombreCompleto?.[0] || '?'}</span>
          <div className={estilos.datosIntegrante}>
            <strong>{asignacion.trabajadorNombreCompleto}</strong>
            <span>{asignacion.trabajadorIdentificacion}</span>
          </div>
          <span className={estilos.badgeRol}>{nombreRol(asignacion.rolEnProyecto)}</span>
          {asignacion.dedicacionPorcentaje && (
            <span className={estilos.dedicacion}>{asignacion.dedicacionPorcentaje}%</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function EtapasTab({ proyecto }) {
  const cargar = useCallback(({ senal }) => obtenerEtapas(proyecto.id, { senal }), [proyecto.id]);
  const etapas = usePeticion(cargar, [proyecto.id]);
  if (etapas.cargando) return <EstadoCarga mensaje="Cargando etapas..." />;
  if (etapas.error) return <EstadoError error={etapas.error} alReintentar={etapas.reintentar} />;
  if (!etapas.datos?.length) return <EstadoVacio mensaje="Este proyecto aún no tiene etapas registradas." />;
  return (
    <ol className={estilos.listaEtapas}>
      {etapas.datos.map((etapa) => (
        <li key={etapa.id}>
          <span className={estilos.numeroEtapa}>{etapa.orden || '•'}</span>
          <div><h3>{etapa.nombre}</h3><p>{etapa.descripcion || 'Sin descripción.'}</p></div>
        </li>
      ))}
    </ol>
  );
}

function ActividadesTab({ proyecto }) {
  const cargar = useCallback(
    ({ senal }) => buscarActividades({ proyectoId: proyecto.id, pagina: 0, tamano: 100 }, { senal }),
    [proyecto.id],
  );
  const actividades = usePeticion(cargar, [proyecto.id]);
  if (actividades.cargando) return <EstadoCarga mensaje="Cargando actividades..." />;
  if (actividades.error) return <EstadoError error={actividades.error} alReintentar={actividades.reintentar} />;
  const lista = actividades.datos?.contenido || [];
  if (!lista.length) return <EstadoVacio mensaje={actividades.datos?.mensaje || 'Este proyecto aún no tiene actividades.'} />;
  return (
    <div className={estilos.listaActividades}>
      {lista.map((actividad) => (
        <article key={actividad.id}>
          <div>
            <h3>{actividad.descripcion}</h3>
            <p>{actividad.etapaNombre} · {actividad.desarrolladorNombreCompleto}</p>
          </div>
          <span>{actividad.estado || 'Sin estado'}</span>
        </article>
      ))}
    </div>
  );
}

function useEquipo(proyectoId) {
  const cargar = useCallback(
    ({ senal }) => obtenerEquipoCompleto(proyectoId, { senal }),
    [proyectoId],
  );
  return usePeticion(cargar, [proyectoId]);
}

function nombreRol(rol) {
  return {
    LIDER: 'Líder de proyecto',
    DESARROLLADOR: 'Desarrollador',
  }[rol] || rol;
}

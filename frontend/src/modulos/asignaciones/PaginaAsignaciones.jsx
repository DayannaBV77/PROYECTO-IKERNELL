import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  FolderKanban,
  Info,
  Play,
  Plus,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react';

import {
  buscarProyectosParaAsignaciones,
  obtenerEquipoCompleto,
  obtenerProyectoParaAsignaciones,
  pausarLider,
  quitarDesarrollador,
  reactivarLider,
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
import Confirmacion from '../../componentes/ui/Confirmacion.jsx';
import EtiquetaEstado from '../../componentes/ui/EtiquetaEstado.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import { usePaginacionLocal } from '../../hooks/usePaginacionLocal.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import ModalAsignarTrabajadores from './ModalAsignarTrabajadores.jsx';
import ModalCambiarLider from './ModalCambiarLider.jsx';
import estilos from './PaginaAsignaciones.module.css';

const FILTROS_VACIOS = { q: '', estado: '', equipoFiltro: 'todos', orden: 'recientes' };
const CLAVE_FILTROS_ASIGNACIONES = 'ikernell-asignaciones-filtros';

function leerFiltrosGuardados() {
  try {
    const raw = sessionStorage.getItem(CLAVE_FILTROS_ASIGNACIONES);
    if (!raw) return FILTROS_VACIOS;
    return { ...FILTROS_VACIOS, ...JSON.parse(raw) };
  } catch {
    return FILTROS_VACIOS;
  }
}

function guardarFiltros(filtros) {
  try {
    sessionStorage.setItem(CLAVE_FILTROS_ASIGNACIONES, JSON.stringify(filtros));
  } catch {
    // sessionStorage puede estar deshabilitado.
  }
}

const PESTANAS = [
  { id: 'general', etiqueta: 'General' },
  { id: 'equipo', etiqueta: 'Equipo de trabajo' },
  { id: 'etapas', etiqueta: 'Etapas' },
  { id: 'actividades', etiqueta: 'Actividades' },
];

export default function PaginaAsignaciones() {
  const { id: idParametro } = useParams();
  if (idParametro) {
    return <DetalleProyectoAsignaciones idProyecto={idParametro} />;
  }
  return <ListaProyectosAsignaciones />;
}

function ListaProyectosAsignaciones() {
  const navigate = useNavigate();
  const [borrador, setBorrador] = useState(() => leerFiltrosGuardados());
  const [filtros, setFiltros] = useState(() => leerFiltrosGuardados());
  const panelResultadosRef = useRef(null);
  const temporizador = useRef(null);

  const cargarProyectos = useCallback(
    ({ senal }) =>
      buscarProyectosParaAsignaciones(
        {
          q: filtros.q,
          estado: filtros.estado,
          orden: filtros.orden === 'nombre' ? 'nombre' : 'recientes',
          pagina: 0,
          tamano: 200,
        },
        { senal },
      ),
    [filtros.q, filtros.estado, filtros.orden],
  );
  const proyectos = usePeticion(cargarProyectos, [filtros.q, filtros.estado, filtros.orden]);

  const resultadosFiltrados = useMemo(() => {
    const base = proyectos.datos?.contenido || [];
    const filtrados = base.filter((p) => {
      if (filtros.equipoFiltro === 'con_equipo') {
        return (p.numeroIntegrantes ?? 0) > 0;
      }
      if (filtros.equipoFiltro === 'sin_equipo') {
        return (p.numeroIntegrantes ?? 0) === 0;
      }
      return true;
    });

    const ordenados = [...filtrados];
    if (filtros.orden === 'antiguos') {
      ordenados.sort((a, b) => (a.fechaCreacion || '').localeCompare(b.fechaCreacion || '') || a.id - b.id);
    } else if (filtros.orden === 'integrantes') {
      ordenados.sort((a, b) => (b.numeroIntegrantes ?? 0) - (a.numeroIntegrantes ?? 0) || a.id - b.id);
    } else if (filtros.orden === 'nombre') {
      ordenados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    }
    return ordenados;
  }, [proyectos.datos, filtros.equipoFiltro, filtros.orden]);

  const {
    itemsPaginados: resultadosPaginados,
    datosPaginacion,
    pagina,
    setPagina,
    tamano,
    alCambiarTamano,
  } = usePaginacionLocal(resultadosFiltrados, {
    clavePersistencia: 'asignaciones',
    tamanoInicial: 6,
  });

  const hayFiltrosActivos =
    Boolean(borrador.q.trim()) ||
    Boolean(borrador.estado) ||
    borrador.equipoFiltro !== 'todos' ||
    borrador.orden !== 'recientes';

  function aplicarFiltrosConRetardo(nuevosFiltros) {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setFiltros(nuevosFiltros);
      guardarFiltros(nuevosFiltros);
      setPagina(0);
    }, 250);
  }

  function alCambiarFiltro(evento) {
    const { name, value } = evento.target;
    const nuevos = { ...borrador, [name]: value };
    setBorrador(nuevos);

    if (name === 'q') {
      aplicarFiltrosConRetardo(nuevos);
    } else {
      clearTimeout(temporizador.current);
      setFiltros(nuevos);
      guardarFiltros(nuevos);
      setPagina(0);
    }
  }

  function limpiarFiltros() {
    clearTimeout(temporizador.current);
    setBorrador(FILTROS_VACIOS);
    setFiltros(FILTROS_VACIOS);
    guardarFiltros(FILTROS_VACIOS);
    setPagina(0);
  }

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function cambiarPaginaConScroll(nuevaPagina) {
    setPagina(nuevaPagina);
    panelResultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cambiarTamanoConScroll(nuevoTamano) {
    alCambiarTamano(nuevoTamano);
    panelResultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Seccion
      titulo="Gestión de proyectos"
      descripcion="Consulta la información de los proyectos y gestiona sus equipos de trabajo."
      id="asignaciones"
    >
      <div className={estilos.pagina}>
        <form className={estilos.busquedaProyectos} onSubmit={(evento) => evento.preventDefault()}>
          <div className={estilos.filtrosProyecto}>
            <div className={estilos.busquedaGrupo}>
              <label className={estilos.busquedaEtiqueta} htmlFor="buscar-proyectos-asignaciones">
                Búsqueda rápida
              </label>
              <label className={estilos.busquedaTexto} htmlFor="buscar-proyectos-asignaciones">
                <Search size={16} aria-hidden="true" />
                <input
                  id="buscar-proyectos-asignaciones"
                  name="q"
                  type="search"
                  value={borrador.q}
                  onChange={alCambiarFiltro}
                  placeholder="Buscar por nombre, código o descripción..."
                />
              </label>
            </div>
            <div className={estilos.filtroSelectEstado}>
              <Campo
                etiqueta="Estado"
                nombre="estado"
                compacto
                opciones={ESTADOS_HABILITACION}
                textoVacio="Todos los estados"
                value={borrador.estado}
                onChange={alCambiarFiltro}
              />
            </div>
            <div className={estilos.filtroSelectEquipo}>
              <Campo
                etiqueta="Equipo"
                nombre="equipoFiltro"
                compacto
                opciones={[
                  { valor: 'todos', texto: 'Todos los proyectos' },
                  { valor: 'con_equipo', texto: 'Con equipo asignado' },
                  { valor: 'sin_equipo', texto: 'Sin desarrolladores asignados' },
                ]}
                textoVacio={null}
                value={borrador.equipoFiltro}
                onChange={alCambiarFiltro}
              />
            </div>
            <div className={estilos.filtroSelectOrden}>
              <Campo
                etiqueta="Ordenar por"
                nombre="orden"
                compacto
                opciones={[
                  { valor: 'recientes', texto: 'Más recientes' },
                  { valor: 'antiguos', texto: 'Más antiguos' },
                  { valor: 'nombre', texto: 'Nombre A-Z' },
                  { valor: 'integrantes', texto: 'Mayor número de integrantes' },
                ]}
                textoVacio={null}
                value={borrador.orden}
                onChange={alCambiarFiltro}
              />
            </div>
            <Boton
              type="button"
              variante="secundario"
              icono={RotateCcw}
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos}
              data-testid="asignaciones-clear-filters"
            >
              Limpiar filtros
            </Boton>
          </div>
        </form>

        <section
          ref={panelResultadosRef}
          className={estilos.panelResultados}
          aria-labelledby="proyectos-encontrados"
        >
          <div className={estilos.cabeceraResultados}>
            <h2 id="proyectos-encontrados">
              <FolderKanban size={19} aria-hidden="true" />
              Proyectos encontrados
            </h2>
            {proyectos.datos && (
              <span data-testid="asignaciones-match-count">
                Mostrando {resultadosPaginados.length} de {resultadosFiltrados.length} proyectos encontrados
              </span>
            )}
          </div>

          {proyectos.cargando && <EstadoCarga mensaje="Buscando proyectos..." esqueleto={6} />}
          {!proyectos.cargando && proyectos.error && (
            <EstadoError error={proyectos.error} alReintentar={proyectos.reintentar} />
          )}
          {!proyectos.cargando && !proyectos.error && resultadosFiltrados.length === 0 && (
            <EstadoVacio
              mensaje={proyectos.datos?.mensaje || 'No hay proyectos que coincidan con los filtros.'}
              icono={FolderKanban}
            />
          )}

          {!proyectos.cargando && !proyectos.error && resultadosFiltrados.length > 0 && (
            <>
              <div className={estilos.tarjetas}>
                {resultadosPaginados.map((proyecto) => (
                  <TarjetaProyecto
                    key={proyecto.id}
                    proyecto={proyecto}
                    onSelect={() => navigate(`/app/asignaciones/${proyecto.id}`)}
                  />
                ))}
              </div>

              <PaginacionTabla
                datos={datosPaginacion}
                pagina={pagina}
                alCambiarPagina={cambiarPaginaConScroll}
                tamano={tamano}
                alCambiarTamano={cambiarTamanoConScroll}
                opciones={[6, 12, 24, 48]}
                etiquetaItem="proyectos"
              />
            </>
          )}
        </section>
      </div>
    </Seccion>
  );
}

function DetalleProyectoAsignaciones({ idProyecto }) {
  const [pestana, setPestana] = useState('general');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recarga, setRecarga] = useState(0);

  const cargarDetalle = useCallback(
    ({ senal }) => obtenerProyectoParaAsignaciones(idProyecto, { senal }),
    [idProyecto],
  );
  const detalle = usePeticion(cargarDetalle, [idProyecto, recarga]);

  function asignacionGuardada() {
    setModalAbierto(false);
    setRecarga((actual) => actual + 1);
  }

  return (
    <Seccion
      titulo={detalle.datos?.nombre || 'Detalle del proyecto'}
      descripcion={
        detalle.datos?.codigo
          ? `${detalle.datos.codigo} · Información general y gestión del equipo.`
          : 'Información general y gestión del equipo.'
      }
      id="detalle-asignacion"
      rutaFallback="/app/asignaciones"
    >
      <div className={estilos.pagina}>
        <section className={estilos.panelDetalle} aria-labelledby="detalle-proyecto-asignaciones">
          <header className={estilos.cabeceraDetalle}>
            <div className={estilos.tituloDetalle}>
              <span className={estilos.iconoDetalle}><Info size={20} aria-hidden="true" /></span>
              <div>
                <h2 id="detalle-proyecto-asignaciones">Detalle del proyecto</h2>
                <p>Información general, equipo asignado, etapas y actividades.</p>
              </div>
            </div>
            {detalle.datos && (
              <Boton
                type="button"
                icono={Plus}
                disabled={detalle.datos.estadoHabilitacion === 'INHABILITADO'}
                onClick={() => setModalAbierto(true)}
              >
                Asignar desarrolladores
              </Boton>
            )}
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
                alActualizar={() => setRecarga((n) => n + 1)}
                alAbrirAsignar={() => setModalAbierto(true)}
              />
            )}
          </div>
        </section>
      </div>

      {modalAbierto && detalle.datos && (
        <ModalAsignarTrabajadores
          abierto={modalAbierto}
          proyecto={detalle.datos}
          alCerrar={() => setModalAbierto(false)}
          alGuardar={asignacionGuardada}
        />
      )}
    </Seccion>
  );
}

function TarjetaProyecto({ proyecto, onSelect }) {
  const fechaCreacion = proyecto.fechaCreacion
    ? formatearFecha(proyecto.fechaCreacion.slice(0, 10))
    : 'Sin dato histórico';

  return (
    <article
      className={estilos.tarjetaProyecto}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="link"
      data-testid={`project-card-${proyecto.id}`}
    >
      <div className={estilos.resumenTarjeta}>
        <div className={estilos.nombreProyecto}>
          <span className={estilos.codigoBadge}>{proyecto.codigo}</span>
          <h3>{proyecto.nombre}</h3>
        </div>
        <EtiquetaEstado estado={proyecto.estadoHabilitacion} />
      </div>
      <div className={estilos.datosTarjeta}>
        <span><Users size={15} aria-hidden="true" /> {proyecto.numeroIntegrantes} integrantes</span>
        <span><CalendarDays size={15} aria-hidden="true" /> Creado: {fechaCreacion}</span>
      </div>
      <button
        className={estilos.verDetalle}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        data-testid={`project-detail-btn-${proyecto.id}`}
      >
        <span>Ver detalles</span>
        <ArrowUpRight size={14} aria-hidden="true" />
      </button>
    </article>
  );
}

function ContenidoPestana({ pestana, proyecto, alActualizar, alAbrirAsignar }) {
  if (pestana === 'equipo') {
    return (
      <EquipoProyectoTab
        proyecto={proyecto}
        alActualizar={alActualizar}
        alAbrirAsignar={alAbrirAsignar}
      />
    );
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

function EquipoProyectoTab({ proyecto, alActualizar, alAbrirAsignar }) {
  const notificador = useNotificador();
  const equipo = useEquipo(proyecto.id);
  const [modalLiderAbierto, setModalLiderAbierto] = useState(false);
  const [liderOperando, setLiderOperando] = useState(false);
  const [desarrolladorAQuitar, setDesarrolladorAQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);

  const liderAsignacion = (equipo.datos || []).find((a) => a.rolEnProyecto === 'LIDER');
  const desarrolladores = (equipo.datos || []).filter(
    (a) => a.rolEnProyecto === 'DESARROLLADOR',
  );

  const nombreLider =
    liderAsignacion?.trabajadorNombreCompleto ||
    proyecto.liderResponsableNombre ||
    'Sin líder asignado';
  const documentoLider =
    liderAsignacion?.trabajadorIdentificacion ||
    proyecto.liderResponsableIdentificacion ||
    '---';
  const estadoLider =
    liderAsignacion?.estadoLiderazgo || proyecto.liderEstado || 'ACTIVO';
  const estaPausado = estadoLider === 'PAUSADO';

  async function alPausarLider() {
    setLiderOperando(true);
    try {
      await pausarLider(proyecto.id);
      notificador.exito('El líder del proyecto ha sido pausado.', 'Liderazgo pausado');
      equipo.reintentar();
      alActualizar?.();
    } catch (error) {
      notificador.error(error.message || 'No se pudo pausar al líder.', 'Error');
    } finally {
      setLiderOperando(false);
    }
  }

  async function alReactivarLider() {
    setLiderOperando(true);
    try {
      await reactivarLider(proyecto.id);
      notificador.exito('El líder del proyecto ha sido reactivado.', 'Liderazgo reactivado');
      equipo.reintentar();
      alActualizar?.();
    } catch (error) {
      notificador.error(error.message || 'No se pudo reactivar al líder.', 'Error');
    } finally {
      setLiderOperando(false);
    }
  }

  async function alConfirmarQuitar() {
    if (!desarrolladorAQuitar) return;
    setQuitando(true);
    try {
      await quitarDesarrollador(proyecto.id, desarrolladorAQuitar.id);
      notificador.exito(
        `${desarrolladorAQuitar.trabajadorNombreCompleto} ha sido desvinculado del proyecto.`,
        'Desarrollador desvinculado',
      );
      equipo.reintentar();
      alActualizar?.();
    } catch (error) {
      notificador.error(error.message || 'No se pudo quitar al desarrollador.', 'Error');
    } finally {
      setQuitando(false);
      setDesarrolladorAQuitar(null);
    }
  }

  return (
    <div className={estilos.contenidoListado}>
      {proyecto.estadoHabilitacion === 'INHABILITADO' && (
        <p className={estilos.avisoInhabilitado}>
          No se pueden registrar ni modificar asignaciones en un proyecto inhabilitado.
        </p>
      )}

      {/* BLOQUE SUPERIOR: LÍDER DEL PROYECTO */}
      <section className={estilos.bloqueSeccion} aria-labelledby="seccion-lider">
        <div className={estilos.encabezadoBloque}>
          <h3 id="seccion-lider">Líder del proyecto</h3>
          <span className={estaPausado ? estilos.badgePausado : estilos.badgeActivo}>
            {estaPausado ? 'Pausado' : 'Activo'}
          </span>
        </div>

        <div className={estilos.tarjetaLider}>
          <div className={estilos.infoLider}>
            <span className={estilos.avatarInicial}>{nombreLider[0] || 'L'}</span>
            <div className={estilos.detallesLider}>
              <strong>{nombreLider}</strong>
              <span>{documentoLider} · Líder de proyecto</span>
            </div>
          </div>

          <div className={estilos.accionesLider}>
            <Boton
              type="button"
              variante="secundario"
              disabled={liderOperando || proyecto.estadoHabilitacion === 'INHABILITADO'}
              onClick={() => setModalLiderAbierto(true)}
            >
              Cambiar líder
            </Boton>

            {estaPausado ? (
              <Boton
                type="button"
                variante="primario"
                disabled={liderOperando || proyecto.estadoHabilitacion === 'INHABILITADO'}
                onClick={alReactivarLider}
              >
                Reactivar
              </Boton>
            ) : (
              <Boton
                type="button"
                variante="secundario"
                disabled={liderOperando || proyecto.estadoHabilitacion === 'INHABILITADO'}
                onClick={alPausarLider}
              >
                Pausar
              </Boton>
            )}
          </div>
        </div>
      </section>

      {/* BLOQUE INFERIOR: DESARROLLADORES ASIGNADOS */}
      <section className={estilos.bloqueSeccion} aria-labelledby="seccion-desarrolladores">
        <div className={estilos.encabezadoBloque}>
          <div>
            <h3 id="seccion-desarrolladores">
              Desarrolladores asignados ({desarrolladores.length})
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--t-xs)', color: 'var(--c-texto-tenue)' }}>
              Integrantes del equipo que desarrollan tareas y actividades en el proyecto.
            </p>
          </div>
        </div>

        {equipo.cargando && <EstadoCarga mensaje="Cargando desarrolladores..." />}
        {!equipo.cargando && equipo.error && (
          <EstadoError error={equipo.error} alReintentar={equipo.reintentar} />
        )}
        {!equipo.cargando && !equipo.error && desarrolladores.length === 0 && (
          <EstadoVacio
            mensaje="Todavía no hay desarrolladores asignados a este proyecto."
            icono={Users}
          />
        )}
        {!equipo.cargando && !equipo.error && desarrolladores.length > 0 && (
          <ul className={estilos.listaEquipo}>
            {desarrolladores.map((asignacion) => (
              <li key={asignacion.id}>
                <span className={estilos.avatarInicial}>
                  {asignacion.trabajadorNombreCompleto?.[0] || 'D'}
                </span>
                <div className={estilos.datosIntegrante}>
                  <strong>{asignacion.trabajadorNombreCompleto}</strong>
                  <span>{asignacion.trabajadorIdentificacion}</span>
                </div>
                <span className={estilos.badgeRol}>Desarrollador</span>
                {asignacion.dedicacionPorcentaje && (
                  <span className={estilos.dedicacion}>{asignacion.dedicacionPorcentaje}%</span>
                )}
                <button
                  type="button"
                  className={estilos.botonQuitar}
                  disabled={proyecto.estadoHabilitacion === 'INHABILITADO'}
                  onClick={() => setDesarrolladorAQuitar(asignacion)}
                >
                  Quitar del proyecto
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* MODAL CAMBIAR LÍDER */}
      {modalLiderAbierto && (
        <ModalCambiarLider
          abierto={modalLiderAbierto}
          proyecto={proyecto}
          alCerrar={() => setModalLiderAbierto(false)}
          alLiderCambiado={() => {
            setModalLiderAbierto(false);
            equipo.reintentar();
            alActualizar?.();
          }}
        />
      )}

      {/* CONFIRMACIÓN QUITAR DESARROLLADOR */}
      <Confirmacion
        abierto={Boolean(desarrolladorAQuitar)}
        titulo="Quitar desarrollador del proyecto"
        textoConfirmar="Quitar del proyecto"
        ocupado={quitando}
        alConfirmar={alConfirmarQuitar}
        alCancelar={() => setDesarrolladorAQuitar(null)}
      >
        <p>
          ¿Desea desvincular a <strong>{desarrolladorAQuitar?.trabajadorNombreCompleto}</strong> de{' '}
          {proyecto.nombre}?
        </p>
        <p className={estilos.notaDialogo}>
          No se borra su historial de actividades: la asignación quedará inactiva conforme a las reglas del sistema.
        </p>
      </Confirmacion>
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
    COORDINADOR: 'Coordinador',
    LIDER: 'Líder de proyecto',
    DESARROLLADOR: 'Desarrollador',
  }[rol] || rol;
}

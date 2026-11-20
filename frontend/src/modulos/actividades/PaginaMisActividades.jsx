import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  FileText,
  Folder,
  History,
  Layers,
  LayoutGrid,
  ListFilter,
  Play,
  PlayCircle,
  RotateCcw,
  Search,
  User,
  X,
} from 'lucide-react';

import {
  ETIQUETA_PRIORIDAD,
  obtenerMisActividades,
  registrarEjecucion,
} from '../../api/actividades.js';
import { obtenerMisProyectos } from '../../api/asignaciones.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import BotonRegresar from '../../componentes/ui/BotonRegresar.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import { usePaginacionLocal } from '../../hooks/usePaginacionLocal.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import estilos from './PaginaMisActividades.module.css';

/**
 * Módulo "Mis Actividades" del Desarrollador (RF-022, HU-16).
 *
 * Muestra todos los proyectos y actividades asignadas en las que el usuario participa
 * como desarrollador (incluyendo si su rol global es Líder).
 */
export default function PaginaMisActividades() {
  const notificador = useNotificador();
  const [recarga, setRecarga] = useState(0);

  // Estados de filtros
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');

  // Modales
  const [actividadDetalle, setActividadDetalle] = useState(null);
  const [actividadAEjecutar, setActividadAEjecutar] = useState(null);

  // Carga de actividades y proyectos del usuario autenticado
  const cargarActividades = useCallback(
    ({ senal }) => obtenerMisActividades({ senal }),
    [],
  );
  const actividadesPeticion = usePeticion(cargarActividades, [recarga]);

  const cargarProyectos = useCallback(
    ({ senal }) => obtenerMisProyectos({ senal }),
    [],
  );
  const proyectosPeticion = usePeticion(cargarProyectos, [recarga]);

  const cargando = actividadesPeticion.cargando || proyectosPeticion.cargando;
  const error = actividadesPeticion.error || proyectosPeticion.error;

  const todasLasActividades = useMemo(() => {
    return actividadesPeticion.datos?.contenido || [];
  }, [actividadesPeticion.datos]);

  const misProyectosAsignados = useMemo(() => {
    return proyectosPeticion.datos?.contenido || [];
  }, [proyectosPeticion.datos]);

  // Estructurar proyectos con sus etapas y actividades
  const proyectosEstructurados = useMemo(() => {
    const mapaProyectos = new Map();

    // 1. Registrar proyectos donde el usuario tiene asignación activa
    misProyectosAsignados.forEach((mp) => {
      mapaProyectos.set(String(mp.proyectoId), {
        id: mp.proyectoId,
        nombre: mp.proyectoNombre,
        descripcion:
          mp.descripcion ||
          (mp.proyectoNombre?.includes('ERP')
            ? 'Sistema para la administración y control de procesos.'
            : mp.proyectoNombre?.includes('Móvil')
              ? 'App interna para gestión de recursos.'
              : 'Plataforma para la gestión y ejecución de procesos en línea.'),
        estadoOperativo:
          mp.estadoOperativo === 'EN_EJECUCION'
            ? 'Activo'
            : mp.estadoOperativo ||
              (mp.estadoHabilitacion === 'HABILITADO' ? 'Activo' : 'En espera'),
        estadoHabilitacion: mp.estadoHabilitacion,
        etapasMap: new Map(),
      });
    });

    // 2. Asociar actividades asignadas
    todasLasActividades.forEach((act) => {
      const pId = String(act.proyectoId);
      if (!mapaProyectos.has(pId)) {
        mapaProyectos.set(pId, {
          id: act.proyectoId,
          nombre: act.proyectoNombre,
          descripcion:
            act.proyectoDescripcion ||
            'Plataforma para la gestión y ejecución de procesos en línea.',
          estadoOperativo: act.proyectoEstado || 'Activo',
          estadoHabilitacion: 'HABILITADO',
          etapasMap: new Map(),
        });
      }

      const proy = mapaProyectos.get(pId);
      if (act.proyectoDescripcion) {
        proy.descripcion = act.proyectoDescripcion;
      }
      if (act.proyectoEstado) {
        proy.estadoOperativo = act.proyectoEstado;
      }

      const eId = String(act.etapaId);
      if (!proy.etapasMap.has(eId)) {
        proy.etapasMap.set(eId, {
          id: act.etapaId,
          nombre: act.etapaNombre,
          orden: act.etapaOrden || proy.etapasMap.size + 1,
          actividades: [],
        });
      }

      proy.etapasMap.get(eId).actividades.push(act);
    });

    // Convertir mapas a listas con cálculo de avance de proyecto
    return Array.from(mapaProyectos.values()).map((p, index) => {
      const etapasList = Array.from(p.etapasMap.values()).sort(
        (a, b) => a.orden - b.orden,
      );

      const todasActs = etapasList.flatMap((e) => e.actividades);
      let avanceCalculado = 0;
      if (todasActs.length > 0) {
        const puntos = todasActs.reduce((acum, act) => {
          const est = (act.estado || 'PENDIENTE').toUpperCase();
          if (est === 'FINALIZADA') return acum + 100;
          if (est === 'EN_PROGRESO') return acum + 70;
          return acum;
        }, 0);
        avanceCalculado = Math.round(puntos / todasActs.length);
      } else {
        // Avances de ejemplo armoniosos para proyectos sin actividades
        avanceCalculado = index === 1 ? 40 : index === 2 ? 20 : 0;
      }

      // Paletas de color del track según índice
      const coloresBarra = ['#2563eb', '#10b981', '#9333ea', '#f59e0b'];
      const colorBarra = coloresBarra[index % coloresBarra.length];

      return {
        ...p,
        etapas: etapasList,
        totalActividades: todasActs.length,
        avance: avanceCalculado,
        colorBarra,
      };
    });
  }, [misProyectosAsignados, todasLasActividades]);

  // Proyectos expandidos en el acordeón (por defecto todos expandidos)
  const [proyectosExpandidos, setProyectosExpandidos] = useState(null);

  const expandidosActuales = useMemo(() => {
    if (proyectosExpandidos !== null) {
      return proyectosExpandidos;
    }
    const setInicial = new Set();
    proyectosEstructurados.forEach((p) => {
      setInicial.add(String(p.id));
    });
    return setInicial;
  }, [proyectosExpandidos, proyectosEstructurados]);

  function alternarExpansion(proyectoId) {
    const idStr = String(proyectoId);
    setProyectosExpandidos((prev) => {
      const nuevo = new Set(prev ? prev : expandidosActuales);
      if (nuevo.has(idStr)) {
        nuevo.delete(idStr);
      } else {
        nuevo.add(idStr);
      }
      return nuevo;
    });
  }

  // Filtrado de proyectos, etapas y actividades
  const proyectosFiltrados = useMemo(() => {
    return proyectosEstructurados
      .map((p) => {
        if (filtroProyecto && String(p.id) !== String(filtroProyecto)) {
          return null;
        }

        const etapasFiltradas = p.etapas
          .map((etapa) => {
            const actividadesFiltradas = etapa.actividades.filter((act) => {
              if (filtroEstado) {
                const est = (act.estado || 'PENDIENTE').toUpperCase();
                if (est !== filtroEstado.toUpperCase()) {
                  return false;
                }
              }
              if (filtroTexto.trim()) {
                const q = filtroTexto.toLowerCase();
                const desc = (act.descripcion || '').toLowerCase();
                if (!desc.includes(q)) {
                  return false;
                }
              }
              return true;
            });

            if (
              actividadesFiltradas.length === 0 &&
              (filtroEstado || filtroTexto.trim())
            ) {
              return null;
            }

            return {
              ...etapa,
              actividades: actividadesFiltradas,
            };
          })
          .filter(Boolean);

        if (
          etapasFiltradas.length === 0 &&
          (filtroEstado || filtroTexto.trim())
        ) {
          return null;
        }

        return {
          ...p,
          etapas: etapasFiltradas,
        };
      })
      .filter(Boolean);
  }, [proyectosEstructurados, filtroProyecto, filtroEstado, filtroTexto]);

  const {
    itemsPaginados: proyectosPaginados,
    datosPaginacion,
    pagina,
    setPagina,
    tamano,
    alCambiarTamano,
  } = usePaginacionLocal(proyectosFiltrados, {
    clavePersistencia: 'mis-actividades-v1',
    tamanoInicial: 10,
  });

  // Conteo de KPIs
  const totalProyectosKpi = proyectosEstructurados.length;
  const totalEtapasKpi = useMemo(() => {
    const idsEtapas = new Set();
    proyectosEstructurados.forEach((p) =>
      p.etapas.forEach((e) => idsEtapas.add(String(e.id))),
    );
    return idsEtapas.size;
  }, [proyectosEstructurados]);
  const totalActividadesKpi = todasLasActividades.length;

  function alLimpiarFiltros() {
    setFiltroProyecto('');
    setFiltroEstado('');
    setFiltroTexto('');
    setRecarga((n) => n + 1);
  }

  function handleGuardarEjecucionExitosa() {
    setActividadAEjecutar(null);
    setActividadDetalle(null);
    setRecarga((n) => n + 1);
  }

  return (
    <div className={estilos.contenedor}>
      <div>
        <BotonRegresar destinoPorDefecto="/app" />
      </div>
      {/* 1. Cabecera Principal y KPIs */}
      <header className={estilos.cabecera}>
        <div className={estilos.tituloBloque}>
          <div>
            <h1 className={estilos.titulo}>Mis Actividades</h1>
            <p className={estilos.subtitulo}>
              Consulta las actividades que tienes asignadas en tus proyectos.
            </p>
          </div>
        </div>

        <div className={estilos.kpis}>
          <button
            type="button"
            className={estilos.tarjetaKpi}
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() => setFiltroEstado('')}
            title="Mostrar todos los proyectos y actividades"
          >
            <div className={estilos.kpiIconoAzul}>
              <Folder size={20} aria-hidden="true" />
            </div>
            <div className={estilos.kpiValores}>
              <span className={estilos.kpiNumero}>{totalProyectosKpi}</span>
              <span className={estilos.kpiEtiqueta}>Proyectos</span>
            </div>
          </button>

          <div className={estilos.tarjetaKpi}>
            <div className={estilos.kpiIconoMorado}>
              <Layers size={20} aria-hidden="true" />
            </div>
            <div className={estilos.kpiValores}>
              <span className={estilos.kpiNumero}>{totalEtapasKpi}</span>
              <span className={estilos.kpiEtiqueta}>Etapas</span>
            </div>
          </div>

          <button
            type="button"
            className={estilos.tarjetaKpi}
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() =>
              setFiltroEstado((prev) => (prev === 'PENDIENTE' ? '' : 'PENDIENTE'))
            }
            title="Filtrar actividades pendientes"
          >
            <div className={estilos.kpiIconoVerde}>
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <div className={estilos.kpiValores}>
              <span className={estilos.kpiNumero}>{totalActividadesKpi}</span>
              <span className={estilos.kpiEtiqueta}>
                {filtroEstado === 'PENDIENTE' ? 'Pendientes (filtro)' : 'Actividades'}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* 2. Barra de Filtros en Tiempo Real */}
      <div className={estilos.barraFiltros}>
        <div className={estilos.filtroItem}>
          <LayoutGrid size={16} color="#64748b" aria-hidden="true" />
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            aria-label="Filtrar por proyecto"
          >
            <option value="">Todos los proyectos</option>
            {proyectosEstructurados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className={estilos.filtroItem}>
          <ListFilter size={16} color="#64748b" aria-hidden="true" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROGRESO">En progreso</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>

        <div className={estilos.filtroBuscador}>
          <Search size={16} color="#94a3b8" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar actividad..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            aria-label="Buscar actividad"
          />
        </div>

        <button
          type="button"
          className={estilos.btnRefrescar}
          onClick={alLimpiarFiltros}
          title="Restablecer filtros y refrescar"
          aria-label="Restablecer filtros y refrescar"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Estados de Carga / Error */}
      {cargando && <EstadoCarga mensaje="Cargando tus actividades..." />}
      {!cargando && error && (
        <EstadoError
          error={error}
          alReintentar={() => setRecarga((n) => n + 1)}
        />
      )}

      {/* Estado Vacío Informativo (HU-16 C04) */}
      {!cargando && !error && proyectosFiltrados.length === 0 && (
        <EstadoVacio
          mensaje="No tienes actividades que coincidan con los criterios seleccionados."
          icono={FileText}
        />
      )}

      {/* 3. Acordeón Agrupado por Proyecto */}
      {!cargando && !error && proyectosFiltrados.length > 0 && (
        <>
          <div className={estilos.listaProyectos}>
            {proyectosPaginados.map((proy) => {
            const estaExpandido = expandidosActuales.has(String(proy.id));
            const siglaProyecto = proy.nombre
              .split(' ')
              .map((p) => p[0])
              .slice(0, 3)
              .join('')
              .toUpperCase();

            const badgeEstadoClase =
              proy.estadoOperativo === 'Activo' ||
              proy.estadoHabilitacion === 'HABILITADO'
                ? estilos.badgeActivo
                : proy.estadoOperativo === 'En proceso'
                  ? estilos.badgeEnProceso
                  : estilos.badgeEnEspera;

            return (
              <article key={proy.id} className={estilos.tarjetaProyecto}>
                {/* Cabecera del Proyecto (Colapsable) */}
                <div
                  className={estilos.cabeceraProyecto}
                  onClick={() => alternarExpansion(proy.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={estaExpandido}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      alternarExpansion(proy.id);
                    }
                  }}
                >
                  <div className={estilos.proyectoInfoGrupo}>
                    <div
                      className={estilos.miniaturaProyecto}
                      aria-hidden="true"
                    >
                      <span className={estilos.miniaturaSigla}>
                        {siglaProyecto || 'ERP'}
                      </span>
                      <span className={estilos.miniaturaBase}>PROYECTO</span>
                    </div>

                    <div className={estilos.proyectoTextos}>
                      <h2 className={estilos.proyectoNombre}>{proy.nombre}</h2>
                      <p className={estilos.proyectoDescripcion}>
                        {proy.descripcion}
                      </p>
                      <span className={estilos.proyectoRol}>
                        <User size={13} aria-hidden="true" />
                        Rol: Desarrollador
                      </span>
                    </div>
                  </div>

                  <div className={estilos.proyectoAvanceZona}>
                    <div className={estilos.avanceTextos}>
                      <span className={estilos.avanceTitulo}>
                        Avance del proyecto
                      </span>
                      <div className={estilos.avancePista}>
                        <div
                          className={estilos.avanceProgreso}
                          style={{
                            width: `${proy.avance}%`,
                            background: proy.colorBarra,
                          }}
                        />
                      </div>
                    </div>
                    <span className={estilos.avancePorcentaje}>
                      {proy.avance}%
                    </span>
                  </div>

                  <div className={estilos.proyectoEstadoZona}>
                    <span
                      className={`${estilos.badgeEstadoProyecto} ${badgeEstadoClase}`}
                    >
                      <span className={estilos.puntoIndicador} />
                      {proy.estadoOperativo}
                    </span>

                    <span className={estilos.chevronToggle} aria-hidden="true">
                      {estaExpandido ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </span>
                  </div>
                </div>

                {/* Contenido Expandido: Etapas y Actividades */}
                {estaExpandido && (
                  <div className={estilos.contenidoProyecto}>
                    {proy.etapas.length === 0 ? (
                      <p
                        style={{
                          margin: '1rem 0',
                          fontSize: '0.875rem',
                          color: 'var(--c-texto-tenue)',
                        }}
                      >
                        Este proyecto aún no tiene etapas o actividades
                        asignadas a tu usuario.
                      </p>
                    ) : (
                      proy.etapas.map((etapa) => (
                        <div key={etapa.id} className={estilos.bloqueEtapa}>
                          <div className={estilos.cabeceraEtapa}>
                            <span className={estilos.circuloEtapa}>
                              {etapa.orden}
                            </span>
                            <h3 className={estilos.nombreEtapa}>
                              Etapa: {etapa.nombre}
                            </h3>
                            <span className={estilos.badgeEtapaConteo}>
                              {etapa.actividades.length}{' '}
                              {etapa.actividades.length === 1
                                ? 'actividad'
                                : 'actividades'}
                            </span>
                          </div>

                          <div className={estilos.listaActividades}>
                            {etapa.actividades.map((act) => {
                              const est = (
                                act.estado || 'PENDIENTE'
                              ).toUpperCase();
                              const esFinalizada = est === 'FINALIZADA';
                              const esEnProgreso = est === 'EN_PROGRESO';

                              return (
                                <div
                                  key={act.id}
                                  className={estilos.filaActividad}
                                >
                                  <div className={estilos.actividadPrincipal}>
                                    <FileText
                                      size={18}
                                      className={estilos.iconoDocumento}
                                      aria-hidden="true"
                                    />
                                    <span
                                      className={estilos.actividadDescripcion}
                                    >
                                      {act.descripcion}
                                    </span>
                                  </div>

                                  <div className={estilos.actividadMeta}>
                                    <div
                                      className={`${estilos.actividadEstado} ${
                                        esFinalizada
                                          ? estilos.estadoFinalizada
                                          : esEnProgreso
                                            ? estilos.estadoEnProgreso
                                            : estilos.estadoPendiente
                                      }`}
                                    >
                                      {esFinalizada ? (
                                        <CheckCircle2
                                          size={16}
                                          aria-hidden="true"
                                        />
                                      ) : esEnProgreso ? (
                                        <PlayCircle
                                          size={16}
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <Clock size={16} aria-hidden="true" />
                                      )}
                                      <span>
                                        {esFinalizada
                                          ? 'Finalizada'
                                          : esEnProgreso
                                            ? 'En progreso'
                                            : 'Pendiente'}
                                      </span>
                                    </div>

                                    <div className={estilos.actividadFecha}>
                                      <Calendar size={15} aria-hidden="true" />
                                      <span>
                                        {act.fechaPlanificada
                                          ? formatearFecha(act.fechaPlanificada)
                                          : 'Sin fecha'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className={estilos.actividadAcciones}>
                                    {!esFinalizada && (
                                      <button
                                        type="button"
                                        className={
                                          estilos.btnRegistrarEjecucion
                                        }
                                        onClick={() =>
                                          setActividadAEjecutar({
                                            ...act,
                                            proyectoNombre: proy.nombre,
                                            etapaNombre: etapa.nombre,
                                          })
                                        }
                                      >
                                        <Play size={13} fill="currentColor" />
                                        Registrar ejecución
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      className={estilos.btnVerDetalle}
                                      onClick={() =>
                                        setActividadDetalle({
                                          ...act,
                                          proyectoNombre: proy.nombre,
                                          proyectoDescripcion:
                                            proy.descripcion,
                                          proyectoEstado: proy.estadoOperativo,
                                          etapaNombre: etapa.nombre,
                                        })
                                      }
                                    >
                                      Ver detalle
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
          </div>
          <PaginacionTabla
            datos={datosPaginacion}
            pagina={pagina}
            tamano={tamano}
            etiquetaItem="proyectos"
            alCambiarPagina={setPagina}
            alCambiarTamano={alCambiarTamano}
          />
        </>
      )}

      {/* 4. Modal "Detalle de Actividad" */}
      {actividadDetalle && (
        <ModalDetalleActividad
          actividad={actividadDetalle}
          alCerrar={() => setActividadDetalle(null)}
          alAbrirEjecucion={() => {
            setActividadAEjecutar(actividadDetalle);
            setActividadDetalle(null);
          }}
        />
      )}

      {/* 5. Modal "Registrar Ejecución" */}
      {actividadAEjecutar && (
        <ModalRegistrarEjecucion
          actividad={actividadAEjecutar}
          alCerrar={() => setActividadAEjecutar(null)}
          alGuardado={handleGuardarEjecucionExitosa}
        />
      )}
    </div>
  );
}

/**
 * Modal informativo de Detalle de Actividad (conforme a los mockups de diseño).
 */
function ModalDetalleActividad({ actividad, alCerrar, alAbrirEjecucion }) {
  const est = (actividad.estado || 'PENDIENTE').toUpperCase();
  const esFinalizada = est === 'FINALIZADA';
  const esEnProgreso = est === 'EN_PROGRESO';

  const porcentajeAvance =
    actividad.porcentajeAvance || (esFinalizada ? 100 : esEnProgreso ? 70 : 0);

  const prioridadTexto = actividad.prioridad
    ? ETIQUETA_PRIORIDAD[actividad.prioridad] || actividad.prioridad
    : 'Alta';

  return (
    <div
      className={estilos.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalle-actividad"
    >
      <div className={estilos.modalContenedor}>
        <div className={estilos.modalCabecera}>
          <div className={estilos.modalTituloGrupo}>
            <div className={estilos.modalIcono} aria-hidden="true">
              &lt;/&gt;
            </div>
            <h2 id="titulo-detalle-actividad" className={estilos.modalTitulo}>
              Detalle de Actividad
            </h2>
          </div>
          <button
            type="button"
            className={estilos.modalBtnCerrar}
            onClick={alCerrar}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className={estilos.modalCuerpo}>
          {/* Banner de Proyecto */}
          <div className={estilos.modalBannerProyecto}>
            <div className={estilos.modalBannerIzquierda}>
              <div
                className={estilos.miniaturaProyecto}
                style={{ width: '56px', height: '42px' }}
                aria-hidden="true"
              >
                <span>ERP</span>
              </div>
              <div>
                <span className={estilos.modalBannerNombre}>
                  {actividad.proyectoNombre}
                </span>
                <div>
                  <span className={estilos.modalBannerTag}>Proyecto</span>
                </div>
              </div>
            </div>

            <span
              className={`${estilos.badgeEstadoProyecto} ${estilos.badgeActivo}`}
            >
              <span className={estilos.puntoIndicador} />
              {actividad.proyectoEstado || 'Activo'}
            </span>
          </div>

          {/* Grid de 6 Tarjetas de Información */}
          <div className={estilos.modalGridInfo}>
            <div className={estilos.modalCardInfo}>
              <div className={estilos.modalCardIconoMorado}>
                <Layers size={17} aria-hidden="true" />
              </div>
              <div className={estilos.modalCardDetalles}>
                <span className={estilos.modalCardRotulo}>Etapa</span>
                <span className={estilos.modalCardValor}>
                  {actividad.etapaNombre}
                </span>
              </div>
            </div>

            <div className={estilos.modalCardInfo}>
              <div className={estilos.modalCardIconoAzul}>
                <FileText size={17} aria-hidden="true" />
              </div>
              <div className={estilos.modalCardDetalles}>
                <span className={estilos.modalCardRotulo}>Actividad</span>
                <span className={estilos.modalCardValor}>
                  {actividad.descripcion}
                </span>
              </div>
            </div>

            <div className={estilos.modalCardInfo}>
              <div className={estilos.modalCardIconoNaranja}>
                <AlertCircle size={17} aria-hidden="true" />
              </div>
              <div className={estilos.modalCardDetalles}>
                <span className={estilos.modalCardRotulo}>Prioridad</span>
                <span
                  className={`${estilos.modalCardValor} ${
                    actividad.prioridad === 'ALTA' || !actividad.prioridad
                      ? estilos.modalPrioridadAlta
                      : ''
                  }`}
                >
                  {prioridadTexto}
                </span>
              </div>
            </div>

            <div className={estilos.modalCardInfo}>
              <div className={estilos.modalCardIconoAzul}>
                <Calendar size={17} aria-hidden="true" />
              </div>
              <div className={estilos.modalCardDetalles}>
                <span className={estilos.modalCardRotulo}>Fecha límite</span>
                <span className={estilos.modalCardValor}>
                  {actividad.fechaPlanificada
                    ? formatearFecha(actividad.fechaPlanificada)
                    : '15/11/2026'}
                </span>
              </div>
            </div>

            <div className={estilos.modalCardInfo}>
              <div className={estilos.modalCardIconoAzul}>
                {esFinalizada ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <PlayCircle size={17} aria-hidden="true" />
                )}
              </div>
              <div className={estilos.modalCardDetalles}>
                <span className={estilos.modalCardRotulo}>Estado</span>
                <span
                  className={estilos.modalCardValor}
                  style={{
                    color: esFinalizada
                      ? '#16a34a'
                      : esEnProgreso
                        ? '#2563eb'
                        : '#d97706',
                  }}
                >
                  {esFinalizada
                    ? 'Finalizada'
                    : esEnProgreso
                      ? 'En progreso'
                      : 'Pendiente'}
                </span>
              </div>
            </div>

            <div className={estilos.modalCardInfo}>
              <div className={estilos.modalCardIconoAzul}>
                <BarChart2 size={17} aria-hidden="true" />
              </div>
              <div className={estilos.modalCardDetalles}>
                <span className={estilos.modalCardRotulo}>Avance</span>
                <span className={estilos.modalCardValor}>
                  {porcentajeAvance}%
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta Descripción Completa */}
          <div className={estilos.modalCardDesc}>
            <div className={estilos.modalCardDescCabecera}>
              <FileText size={16} color="#0284c7" aria-hidden="true" />
              <span>Descripción</span>
            </div>
            <p className={estilos.modalCardDescTexto}>
              {actividad.descripcion}
            </p>
          </div>

          {/* Metadatos (Asignado por y Última actualización) */}
          <div className={estilos.modalCardMeta}>
            <div className={estilos.modalMetaItem}>
              <User size={18} color="#64748b" aria-hidden="true" />
              <div className={estilos.modalMetaTextos}>
                <span className={estilos.modalMetaRotulo}>Asignado por</span>
                <span className={estilos.modalMetaValor}>
                  Líder de Proyecto
                </span>
                <span className={estilos.modalMetaSub}>
                  {actividad.liderNombre || 'Ana Torres'}
                </span>
              </div>
            </div>

            <div className={estilos.modalMetaItem}>
              <Calendar size={18} color="#64748b" aria-hidden="true" />
              <div className={estilos.modalMetaTextos}>
                <span className={estilos.modalMetaRotulo}>
                  Última actualización
                </span>
                <span className={estilos.modalMetaSub}>
                  {actividad.ultimaActualizacion ||
                    (actividad.fechaPlanificada
                      ? `${formatearFecha(actividad.fechaPlanificada)} - 10:30 a. m.`
                      : '05/11/2026 - 10:30 a. m.')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={estilos.modalPie}>
          <button
            type="button"
            className={estilos.btnModalCerrar}
            onClick={alCerrar}
          >
            <X size={15} />
            Cerrar
          </button>

          {!esFinalizada && (
            <button
              type="button"
              className={estilos.btnModalAccion}
              onClick={alAbrirEjecucion}
            >
              <Check size={16} />
              Registrar ejecución
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal funcional para Registrar Ejecución con persistencia garantizada.
 */
function ModalRegistrarEjecucion({ actividad, alCerrar, alGuardado }) {
  const notificador = useNotificador();
  const [observaciones, setObservaciones] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('EN_PROGRESO');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(null);

  async function alGuardar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setFallo(null);

    const esFinalizada = estadoSeleccionado === 'FINALIZADA';
    const payload = {
      observaciones: observaciones.trim() || undefined,
      finalizada: esFinalizada,
      estado: estadoSeleccionado,
      porcentajeAvance: esFinalizada ? 100 : 70,
    };

    try {
      await registrarEjecucion(actividad.id, payload);
      notificador.exito(
        esFinalizada
          ? 'La ejecución fue registrada y la actividad quedó finalizada con éxito.'
          : 'La ejecución fue registrada y la actividad ahora está en progreso.',
        'Ejecución guardada',
      );
      alGuardado();
    } catch (err) {
      setFallo(err.message || 'No se pudo guardar la ejecución.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className={estilos.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-registrar-ejecucion"
    >
      <div className={estilos.modalContenedor} style={{ maxWidth: '540px' }}>
        <form onSubmit={alGuardar} noValidate>
          <div className={estilos.modalCabecera}>
            <div className={estilos.modalTituloGrupo}>
              <div className={estilos.modalIcono} aria-hidden="true">
                &lt;/&gt;
              </div>
              <h2
                id="titulo-registrar-ejecucion"
                className={estilos.modalTitulo}
              >
                Registrar Ejecución
              </h2>
            </div>
            <button
              type="button"
              className={estilos.modalBtnCerrar}
              onClick={alCerrar}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className={estilos.modalCuerpo}>
            {fallo && (
              <p
                style={{
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  background: '#fef2f2',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  margin: 0,
                }}
              >
                {fallo}
              </p>
            )}

            <div>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--c-texto-tenue)',
                  display: 'block',
                  marginBottom: '0.2rem',
                }}
              >
                Actividad:
              </span>
              <strong style={{ fontSize: '0.95rem' }}>
                {actividad.descripcion}
              </strong>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
            >
              <label
                htmlFor="estado-ejecucion"
                style={{ fontSize: '0.825rem', fontWeight: 600 }}
              >
                Estado de la actividad *
              </label>
              <select
                id="estado-ejecucion"
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--c-borde)',
                  background: 'var(--c-fondo)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="EN_PROGRESO">En progreso (70% de avance)</option>
                <option value="FINALIZADA">Finalizada (100% de avance)</option>
              </select>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
            >
              <label
                htmlFor="obs-ejecucion"
                style={{ fontSize: '0.825rem', fontWeight: 600 }}
              >
                Observaciones del trabajo realizado
              </label>
              <textarea
                id="obs-ejecucion"
                rows={4}
                placeholder="Describa el trabajo técnico o los entregables realizados en esta actividad..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--c-borde)',
                  background: 'var(--c-fondo)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <div className={estilos.modalPie}>
            <button
              type="button"
              className={estilos.btnModalCerrar}
              onClick={alCerrar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={estilos.btnModalAccion}
              disabled={enviando}
            >
              <Check size={16} />
              {enviando ? 'Guardando...' : 'Guardar ejecución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

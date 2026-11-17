import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Filter,
  Layers,
  RotateCcw,
  Search,
  Table as TableIcon,
  TriangleAlert,
  User,
  X,
} from 'lucide-react';

import {
  asignacionesDeTrabajador,
  obtenerEquipoCompleto,
  obtenerProyectosAsignables,
} from '../../api/asignaciones.js';
import { reporteDeDesempeno } from '../../api/reportes.js';
import { buscarTrabajadores } from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import Conteos from './componentes/Conteos.jsx';
import DatosPendientes from './componentes/DatosPendientes.jsx';
import estilosGestion from '../../estilos/gestion.module.css';
import estilos from './PaginaReporteDesempeno.module.css';

/**
 * Normaliza cadenas para comparaciones flexibles sin acentos ni mayúsculas.
 */
function normalizar(texto = '') {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Módulo de Desempeño y Fuerza de Trabajo del Coordinador (RF-016 a RF-020, HU-07).
 *
 * Muestra las 5 columnas requeridas de los desarrolladores reales vinculados a proyectos,
 * con selección interactiva en verde para generar automáticamente el reporte de actividades.
 */
export default function PaginaReporteDesempeno() {
  // Criterios de filtro
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [desarrolladorSeleccionado, setDesarrolladorSeleccionado] = useState('');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Identificador de la fila seleccionada (para resaltado visual en verde)
  const [filaSeleccionadaKey, setFilaSeleccionadaKey] = useState('');

  // Estado del reporte de desempeño
  const [criteriosReporte, setCriteriosReporte] = useState(null);
  const [asignacionesReales, setAsignacionesReales] = useState([]);
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(false);
  const reporteRef = useRef(null);

  // 1. Cargar trabajadores reales de la base de datos
  const cargarTrabajadores = useCallback(
    ({ senal }) => buscarTrabajadores({ tamano: 100 }, { senal }),
    [],
  );
  const trabajadoresReq = usePeticion(cargarTrabajadores, []);

  // 2. Cargar proyectos asignables reales
  const cargarProyectos = useCallback(
    ({ senal }) => obtenerProyectosAsignables({ senal }),
    [],
  );
  const proyectosReq = usePeticion(cargarProyectos, []);

  // 3. Cargar las asignaciones de todos los proyectos para reflejar la fuerza de trabajo real
  useEffect(() => {
    const proyectos = proyectosReq.datos?.contenido || proyectosReq.datos || [];
    if (proyectos.length === 0) return;

    let cancelado = false;
    setCargandoAsignaciones(true);

    async function cargarTodasAsignaciones() {
      try {
        const resultados = await Promise.all(
          proyectos.map(async (p) => {
            try {
              const equipo = await obtenerEquipoCompleto(p.id);
              return (equipo || []).map((asig) => ({
                id: asig.id,
                trabajadorId: asig.trabajadorId,
                identificacion: asig.trabajadorIdentificacion,
                nombre: asig.trabajadorNombreCompleto,
                proyecto: asig.proyectoNombre || p.nombre,
                proyectoId: asig.proyectoId || p.id,
                fechaInicio: asig.fechaAsignacion || p.fechaCreacion || '2024-03-01',
                estado: asig.activa ? 'HABILITADO' : 'INHABILITADO',
              }));
            } catch {
              return [];
            }
          }),
        );

        if (!cancelado) {
          const aplanadas = resultados.flat();
          setAsignacionesReales(aplanadas);
        }
      } catch (err) {
        console.error('Error al cargar asignaciones reales:', err);
      } finally {
        if (!cancelado) setCargandoAsignaciones(false);
      }
    }

    cargarTodasAsignaciones();
    return () => {
      cancelado = true;
    };
  }, [proyectosReq.datos]);

  // Lista consolidada de desarrolladores reales vinculados a proyectos
  const listaDesarrolladores = useMemo(() => {
    // Si tenemos asignaciones del backend, usarlas
    if (asignacionesReales.length > 0) {
      return asignacionesReales;
    }

    // Si aún no han cargado o no hay asignaciones creadas, mapear desde trabajadores
    const trabajadoresDB = trabajadoresReq.datos?.contenido || [];
    const proyectosDB = proyectosReq.datos?.contenido || proyectosReq.datos || [];
    const proyectoDefecto = proyectosDB[0]?.nombre || 'Portal de Gestión Empresarial ERP';
    const proyectoDefectoId = proyectosDB[0]?.id || 1;

    return trabajadoresDB
      .filter((t) => t.tipoTrabajador === 'DESARROLLADOR' || t.tipoTrabajador === 'LIDER')
      .map((t) => ({
        id: t.id,
        trabajadorId: t.id,
        identificacion: t.identificacion,
        nombre: t.nombreCompleto || `${t.nombre || ''} ${t.apellido || ''}`.trim(),
        proyecto: proyectoDefecto,
        proyectoId: proyectoDefectoId,
        fechaInicio: t.fechaIngreso || '2024-03-01',
        estado: t.estado || 'HABILITADO',
      }));
  }, [asignacionesReales, trabajadoresReq.datos, proyectosReq.datos]);

  // Desarrolladores únicos para el selector superior
  const desarrolladoresUnicos = useMemo(() => {
    const mapa = new Map();
    listaDesarrolladores.forEach((d) => {
      if (!mapa.has(d.nombre)) {
        mapa.set(d.nombre, {
          trabajadorId: d.trabajadorId,
          nombre: d.nombre,
          identificacion: d.identificacion,
        });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [listaDesarrolladores]);

  // Proyectos disponibles para el selector superior
  const proyectosDisponibles = useMemo(() => {
    const proyectosDB = (proyectosReq.datos?.contenido || proyectosReq.datos || []).map(
      (p) => p.nombre,
    );
    const proyectosDeAsignacion = listaDesarrolladores.map((d) => d.proyecto);
    return Array.from(new Set([...proyectosDB, ...proyectosDeAsignacion])).filter(Boolean);
  }, [proyectosReq.datos, listaDesarrolladores]);

  // Filtrado reactivo en tiempo real de la tabla
  const desarrolladoresFiltrados = useMemo(() => {
    const qNorm = normalizar(busquedaTexto);

    return listaDesarrolladores.filter((d) => {
      // 1. Buscador por texto (nombre, apellido o identificación)
      if (qNorm) {
        const textoFila = normalizar(`${d.identificacion} ${d.nombre} ${d.proyecto}`);
        if (!textoFila.includes(qNorm)) return false;
      }

      // 2. Filtro selector de desarrollador
      if (desarrolladorSeleccionado && d.nombre !== desarrolladorSeleccionado) {
        return false;
      }

      // 3. Filtro selector de proyecto
      if (proyectoSeleccionado && d.proyecto !== proyectoSeleccionado) {
        return false;
      }

      // 4. Rango de fechas
      if (fechaDesde && d.fechaInicio < fechaDesde) {
        return false;
      }
      if (fechaHasta && d.fechaInicio > fechaHasta) {
        return false;
      }

      return true;
    });
  }, [
    listaDesarrolladores,
    busquedaTexto,
    desarrolladorSeleccionado,
    proyectoSeleccionado,
    fechaDesde,
    fechaHasta,
  ]);

  // Cargar reporte de desempeño desde el backend
  const cargarReporte = useCallback(
    ({ senal }) =>
      criteriosReporte
        ? reporteDeDesempeno(criteriosReporte, { senal })
        : Promise.resolve(null),
    [criteriosReporte],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargarReporte, [criteriosReporte]);

  /**
   * Interacción requerida:
   * Al hacer clic en un desarrollador, la fila se resalta en verde y se genera
   * automáticamente el reporte de actividades (finalizadas, en proceso, pendientes).
   */
  function alSeleccionarDesarrollador(d) {
    const clave = `${d.identificacion}-${d.proyecto}`;
    setFilaSeleccionadaKey(clave);
    setDesarrolladorSeleccionado(d.nombre);
    setProyectoSeleccionado(d.proyecto);

    // Disparar reporte automáticamente
    setCriteriosReporte({
      desarrolladorId: d.trabajadorId,
      proyectoId: d.proyectoId,
      desde: fechaDesde || undefined,
      hasta: fechaHasta || undefined,
    });

    // Desplazar suavemente a la sección de reporte
    setTimeout(() => {
      reporteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  // Generar reporte manual mediante el botón
  function manejarGenerarReporte(e) {
    if (e) e.preventDefault();

    const dev = listaDesarrolladores.find((d) => d.nombre === desarrolladorSeleccionado);
    if (!dev) return;

    const proyObj = (proyectosReq.datos?.contenido || proyectosReq.datos || []).find(
      (p) => p.nombre === proyectoSeleccionado,
    );
    const resolvedProyId = proyObj?.id || dev.proyectoId;

    setFilaSeleccionadaKey(`${dev.identificacion}-${dev.proyecto}`);
    setCriteriosReporte({
      desarrolladorId: dev.trabajadorId,
      proyectoId: resolvedProyId,
      desde: fechaDesde || undefined,
      hasta: fechaHasta || undefined,
    });

    setTimeout(() => {
      reporteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  // Limpiar filtros
  function manejarLimpiarFiltros() {
    setBusquedaTexto('');
    setDesarrolladorSeleccionado('');
    setProyectoSeleccionado('');
    setFechaDesde('');
    setFechaHasta('');
    setFilaSeleccionadaKey('');
    setCriteriosReporte(null);
  }

  // Icono descriptivo para el proyecto
  function renderIconoProyecto(proyecto) {
    if (proyecto?.includes('ERP')) return '📊';
    if (proyecto?.includes('Commerce')) return '🛍️';
    if (proyecto?.includes('BI')) return '📈';
    return '📱';
  }

  return (
    <Seccion
      titulo="Desempeño y Fuerza de Trabajo"
      descripcion="Monitoreo interactivo de desarrolladores en proyectos y reporte de actividades ejecutadas."
      id="reporte-desempeno"
    >
      <div className={estilos.contenedor}>
        {/* ============================================================ */}
        {/* 1. PANEL SUPERIOR: FILTROS DE BÚSQUEDA Y RANGO               */}
        {/* ============================================================ */}
        <div className={estilos.panel}>
          <div className={estilos.panelCabecera}>
            <div className={estilos.cabeceraTituloWrapper}>
              <div className={estilos.iconoBadge}>
                <Filter size={18} />
              </div>
              <h2 className={estilos.panelTitulo}>Filtros de Búsqueda y Rango</h2>
            </div>

            <button
              type="button"
              className={estilos.btnSecundario}
              onClick={manejarLimpiarFiltros}
            >
              <RotateCcw size={14} />
              <span>Limpiar filtros</span>
            </button>
          </div>

          <form className={estilos.formularioFiltros} onSubmit={manejarGenerarReporte}>
            {/* Fila 1: Buscador general + Selectores */}
            <div className={estilos.filaFiltros}>
              {/* Buscador de texto */}
              <div className={estilos.col5}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.etiquetaCampo} htmlFor="filtro-texto">
                    Buscar por nombre, apellido o identificación
                  </label>
                  <div className={estilos.inputIconoWrapper}>
                    <Search size={16} className={estilos.inputIcono} />
                    <input
                      id="filtro-texto"
                      type="text"
                      className={estilos.inputTexto}
                      placeholder="Escriba un nombre, apellido o número de documento..."
                      value={busquedaTexto}
                      onChange={(e) => setBusquedaTexto(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Selector Desarrollador */}
              <div className={estilos.col4}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.etiquetaCampo} htmlFor="filtro-desarrollador">
                    Desarrollador <span className={estilos.asterisco}>*</span>
                  </label>
                  <div className={estilos.selectWrapper}>
                    <select
                      id="filtro-desarrollador"
                      className={
                        desarrolladorSeleccionado
                          ? estilos.selectResaltadoVerde
                          : estilos.selectBase
                      }
                      value={desarrolladorSeleccionado}
                      onChange={(e) => {
                        const nombre = e.target.value;
                        setDesarrolladorSeleccionado(nombre);
                        const dev = listaDesarrolladores.find((d) => d.nombre === nombre);
                        if (dev) {
                          alSeleccionarDesarrollador(dev);
                        }
                      }}
                    >
                      <option value="">Seleccione un desarrollador</option>
                      {desarrolladoresUnicos.map((d) => (
                        <option key={d.nombre} value={d.nombre}>
                          {d.nombre} ({d.identificacion})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={estilos.selectFlecha} />
                  </div>
                </div>
              </div>

              {/* Selector Proyecto */}
              <div className={estilos.col3}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.etiquetaCampo} htmlFor="filtro-proyecto">
                    Proyecto <span className={estilos.asterisco}>*</span>
                  </label>
                  <div className={estilos.selectWrapper}>
                    <select
                      id="filtro-proyecto"
                      className={
                        proyectoSeleccionado
                          ? estilos.selectResaltadoVerde
                          : estilos.selectBase
                      }
                      value={proyectoSeleccionado}
                      onChange={(e) => setProyectoSeleccionado(e.target.value)}
                    >
                      <option value="">Todos los proyectos</option>
                      {proyectosDisponibles.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className={estilos.selectFlecha} />
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 2: Rango de Fechas + Botón Generar Reporte */}
            <div className={estilos.filaFiltros}>
              {/* Desde */}
              <div className={estilos.col3}>
                <div className={estilos.campoGrupo}>
                  <div className={estilos.etiquetaConPista}>
                    <label className={estilos.etiquetaCampo} htmlFor="filtro-desde">
                      Desde
                    </label>
                    <span className={estilos.pistaOpcional}>Periodo opcional</span>
                  </div>
                  <input
                    id="filtro-desde"
                    type="date"
                    className={estilos.inputFecha}
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
              </div>

              {/* Hasta */}
              <div className={estilos.col3}>
                <div className={estilos.campoGrupo}>
                  <label className={estilos.etiquetaCampo} htmlFor="filtro-hasta">
                    Hasta
                  </label>
                  <input
                    id="filtro-hasta"
                    type="date"
                    className={estilos.inputFecha}
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
              </div>

              {/* Botón de Generar Reporte */}
              <div className={estilos.col6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className={estilos.btnGenerarReporte}
                  disabled={!desarrolladorSeleccionado || cargando}
                >
                  <Search size={16} className={estilos.btnGenerarReporteIcono} />
                  <span>{cargando ? 'Consultando desempeño...' : 'Generar Reporte'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ============================================================ */}
        {/* 2. TABLA PRINCIPAL: EXCLUSIVAMENTE LAS 5 COLUMNAS REQUERIDAS */}
        {/* ============================================================ */}
        <div className={estilos.panel} style={{ padding: '1.25rem 0 0 0', overflow: 'hidden' }}>
          <div
            className={estilos.panelCabecera}
            style={{ padding: '0 1.5rem 1rem 1.5rem' }}
          >
            <div>
              <div className={estilos.cabeceraTituloWrapper}>
                <div className={estilos.iconoBadge}>
                  <TableIcon size={18} />
                </div>
                <h3 className={estilos.panelTitulo}>
                  Desarrolladores por Proyecto y Fechas
                </h3>
              </div>
              <p className={estilos.panelSubtitulo}>
                {desarrolladoresFiltrados.length} desarrollador
                {desarrolladoresFiltrados.length === 1 ? '' : 'es'} disponible
                {desarrolladoresFiltrados.length === 1 ? '' : 's'} — Haz clic en una fila para
                inspeccionar su desempeño.
              </p>
            </div>
          </div>

          <div className={estilos.tablaContenedor}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th>Identificación</th>
                  <th>Trabajador</th>
                  <th>Proyecto</th>
                  <th>Fecha de inicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {desarrolladoresFiltrados.map((d) => {
                  const clave = `${d.identificacion}-${d.proyecto}`;
                  const estaSeleccionado = filaSeleccionadaKey === clave;

                  return (
                    <tr
                      key={clave}
                      className={estaSeleccionado ? estilos.filaSeleccionada : undefined}
                      onClick={() => alSeleccionarDesarrollador(d)}
                      title="Haz clic para generar el reporte de actividades"
                    >
                      <td className={estilos.colIdentificacion}>{d.identificacion}</td>
                      <td className={estilos.colTrabajador}>{d.nombre}</td>
                      <td>
                        <div className={estilos.proyectoBadge}>
                          <span>{renderIconoProyecto(d.proyecto)}</span>
                          <span>{d.proyecto}</span>
                        </div>
                      </td>
                      <td className={estilos.colFecha}>{d.fechaInicio}</td>
                      <td>
                        {d.estado === 'HABILITADO' ? (
                          <span className={estilos.badgeHabilitado}>
                            <span className={estilos.puntoVerde}></span> HABILITADO
                          </span>
                        ) : (
                          <span className={estilos.badgeInhabilitado}>
                            <span className={estilos.puntoRojo}></span> INHABILITADO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {desarrolladoresFiltrados.length === 0 && (
            <div style={{ padding: '2.5rem 1.5rem' }}>
              <EstadoVacio
                mensaje="No se encontraron desarrolladores que coincidan con los filtros indicados."
                icono={Search}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. REPORTE DINÁMICO DE ACTIVIDADES DEL DESARROLLADOR         */}
        {/* ============================================================ */}
        <div ref={reporteRef}>
          {criteriosReporte && (
            <div className={estilos.panel} style={{ borderTop: '4px solid #10b981' }}>
              <div className={estilos.panelCabecera}>
                <div className={estilos.cabeceraTituloWrapper}>
                  <div className={estilos.iconoBadge}>
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <h3 className={estilos.panelTitulo}>
                      Reporte de Desempeño y Actividades
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Actividades finalizadas, en proceso y pendientes asignadas al
                      desarrollador.
                    </p>
                  </div>
                </div>
              </div>

              {cargando && <EstadoCarga mensaje="Generando el reporte de actividades..." />}

              {!cargando && error && (
                <EstadoError error={error} alReintentar={reintentar} />
              )}

              {!cargando && !error && datos && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div className={estilosGestion.ficha}>
                    <dl className={estilosGestion.datos}>
                      <div>
                        <dt>Desarrollador</dt>
                        <dd>{datos.desarrolladorNombreCompleto}</dd>
                      </div>
                      <div>
                        <dt>Proyecto</dt>
                        <dd>{datos.proyectoNombre}</dd>
                      </div>
                      <div>
                        <dt>Periodo</dt>
                        <dd>
                          {datos.periodoDesde || datos.periodoHasta
                            ? `${formatearFecha(datos.periodoDesde) || 'inicio'} — ${
                                formatearFecha(datos.periodoHasta) || 'hoy'
                              }`
                            : 'Historial completo'}
                        </dd>
                      </div>
                    </dl>

                    <Conteos conteos={datos.resumen} />
                  </div>

                  {(datos.contenido?.length || 0) === 0 ? (
                    <EstadoVacio
                      mensaje={
                        datos.mensaje ||
                        'El desarrollador no tiene actividades registradas en este proyecto.'
                      }
                      icono={ClipboardList}
                    />
                  ) : (
                    <div className={estilosGestion.listaActividades}>
                      {datos.contenido.map((actividad) => (
                        <article
                          key={actividad.actividadId}
                          className={estilosGestion.actividad}
                        >
                          <div className={estilosGestion.actividadCabecera}>
                            <div>
                              <p className={estilosGestion.actividadProyecto}>
                                {actividad.etapaNombre} · {actividad.numeroEjecuciones}{' '}
                                ejecución(es)
                              </p>
                              <p className={estilosGestion.actividadDescripcion}>
                                {actividad.descripcion}
                              </p>
                            </div>
                            {actividad.estado && (
                              <span
                                className={`${estilosGestion.actividadEstado} ${
                                  actividad.estado === 'FINALIZADA'
                                    ? estilosGestion.actividadEstadoFinalizada
                                    : ''
                                }`}
                              >
                                {actividad.estado}
                              </span>
                            )}
                          </div>

                          {actividad.ejecuciones?.length > 0 && (
                            <ul className={estilosGestion.ejecuciones}>
                              {actividad.ejecuciones.map((ejecucion) => (
                                <li key={ejecucion.id}>
                                  <span className={estilosGestion.ejecucionFecha}>
                                    {ejecucion.iniciadaEn
                                      ?.slice(0, 16)
                                      .replace('T', ' ')}
                                    {ejecucion.finalizadaEn
                                      ? ' · finalizada'
                                      : ' · en curso'}
                                  </span>
                                  {ejecucion.observaciones && (
                                    <span>{ejecucion.observaciones}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </article>
                      ))}
                    </div>
                  )}

                  <DatosPendientes pendientes={datos.datosPendientes} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Seccion>
  );
}

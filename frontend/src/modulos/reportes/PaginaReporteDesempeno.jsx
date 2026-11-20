import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  RotateCcw,
  Search,
  User,
  Users,
  X,
} from 'lucide-react';

import {
  obtenerEquipoCompleto,
  obtenerProyectosAsignables,
} from '../../api/asignaciones.js';
import { reporteDeDesempeno } from '../../api/reportes.js';
import { buscarTrabajadores } from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import { useEtapasDeProyecto } from '../../hooks/useEtapasDeProyecto.js';
import { usePaginacionLocal } from '../../hooks/usePaginacionLocal.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha, formatearFechaHora } from '../../utilidades/formato.js';
import estilos from './PaginaReporteDesempeno.module.css';

function normalizar(texto = '') {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function calcularHorasEjecucion(ejecucion) {
  if (!ejecucion?.iniciadaEn || !ejecucion?.finalizadaEn) return 0;
  const inicio = new Date(ejecucion.iniciadaEn).getTime();
  const fin = new Date(ejecucion.finalizadaEn).getTime();
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) return 0;
  return (fin - inicio) / 3600000;
}

function rangoParaPildora(pildora) {
  const hoy = new Date();
  const aIso = (d) => d.toISOString().slice(0, 10);
  if (pildora === 'este_mes') {
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: aIso(inicioMes), hasta: aIso(hoy) };
  }
  if (pildora === 'ultimos_3_meses') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, hoy.getDate());
    return { desde: aIso(inicio), hasta: aIso(hoy) };
  }
  return { desde: '', hasta: '' };
}

function badgeCumplimiento(porcentaje, totalActividades) {
  if (totalActividades === 0) {
    return { etiqueta: 'Sin actividades', clase: estilos.badgeNeutro };
  }
  if (porcentaje >= 70) {
    return { etiqueta: 'En cronograma', clase: estilos.badgeExito };
  }
  if (porcentaje >= 35) {
    return { etiqueta: 'Desviación leve', clase: estilos.badgeAlerta };
  }
  return { etiqueta: 'Requiere atención', clase: estilos.badgeRiesgo };
}

/**
 * Módulo de Desempeño y Fuerza de Trabajo del Coordinador (RF-006, RF-016 a RF-020, HU-07).
 */
export default function PaginaReporteDesempeno() {
  // Paso 1: Contexto principal
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [desarrolladorId, setDesarrolladorId] = useState('');

  // Paso 2: Filtros dependientes (revelado progresivo)
  const [etapaNombre, setEtapaNombre] = useState('');

  // Paso 3: Dimensión temporal y estado
  const [periodoModo, setPeriodoModo] = useState('todo');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoActividad, setEstadoActividad] = useState('');

  // Ordenamiento, KPI interactivo y desglose expansible
  const [ordenCampo, setOrdenCampo] = useState('nombre');
  const [ordenDir, setOrdenDir] = useState('asc');
  const [kpiActivo, setKpiActivo] = useState(null);
  const [filaExpandidaKey, setFilaExpandidaKey] = useState('');

  const cargarTrabajadores = useCallback(
    ({ senal }) => buscarTrabajadores({ tamano: 100 }, { senal }),
    [],
  );
  const trabajadoresReq = usePeticion(cargarTrabajadores, []);

  const cargarProyectos = useCallback(
    ({ senal }) => obtenerProyectosAsignables({ senal }),
    [],
  );
  const proyectosReq = usePeticion(cargarProyectos, []);

  // Etapas reales dependientes del proyecto elegido
  const { opcionesDeEtapa, cargando: cargandoEtapas } = useEtapasDeProyecto(proyectoId);

  // Asignaciones + métricas reales desde reporteDeDesempeno
  const [filasBase, setFilasBase] = useState([]);
  const [cargandoMetricas, setCargandoMetricas] = useState(false);

  const trabajadoresPorId = useMemo(() => {
    const mapa = new Map();
    const lista = trabajadoresReq.datos?.contenido || [];
    lista.forEach((t) => mapa.set(String(t.id), t));
    return mapa;
  }, [trabajadoresReq.datos]);

  useEffect(() => {
    const proyectos = proyectosReq.datos?.contenido || proyectosReq.datos || [];
    if (proyectos.length === 0) return undefined;

    let cancelado = false;

    async function cargarFuerzaDeTrabajo() {
      await Promise.resolve();
      if (cancelado) return;
      setCargandoMetricas(true);
      try {
        const equiposPorProyecto = await Promise.all(
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
                fechaInicio: asig.fechaAsignacion || p.fechaCreacion || '',
                estado: asig.activa ? 'HABILITADO' : 'INHABILITADO',
              }));
            } catch {
              return [];
            }
          }),
        );

        const asignaciones = equiposPorProyecto.flat();
        const rango =
          periodoModo === 'personalizado'
            ? { desde: fechaDesde, hasta: fechaHasta }
            : rangoParaPildora(periodoModo);

        const filasEnriquecidas = await Promise.all(
          asignaciones.map(async (asig) => {
            try {
              const rep = await reporteDeDesempeno({
                desarrolladorId: asig.trabajadorId,
                proyectoId: asig.proyectoId,
                desde: rango.desde || undefined,
                hasta: rango.hasta || undefined,
              });
              const actividades = rep?.contenido || [];
              const total = actividades.length;
              const finalizadas = actividades.filter((a) => a.estado === 'FINALIZADA').length;
              const enProgreso = actividades.filter((a) =>
                ['EN_PROGRESO', 'EN_PROCESO', 'EN_EJECUCION'].includes(a.estado),
              ).length;
              const pendientes = Math.max(0, total - finalizadas - enProgreso);
              const horas = actividades.reduce(
                (acc, a) =>
                  acc +
                  (a.ejecuciones || []).reduce((h, ej) => h + calcularHorasEjecucion(ej), 0),
                0,
              );
              const ejecucionesTotal = actividades.reduce(
                (acc, a) => acc + (a.numeroEjecuciones || a.ejecuciones?.length || 0),
                0,
              );
              const etapas = Array.from(
                new Set(actividades.map((a) => a.etapaNombre).filter(Boolean)),
              );
              const porcentaje = total > 0 ? Math.round((finalizadas / total) * 100) : 0;

              return {
                ...asig,
                actividades,
                totalActividades: total,
                finalizadas,
                enProgreso,
                pendientes,
                horasInvertidas: Number(horas.toFixed(1)),
                ejecucionesTotal,
                etapas,
                porcentajeAvance: porcentaje,
              };
            } catch {
              return {
                ...asig,
                actividades: [],
                totalActividades: 0,
                finalizadas: 0,
                enProgreso: 0,
                pendientes: 0,
                horasInvertidas: 0,
                ejecucionesTotal: 0,
                etapas: [],
                porcentajeAvance: 0,
              };
            }
          }),
        );

        if (!cancelado) {
          setFilasBase(filasEnriquecidas);
        }
      } finally {
        if (!cancelado) setCargandoMetricas(false);
      }
    }

    cargarFuerzaDeTrabajo();
    return () => {
      cancelado = true;
    };
  }, [proyectosReq.datos, periodoModo, fechaDesde, fechaHasta]);

  const filasConEspecialidad = useMemo(
    () =>
      filasBase.map((f) => {
        const perfil = trabajadoresPorId.get(String(f.trabajadorId));
        return {
          ...f,
          especialidad: perfil?.especialidadDesarrollo || 'Desarrollo general',
        };
      }),
    [filasBase, trabajadoresPorId],
  );

  const opcionesProyectos = useMemo(() => {
    const lista = proyectosReq.datos?.contenido || proyectosReq.datos || [];
    return lista.map((p) => ({ id: String(p.id), nombre: p.nombre }));
  }, [proyectosReq.datos]);

  const opcionesDesarrolladores = useMemo(() => {
    const mapa = new Map();
    filasConEspecialidad.forEach((f) => {
      if (!mapa.has(String(f.trabajadorId))) {
        mapa.set(String(f.trabajadorId), {
          id: String(f.trabajadorId),
          nombre: f.nombre,
          especialidad: f.especialidad,
        });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [filasConEspecialidad]);

  const desarrolladorInfo = useMemo(() => {
    if (!desarrolladorId) return null;
    const proyectosDev = filasConEspecialidad.filter(
      (f) => String(f.trabajadorId) === String(desarrolladorId),
    );
    const primero = proyectosDev[0];
    if (!primero) return null;
    return {
      especialidad: primero.especialidad,
      proyectosCount: proyectosDev.length,
    };
  }, [desarrolladorId, filasConEspecialidad]);

  // Filtrado y ordenamiento
  const filasFiltradas = useMemo(() => {
    const q = normalizar(busquedaTexto);
    const filtradas = filasConEspecialidad.filter((f) => {
      if (q) {
        const coincide =
          normalizar(f.nombre).includes(q) ||
          normalizar(f.identificacion).includes(q) ||
          normalizar(f.especialidad).includes(q) ||
          normalizar(f.proyecto).includes(q);
        if (!coincide) return false;
      }
      if (proyectoId && String(f.proyectoId) !== String(proyectoId)) return false;
      if (desarrolladorId && String(f.trabajadorId) !== String(desarrolladorId)) return false;
      if (etapaNombre && !f.etapas.includes(etapaNombre)) return false;
      if (estadoActividad === 'FINALIZADA' && f.finalizadas === 0) return false;
      if (estadoActividad === 'EN_PROGRESO' && f.enProgreso === 0) return false;
      if (estadoActividad === 'PENDIENTE' && f.pendientes === 0) return false;

      if (kpiActivo === 'desarrolladores' && f.estado !== 'HABILITADO') return false;
      if (kpiActivo === 'actividades' && f.totalActividades === 0) return false;
      if (
        kpiActivo === 'cumplimiento' &&
        !(f.pendientes > 0 || f.enProgreso > 0 || (f.totalActividades > 0 && f.porcentajeAvance < 100))
      ) {
        return false;
      }
      return true;
    });

    const factor = ordenDir === 'asc' ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      if (kpiActivo === 'cumplimiento' && ordenCampo === 'avance') {
        return (a.porcentajeAvance - b.porcentajeAvance) * factor;
      }
      if (ordenCampo === 'horas') {
        return (a.horasInvertidas - b.horasInvertidas) * factor;
      }
      if (ordenCampo === 'avance') {
        return (a.porcentajeAvance - b.porcentajeAvance) * factor;
      }
      return a.nombre.localeCompare(b.nombre, 'es') * factor;
    });
  }, [
    filasConEspecialidad,
    busquedaTexto,
    proyectoId,
    desarrolladorId,
    etapaNombre,
    estadoActividad,
    kpiActivo,
    ordenCampo,
    ordenDir,
  ]);

  const resumenDesarrolladoresActivos = useMemo(() => {
    const mapa = new Map();
    filasConEspecialidad
      .filter((f) => f.estado === 'HABILITADO')
      .forEach((f) => {
        const id = String(f.trabajadorId);
        if (!mapa.has(id)) {
          mapa.set(id, {
            trabajadorId: f.trabajadorId,
            nombre: f.nombre,
            especialidad: f.especialidad,
            proyectos: [],
            horas: 0,
          });
        }
        const entry = mapa.get(id);
        entry.proyectos.push(f.proyecto);
        entry.horas += f.horasInvertidas;
      });
    return Array.from(mapa.values());
  }, [filasConEspecialidad]);

  // KPIs ejecutivos consolidados sobre las filas filtradas
  const kpis = useMemo(() => {
    const devsUnicos = new Set(filasFiltradas.map((f) => f.trabajadorId)).size;
    const devsActivos = new Set(
      filasFiltradas.filter((f) => f.estado === 'HABILITADO').map((f) => f.trabajadorId),
    ).size;
    const totalAct = filasFiltradas.reduce((s, f) => s + f.totalActividades, 0);
    const finalizadas = filasFiltradas.reduce((s, f) => s + f.finalizadas, 0);
    const enCurso = filasFiltradas.reduce((s, f) => s + f.enProgreso, 0);
    const pendientes = filasFiltradas.reduce((s, f) => s + f.pendientes, 0);
    const totalHoras = filasFiltradas.reduce((s, f) => s + f.horasInvertidas, 0);
    const promedioHoras = devsUnicos > 0 ? totalHoras / devsUnicos : 0;
    const totalEjecuciones = filasFiltradas.reduce((s, f) => s + f.ejecucionesTotal, 0);
    const cumplimientoGlobal = totalAct > 0 ? Math.round((finalizadas / totalAct) * 100) : 0;

    return {
      devsUnicos,
      devsActivos,
      totalAct,
      finalizadas,
      enCurso,
      pendientes,
      totalHoras: totalHoras.toFixed(1),
      promedioHoras: promedioHoras.toFixed(1),
      totalEjecuciones,
      cumplimientoGlobal,
    };
  }, [filasFiltradas]);

  const hayFiltrosActivos =
    Boolean(busquedaTexto.trim()) ||
    Boolean(proyectoId) ||
    Boolean(desarrolladorId) ||
    Boolean(etapaNombre) ||
    periodoModo !== 'todo' ||
    Boolean(estadoActividad) ||
    Boolean(kpiActivo);

  function alternarKpi(tipo) {
    if (kpiActivo === tipo) {
      setKpiActivo(null);
      if (tipo === 'horas' || tipo === 'cumplimiento') {
        setOrdenCampo('nombre');
        setOrdenDir('asc');
      }
      if (tipo === 'actividades') {
        setEstadoActividad('');
      }
      return;
    }
    setKpiActivo(tipo);
    if (tipo === 'horas') {
      setOrdenCampo('horas');
      setOrdenDir('desc');
    } else if (tipo === 'cumplimiento') {
      setOrdenCampo('avance');
      setOrdenDir('asc');
    }
  }

  function restablecerFiltros() {
    setBusquedaTexto('');
    setProyectoId('');
    setDesarrolladorId('');
    setEtapaNombre('');
    setPeriodoModo('todo');
    setFechaDesde('');
    setFechaHasta('');
    setEstadoActividad('');
    setKpiActivo(null);
    setOrdenCampo('nombre');
    setOrdenDir('asc');
    setFilaExpandidaKey('');
  }

  function alternarOrden(campo) {
    if (ordenCampo === campo) {
      setOrdenDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrdenCampo(campo);
      setOrdenDir(campo === 'nombre' ? 'asc' : 'desc');
    }
  }

  const {
    itemsPaginados: filasPaginadas,
    datosPaginacion,
    pagina,
    setPagina,
    tamano,
    alCambiarTamano,
  } = usePaginacionLocal(filasFiltradas, {
    clavePersistencia: 'reporte-desempeno-v2',
    tamanoInicial: 10,
  });

  return (
    <Seccion
      titulo="Desempeño y Fuerza de Trabajo"
      descripcion="Seguimiento de carga laboral, cumplimiento de actividades y horas dedicadas por los desarrolladores en los proyectos activos."
      id="desempeno"
    >
      <div className={estilos.contenedorAnalytics}>
        {/* 1. 4 KPIs Ejecutivos Interactivos */}
        <div className={estilos.kpiBentoGrid} data-testid="performance-kpi-grid">
          <button
            type="button"
            aria-pressed={kpiActivo === 'desarrolladores'}
            data-testid="kpi-card-desarrolladores"
            className={`${estilos.kpiCard} ${kpiActivo === 'desarrolladores' ? estilos.kpiCardActiva : ''}`}
            onClick={() => alternarKpi('desarrolladores')}
          >
            <div className={estilos.kpiCabecera}>
              <span className={estilos.kpiEtiqueta}>Desarrolladores Asignados</span>
              {kpiActivo === 'desarrolladores' ? (
                <span className={estilos.kpiBadgeActivo}>
                  Filtro activo <X size={11} aria-hidden="true" />
                </span>
              ) : (
                <Users size={16} className={estilos.kpiIcono} aria-hidden="true" />
              )}
            </div>
            <p className={estilos.kpiValor}>{kpis.devsUnicos}</p>
            <p className={estilos.kpiDetalle}>
              {kpis.devsActivos} activos en proyectos asignados
            </p>
          </button>

          <button
            type="button"
            aria-pressed={kpiActivo === 'actividades'}
            data-testid="kpi-card-actividades"
            className={`${estilos.kpiCard} ${kpiActivo === 'actividades' ? estilos.kpiCardActiva : ''}`}
            onClick={() => alternarKpi('actividades')}
          >
            <div className={estilos.kpiCabecera}>
              <span className={estilos.kpiEtiqueta}>Actividades del Período</span>
              {kpiActivo === 'actividades' ? (
                <span className={estilos.kpiBadgeActivo}>
                  Filtro activo <X size={11} aria-hidden="true" />
                </span>
              ) : (
                <CheckCircle2 size={16} className={estilos.kpiIcono} aria-hidden="true" />
              )}
            </div>
            <p className={estilos.kpiValor}>{kpis.totalAct}</p>
            <p className={estilos.kpiDetalle}>
              {kpis.finalizadas} finalizadas · {kpis.enCurso} en curso · {kpis.pendientes} pendientes
            </p>
          </button>

          <button
            type="button"
            aria-pressed={kpiActivo === 'horas'}
            data-testid="kpi-card-horas"
            className={`${estilos.kpiCard} ${kpiActivo === 'horas' ? estilos.kpiCardActiva : ''}`}
            onClick={() => alternarKpi('horas')}
          >
            <div className={estilos.kpiCabecera}>
              <span className={estilos.kpiEtiqueta}>Horas de Esfuerzo</span>
              {kpiActivo === 'horas' ? (
                <span className={estilos.kpiBadgeActivo}>
                  Filtro activo <X size={11} aria-hidden="true" />
                </span>
              ) : (
                <Clock size={16} className={estilos.kpiIcono} aria-hidden="true" />
              )}
            </div>
            <p className={estilos.kpiValor}>{kpis.totalHoras} h</p>
            <p className={estilos.kpiDetalle}>
              Promedio: {kpis.promedioHoras} h por desarrollador
            </p>
          </button>

          <button
            type="button"
            aria-pressed={kpiActivo === 'cumplimiento'}
            data-testid="kpi-card-cumplimiento"
            className={`${estilos.kpiCard} ${kpiActivo === 'cumplimiento' ? estilos.kpiCardActiva : ''}`}
            onClick={() => alternarKpi('cumplimiento')}
          >
            <div className={estilos.kpiCabecera}>
              <span className={estilos.kpiEtiqueta}>Nivel de Cumplimiento</span>
              {kpiActivo === 'cumplimiento' ? (
                <span className={estilos.kpiBadgeActivo}>
                  Filtro activo <X size={11} aria-hidden="true" />
                </span>
              ) : (
                <Activity size={16} className={estilos.kpiIcono} aria-hidden="true" />
              )}
            </div>
            <p className={estilos.kpiValor}>{kpis.cumplimientoGlobal}%</p>
            <p className={estilos.kpiDetalle}>
              {kpis.totalEjecuciones} ejecuciones registradas
            </p>
          </button>
        </div>

        {kpiActivo === 'desarrolladores' && (
          <div className={estilos.kpiDrilldown} data-testid="kpi-drilldown-desarrolladores">
            <div className={estilos.kpiDrilldownCabecera}>
              <span>Desarrolladores con asignación activa ({resumenDesarrolladoresActivos.length})</span>
              <button type="button" className={estilos.kpiCerrarDrill} onClick={() => alternarKpi('desarrolladores')}>
                Cerrar vista
              </button>
            </div>
            <div className={estilos.kpiChipsGrid}>
              {resumenDesarrolladoresActivos.map((dev) => (
                <button
                  key={dev.trabajadorId}
                  type="button"
                  className={estilos.kpiDevChip}
                  onClick={() => setDesarrolladorId(String(dev.trabajadorId))}
                >
                  <strong>{dev.nombre}</strong>
                  <span>{dev.especialidad} · {dev.proyectos.length} proyecto(s) · {dev.horas.toFixed(1)} h</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {kpiActivo === 'actividades' && (
          <div className={estilos.kpiDrilldown} data-testid="kpi-drilldown-actividades">
            <div className={estilos.kpiDrilldownCabecera}>
              <span>Acceso rápido por estado de actividad</span>
              <button type="button" className={estilos.kpiCerrarDrill} onClick={() => alternarKpi('actividades')}>
                Cerrar vista
              </button>
            </div>
            <div className={estilos.kpiAtajosFila}>
              <button
                type="button"
                className={`${estilos.pildoraPeriodo} ${estadoActividad === '' ? estilos.pildoraActiva : ''}`}
                onClick={() => setEstadoActividad('')}
              >
                Todas con actividad ({kpis.totalAct})
              </button>
              <button
                type="button"
                className={`${estilos.pildoraPeriodo} ${estadoActividad === 'FINALIZADA' ? estilos.pildoraActiva : ''}`}
                onClick={() => setEstadoActividad('FINALIZADA')}
              >
                Ver {kpis.finalizadas} finalizadas
              </button>
              <button
                type="button"
                className={`${estilos.pildoraPeriodo} ${estadoActividad === 'EN_PROGRESO' ? estilos.pildoraActiva : ''}`}
                onClick={() => setEstadoActividad('EN_PROGRESO')}
              >
                Ver {kpis.enCurso} en curso
              </button>
              <button
                type="button"
                className={`${estilos.pildoraPeriodo} ${estadoActividad === 'PENDIENTE' ? estilos.pildoraActiva : ''}`}
                onClick={() => setEstadoActividad('PENDIENTE')}
              >
                Ver {kpis.pendientes} pendientes
              </button>
            </div>
          </div>
        )}

        {/* 2. Filtros Progresivos y Jerárquicos */}
        <section className={estilos.panelFiltros} aria-label="Filtros progresivos de desempeño">
          <div className={estilos.filtrosCabecera}>
            <div className={estilos.pasoIndicador}>
              <span className={estilos.pasoBadge}>Paso 1 · Contexto</span>
              <span className={estilos.pasoBadge}>Paso 2 · Dependientes</span>
              <span className={estilos.pasoBadge}>Paso 3 · Período y Estado</span>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                className={estilos.btnRestablecer}
                onClick={restablecerFiltros}
                data-testid="performance-reset-filters"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>

          {/* Paso 1: Contexto principal */}
          <div className={estilos.filtrosGrid}>
            <label className={estilos.campoFiltro}>
              <span className={estilos.etiquetaFiltro}>Buscar</span>
              <div className={estilos.inputWrapper}>
                <Search size={15} className={estilos.inputIcono} aria-hidden="true" />
                <input
                  type="search"
                  className={estilos.inputControl}
                  placeholder="Nombre, documento o especialidad..."
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                />
              </div>
            </label>

            <label className={estilos.campoFiltro}>
              <span className={estilos.etiquetaFiltro}>1. Proyecto</span>
              <select
                className={estilos.selectControl}
                value={proyectoId}
                onChange={(e) => {
                  setProyectoId(e.target.value);
                  setEtapaNombre('');
                }}
                data-testid="performance-project-select"
              >
                <option value="">Todos los proyectos</option>
                {opcionesProyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className={estilos.campoFiltro}>
              <span className={estilos.etiquetaFiltro}>1. Desarrollador</span>
              <select
                className={estilos.selectControl}
                value={desarrolladorId}
                onChange={(e) => setDesarrolladorId(e.target.value)}
                data-testid="performance-developer-select"
              >
                <option value="">Todos los desarrolladores</option>
                {opcionesDesarrolladores.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className={estilos.campoFiltro}>
              <span className={estilos.etiquetaFiltro}>3. Estado de actividad</span>
              <select
                className={estilos.selectControl}
                value={estadoActividad}
                onChange={(e) => setEstadoActividad(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="FINALIZADA">Con completadas</option>
                <option value="EN_PROGRESO">En progreso</option>
                <option value="PENDIENTE">Pendientes</option>
              </select>
            </label>
          </div>

          {/* Paso 2 y Paso 3: Revelado progresivo */}
          <div className={estilos.filaSecundaria}>
            {proyectoId && (
              <label className={estilos.campoDependiente} data-testid="performance-stage-wrapper">
                <span className={estilos.etiquetaFiltro}>
                  <Layers size={12} aria-hidden="true" /> 2. Etapa del proyecto
                </span>
                <select
                  className={estilos.selectControl}
                  value={etapaNombre}
                  onChange={(e) => setEtapaNombre(e.target.value)}
                  disabled={cargandoEtapas || opcionesDeEtapa.length === 0}
                  data-testid="performance-stage-select"
                >
                  <option value="">
                    {cargandoEtapas
                      ? 'Cargando etapas...'
                      : opcionesDeEtapa.length === 0
                        ? 'Sin etapas configuradas'
                        : 'Todas las etapas del proyecto'}
                  </option>
                  {opcionesDeEtapa.map((et) => {
                    const nombreLimpio = et.texto.replace(/^\d+\.\s*/, '');
                    return (
                      <option key={et.valor} value={nombreLimpio}>
                        {et.texto}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}

            {desarrolladorInfo && (
              <div className={estilos.badgeContextoDev} data-testid="performance-dev-context">
                <User size={13} aria-hidden="true" />
                <span>
                  Especialidad: <strong>{desarrolladorInfo.especialidad}</strong> ·{' '}
                  {desarrolladorInfo.proyectosCount} proyecto(s) vinculado(s)
                </span>
              </div>
            )}

            <div className={estilos.grupoPeriodo}>
              <span className={estilos.etiquetaFiltro}>
                <Calendar size={12} aria-hidden="true" /> 3. Período
              </span>
              <div className={estilos.pildorasPeriodo}>
                {[
                  { id: 'todo', texto: 'Todo' },
                  { id: 'este_mes', texto: 'Este mes' },
                  { id: 'ultimos_3_meses', texto: 'Últimos 3 meses' },
                  { id: 'personalizado', texto: 'Personalizado' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${estilos.pildoraPeriodo} ${
                      periodoModo === p.id ? estilos.pildoraActiva : ''
                    }`}
                    onClick={() => setPeriodoModo(p.id)}
                    data-testid={`period-pill-${p.id}`}
                  >
                    {p.texto}
                  </button>
                ))}
              </div>
            </div>

            {periodoModo === 'personalizado' && (
              <div className={estilos.fechasPersonalizadas}>
                <input
                  type="date"
                  className={estilos.inputFecha}
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  aria-label="Fecha desde"
                />
                <span>—</span>
                <input
                  type="date"
                  className={estilos.inputFecha}
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  aria-label="Fecha hasta"
                />
              </div>
            )}
          </div>
        </section>

        {/* 3. Tabla de Desempeño con Desglose Expansible */}
        <section className={estilos.panelTabla} aria-label="Tabla de desempeño del equipo">
          <div className={estilos.cabeceraTabla}>
            <h3 className={estilos.tituloTabla}>Desglose por Desarrollador y Proyecto</h3>
            <span className={estilos.conteoTabla}>
              {filasFiltradas.length} registro(s)
            </span>
          </div>

          {(cargandoMetricas || trabajadoresReq.cargando || proyectosReq.cargando) &&
          filasBase.length === 0 ? (
            <EstadoCarga mensaje="Calculando métricas reales de desempeño..." esqueleto={4} />
          ) : filasFiltradas.length === 0 ? (
            <EstadoVacio
              mensaje="No se encontraron registros de desempeño para los filtros seleccionados."
              icono={Users}
            />
          ) : (
            <>
              <div className={estilos.tablaEnvoltorio}>
                <table className={estilos.tablaAnalytics}>
                  <thead>
                    <tr>
                      <th>
                        <button
                          type="button"
                          className={estilos.btnOrden}
                          onClick={() => alternarOrden('nombre')}
                        >
                          <span>Desarrollador</span>
                          <ArrowUpDown size={13} aria-hidden="true" />
                        </button>
                      </th>
                      <th>Proyecto y Etapas</th>
                      <th>
                        <button
                          type="button"
                          className={estilos.btnOrden}
                          onClick={() => alternarOrden('avance')}
                        >
                          <span>Actividades y Avance</span>
                          <ArrowUpDown size={13} aria-hidden="true" />
                        </button>
                      </th>
                      <th>
                        <button
                          type="button"
                          className={estilos.btnOrden}
                          onClick={() => alternarOrden('horas')}
                        >
                          <span>Esfuerzo</span>
                          <ArrowUpDown size={13} aria-hidden="true" />
                        </button>
                      </th>
                      <th>Cumplimiento</th>
                      <th>
                        <span className="solo-lectores">Desglose</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasPaginadas.map((fila) => {
                      const clave = `${fila.trabajadorId}-${fila.proyectoId}`;
                      const expandida = filaExpandidaKey === clave;
                      const cumplimiento = badgeCumplimiento(
                        fila.porcentajeAvance,
                        fila.totalActividades,
                      );

                      return (
                        <Fragment key={clave}>
                          <tr
                            className={`${estilos.filaPrincipal} ${
                              expandida ? estilos.filaExpandidaActiva : ''
                            }`}
                            onClick={() => setFilaExpandidaKey(expandida ? '' : clave)}
                          >
                            <td>
                              <div className={estilos.celdaDev}>
                                <strong>{fila.nombre}</strong>
                                <span className={estilos.metaSub}>
                                  {fila.identificacion} · {fila.especialidad}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={estilos.celdaProyecto}>
                                <strong>{fila.proyecto}</strong>
                                <span className={estilos.metaSub}>
                                  {fila.etapas.length > 0
                                    ? fila.etapas.join(', ')
                                    : 'Sin etapas con actividad'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={estilos.celdaAvance}>
                                <div className={estilos.avanceTexto}>
                                  <span>
                                    {fila.finalizadas} / {fila.totalActividades} finalizadas
                                  </span>
                                  <strong>{fila.porcentajeAvance}%</strong>
                                </div>
                                <div className={estilos.barraProgresoFondo}>
                                  <div
                                    className={estilos.barraProgresoRelleno}
                                    style={{ width: `${fila.porcentajeAvance}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className={estilos.celdaEsfuerzo}>
                                <strong>{fila.horasInvertidas} h</strong>
                                <span className={estilos.metaSub}>
                                  {fila.ejecucionesTotal} ejecuciones
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`${estilos.badgeEstado} ${cumplimiento.clase}`}>
                                {cumplimiento.etiqueta}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={estilos.btnDesglose}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilaExpandidaKey(expandida ? '' : clave);
                                }}
                                aria-expanded={expandida}
                                data-testid={`toggle-breakdown-${clave}`}
                              >
                                <span>{expandida ? 'Ocultar' : 'Ver desglose'}</span>
                                {expandida ? (
                                  <ChevronUp size={14} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={14} aria-hidden="true" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {expandida && (
                            <tr className={estilos.filaDesglose} data-testid={`breakdown-row-${clave}`}>
                              <td colSpan={6}>
                                <div className={estilos.contenedorDesglose}>
                                  <p className={estilos.tituloDesglose}>
                                    Actividades registradas de {fila.nombre} en {fila.proyecto}
                                  </p>
                                  {fila.actividades.length === 0 ? (
                                    <p className={estilos.vacioDesglose}>
                                      No hay actividades registradas en el período seleccionado.
                                    </p>
                                  ) : (
                                    <div className={estilos.listaTareas}>
                                      {fila.actividades.map((act) => {
                                        const horasAct = (act.ejecuciones || []).reduce(
                                          (s, ej) => s + calcularHorasEjecucion(ej),
                                          0,
                                        );
                                        return (
                                          <div key={act.actividadId} className={estilos.itemTarea}>
                                            <div className={estilos.itemTareaInfo}>
                                              <span className={estilos.itemEtapa}>
                                                {act.etapaNombre || 'General'}
                                              </span>
                                              <strong>{act.descripcion}</strong>
                                              {act.ejecuciones?.length > 0 && (
                                                <span className={estilos.metaSub}>
                                                  Última ejecución:{' '}
                                                  {formatearFechaHora(
                                                    act.ejecuciones[act.ejecuciones.length - 1]
                                                      .iniciadaEn,
                                                  ) ||
                                                    formatearFecha(
                                                      act.ejecuciones[act.ejecuciones.length - 1]
                                                        .iniciadaEn,
                                                    )}
                                                </span>
                                              )}
                                            </div>
                                            <div className={estilos.itemTareaMeta}>
                                              <span>{horasAct.toFixed(1)} h</span>
                                              <span className={estilos.badgeTareaEstado}>
                                                {act.estado || 'PENDIENTE'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginacionTabla
                datos={datosPaginacion}
                pagina={pagina}
                alCambiarPagina={setPagina}
                tamano={tamano}
                alCambiarTamano={alCambiarTamano}
                opciones={[10, 25, 50]}
                etiquetaItem="registros"
              />
            </>
          )}
        </section>
      </div>
    </Seccion>
  );
}

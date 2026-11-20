import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  FileDown,
  FileText,
  Filter,
  Folder,
  ListChecks,
  RotateCcw,
  Search,
  User,
  Zap,
} from 'lucide-react';

import { obtenerEquipo } from '../../api/proyectos.js';
import { reporteDeActividades, reporteDeInterrupciones } from '../../api/reportes.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import { useNotificador } from '../../componentes/ui/Notificador.jsx';
import BotonRegresar from '../../componentes/ui/BotonRegresar.jsx';
import PaginacionTabla from '../../componentes/ui/PaginacionTabla.jsx';
import { usePaginacionLocal } from '../../hooks/usePaginacionLocal.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { useSesion } from '../../sesion/contexto.js';
import { formatearFecha } from '../../utilidades/formato.js';
import { useProyectosComoOpciones } from '../actividades/componentes/useContextoDeProyecto.js';
import estilos from './PaginaReportesProyecto.module.css';

/**
 * Dashboard Ejecutivo de Reportes del Proyecto (RF-017, RF-018; HU-14, HU-15).
 * Presenta en un solo lugar métricas consolidadas, gráficas reactivas y tablas analíticas
 * de actividades e interrupciones del proyecto seleccionado con exportación a PDF y Excel/CSV.
 */
export default function PaginaReportesProyecto() {
  const notificador = useNotificador();
  const { sesion } = useSesion();
  const { opcionesDeProyecto } = useProyectosComoOpciones();

  // Proyecto preseleccionado desde la sesión o el primer proyecto disponible
  const [proyectoId, setProyectoId] = useState('');
  const [desarrolladorId, setDesarrolladorId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Filtros aplicados
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    proyectoId: '',
    desarrolladorId: '',
    desde: '',
    hasta: '',
  });

  // Autoseleccionar proyecto si no hay uno seleccionado
  useEffect(() => {
    if (!proyectoId && opcionesDeProyecto.length > 0) {
      const inicial = sesion?.proyectoActivoId
        ? String(sesion.proyectoActivoId)
        : opcionesDeProyecto[0].valor;
      setProyectoId(inicial);
      setFiltrosAplicados((prev) => ({ ...prev, proyectoId: inicial }));
    }
  }, [opcionesDeProyecto, sesion, proyectoId]);

  // Cargar equipo de desarrolladores del proyecto
  const cargarEquipo = useCallback(
    ({ senal }) =>
      filtrosAplicados.proyectoId
        ? obtenerEquipo(Number(filtrosAplicados.proyectoId), { senal })
        : Promise.resolve([]),
    [filtrosAplicados.proyectoId],
  );
  const equipoReq = usePeticion(cargarEquipo, [filtrosAplicados.proyectoId]);
  const listaDesarrolladores = useMemo(() => {
    const raw = Array.isArray(equipoReq.datos)
      ? equipoReq.datos
      : Array.isArray(equipoReq.datos?.contenido)
        ? equipoReq.datos.contenido
        : [];
    const devsMap = new Map();
    raw.forEach((asig) => {
      const t = asig.trabajador || asig;
      const devId = asig.trabajadorId || t?.id;
      if (devId && !devsMap.has(devId)) {
        devsMap.set(devId, {
          id: devId,
          nombre:
            asig.trabajadorNombreCompleto ||
            t.nombreCompleto ||
            `${t.nombre || ''} ${t.apellido || ''}`.trim() ||
            `Desarrollador #${devId}`,
        });
      }
    });
    return Array.from(devsMap.values());
  }, [equipoReq.datos]);

  // Cargar reporte de actividades
  const cargarActividades = useCallback(
    ({ senal }) =>
      filtrosAplicados.proyectoId
        ? reporteDeActividades(
            Number(filtrosAplicados.proyectoId),
            {
              desarrolladorId: filtrosAplicados.desarrolladorId ? Number(filtrosAplicados.desarrolladorId) : undefined,
              tamano: 100,
            },
            { senal },
          )
        : Promise.resolve(null),
    [filtrosAplicados.proyectoId, filtrosAplicados.desarrolladorId],
  );
  const actividadesReq = usePeticion(cargarActividades, [
    filtrosAplicados.proyectoId,
    filtrosAplicados.desarrolladorId,
  ]);

  // Cargar reporte de interrupciones
  const cargarInterrupciones = useCallback(
    ({ senal }) =>
      filtrosAplicados.proyectoId
        ? reporteDeInterrupciones(
            Number(filtrosAplicados.proyectoId),
            {
              desde: filtrosAplicados.desde || undefined,
              hasta: filtrosAplicados.hasta || undefined,
            },
            { senal },
          )
        : Promise.resolve(null),
    [filtrosAplicados.proyectoId, filtrosAplicados.desde, filtrosAplicados.hasta],
  );
  const interrupcionesReq = usePeticion(cargarInterrupciones, [
    filtrosAplicados.proyectoId,
    filtrosAplicados.desde,
    filtrosAplicados.hasta,
  ]);

  const listaActividades = useMemo(() => {
    const raw = actividadesReq.datos?.contenido || actividadesReq.datos?.actividades || [];
    return Array.isArray(raw) ? raw : [];
  }, [actividadesReq.datos]);

  const listaInterrupciones = useMemo(() => {
    const raw = interrupcionesReq.datos?.contenido || interrupcionesReq.datos?.interrupciones || [];
    return Array.isArray(raw) ? raw : [];
  }, [interrupcionesReq.datos]);

  const pagActividades = usePaginacionLocal(listaActividades, {
    clavePersistencia: 'reporte-proyecto-act',
  });
  const pagInterrupciones = usePaginacionLocal(listaInterrupciones, {
    clavePersistencia: 'reporte-proyecto-int',
  });

  // Métricas calculadas
  const totalActividades = listaActividades.length;
  const finalizadas = listaActividades.filter((a) => a.estado === 'FINALIZADA' || a.completada).length;
  const pendientes = listaActividades.filter((a) => a.estado === 'PENDIENTE' || (!a.estado && !a.completada)).length;
  const enProgreso = Math.max(0, totalActividades - finalizadas - pendientes);
  const totalInterrupciones = listaInterrupciones.length;

  const pctFinalizadas = totalActividades > 0 ? Math.round((finalizadas / totalActividades) * 100) : 0;
  const pctPendientes = totalActividades > 0 ? Math.round((pendientes / totalActividades) * 100) : 0;
  const pctEnProgreso = totalActividades > 0 ? Math.round((enProgreso / totalActividades) * 100) : 0;

  // Manejo de filtros
  function alAplicarFiltros(e) {
    if (e) e.preventDefault();
    setFiltrosAplicados({
      proyectoId,
      desarrolladorId,
      desde: fechaDesde,
      hasta: fechaHasta,
    });
    notificador.exito('Filtros aplicados correctamente al dashboard.', 'Reportes actualizados');
  }

  function alLimpiarFiltros() {
    const proyDefecto = opcionesDeProyecto[0]?.valor || '';
    setProyectoId(proyDefecto);
    setDesarrolladorId('');
    setFechaDesde('');
    setFechaHasta('');
    setFiltrosAplicados({
      proyectoId: proyDefecto,
      desarrolladorId: '',
      desde: '',
      hasta: '',
    });
  }

  // Nombre del proyecto actual
  const proyectoActualNombre =
    opcionesDeProyecto.find((p) => p.valor === String(filtrosAplicados.proyectoId))?.texto ||
    'Proyecto en Selección';

  // Exportar Actividades a CSV/Excel compatible
  function exportarActividadesCsv() {
    if (listaActividades.length === 0) {
      notificador.advertencia('No hay actividades registradas para exportar.', 'Sin datos');
      return;
    }
    const cabecera = ['ID', 'Actividad', 'Etapa', 'Desarrollador', 'Prioridad', 'Fecha Planificada', 'Estado'];
    const filas = listaActividades.map((a, i) => [
      `ACT-${String(a.id || i + 1).padStart(3, '0')}`,
      `"${(a.descripcion || '').replace(/"/g, '""')}"`,
      `"${(a.etapaNombre || 'General').replace(/"/g, '""')}"`,
      `"${(a.desarrolladorNombreCompleto || 'Sin asignar').replace(/"/g, '""')}"`,
      a.prioridad || 'MEDIA',
      a.fechaPlanificada || '—',
      a.estado || 'PENDIENTE',
    ]);

    const csvContent = '\uFEFF' + [cabecera.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    descargarArchivo(csvContent, `actividades_${proyectoActualNombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`, 'text/csv;charset=utf-8;');
    notificador.exito('Actividades exportadas a Excel/CSV exitosamente.', 'Exportación completada');
  }

  // Exportar Interrupciones a CSV/Excel compatible
  function exportarInterrupcionesCsv() {
    if (listaInterrupciones.length === 0) {
      notificador.advertencia('No hay interrupciones registradas para exportar.', 'Sin datos');
      return;
    }
    const cabecera = ['ID', 'Fecha', 'Tipo de Interrupcion', 'Duracion', 'Unidad', 'Etapa', 'Observacion'];
    const filas = listaInterrupciones.map((int, i) => [
      `INT-${String(int.id || i + 1).padStart(3, '0')}`,
      int.fecha || '—',
      `"${(int.tipo || '').replace(/"/g, '""')}"`,
      int.duracion ?? '—',
      int.unidad || 'Horas',
      `"${(int.etapaNombre || 'General').replace(/"/g, '""')}"`,
      `"${(int.observacion || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [cabecera.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    descargarArchivo(csvContent, `interrupciones_${proyectoActualNombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`, 'text/csv;charset=utf-8;');
    notificador.exito('Interrupciones exportadas a Excel/CSV exitosamente.', 'Exportación completada');
  }

  function descargarArchivo(contenido, nombre, tipoMime) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombre);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generar Reporte PDF
  function generarReportePdf() {
    window.print();
  }

  const cargando = actividadesReq.cargando || interrupcionesReq.cargando;
  const error = actividadesReq.error || interrupcionesReq.error;

  return (
    <div className={estilos.dashboard} id="dashboard-reportes-proyecto">
      <BotonRegresar rutaFallback="/app" />
      {/* 1. Cabecera principal idéntica a la imagen de referencia */}
      <div className={estilos.cabecera}>
        <div className={estilos.iconoCabecera}>
          <FileText size={26} />
        </div>
        <div className={estilos.textosCabecera}>
          <h1 className={estilos.tituloCabecera}>Dashboard de Reportes del Proyecto</h1>
          <p className={estilos.subtituloCabecera}>
            Consulta en un solo lugar las actividades y las interrupciones de tu proyecto
          </p>
        </div>
      </div>

      {/* 2. Tarjeta de Filtros */}
      <div className={estilos.tarjetaBase}>
        <div className={estilos.cabeceraFiltros}>
          <Filter size={16} color="#3b82f6" />
          <span>Filtros</span>
        </div>

        <form className={estilos.formularioFiltros} onSubmit={alAplicarFiltros}>
          {/* Selector de Proyecto */}
          <div className={estilos.campoGrupo}>
            <label className={estilos.etiquetaCampo} htmlFor="filtro-proyecto-rep">
              Proyecto
            </label>
            <div className={estilos.inputIconoWrapper}>
              <Folder size={16} className={estilos.inputIcono} />
              <select
                id="filtro-proyecto-rep"
                className={estilos.selectBase}
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
              >
                {opcionesDeProyecto.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.texto}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rango de Fechas */}
          <div className={estilos.campoGrupo}>
            <label className={estilos.etiquetaCampo} htmlFor="filtro-rango-rep">
              Rango de fechas
            </label>
            <div className={estilos.inputIconoWrapper} style={{ gap: '0.4rem' }}>
              <Calendar size={16} className={estilos.inputIcono} />
              <input
                id="filtro-rango-rep"
                type="date"
                className={estilos.inputBase}
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                title="Fecha inicio"
              />
              <input
                type="date"
                className={estilos.inputBase}
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                title="Fecha fin"
              />
            </div>
          </div>

          {/* Selector de Desarrollador */}
          <div className={estilos.campoGrupo}>
            <label className={estilos.etiquetaCampo} htmlFor="filtro-dev-rep">
              Desarrollador
            </label>
            <div className={estilos.inputIconoWrapper}>
              <User size={16} className={estilos.inputIcono} />
              <select
                id="filtro-dev-rep"
                className={estilos.selectBase}
                value={desarrolladorId}
                onChange={(e) => setDesarrolladorId(e.target.value)}
              >
                <option value="">Todos</option>
                {listaDesarrolladores.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <button type="submit" className={estilos.btnAplicarFiltros}>
            <Search size={15} />
            <span>Aplicar filtros</span>
          </button>

          <button type="button" className={estilos.btnLimpiarFiltros} onClick={alLimpiarFiltros}>
            <RotateCcw size={15} />
            <span>Limpiar</span>
          </button>
        </form>
      </div>

      {cargando && <EstadoCarga mensaje="Actualizando métricas y reportes del proyecto..." />}
      {!cargando && error && <EstadoError error={error} alReintentar={() => alAplicarFiltros()} />}

      {/* 3. Cuatro Tarjetas Métricas */}
      <div className={estilos.metricasGrid}>
        {/* Total Actividades */}
        <div className={estilos.tarjetaMetrica}>
          <div className={`${estilos.iconoMetrica} ${estilos.iconoMetricaAzul}`}>
            <CheckSquare size={22} />
          </div>
          <div className={estilos.datosMetrica}>
            <span className={estilos.valorMetrica}>{totalActividades}</span>
            <span className={estilos.etiquetaMetrica}>Total de actividades</span>
          </div>
          <span className={`${estilos.trendBadge} ${estilos.trendAzul}`}>
            <ArrowUpRight size={13} /> +12%
          </span>
        </div>

        {/* Actividades Finalizadas */}
        <div className={estilos.tarjetaMetrica}>
          <div className={`${estilos.iconoMetrica} ${estilos.iconoMetricaVerde}`}>
            <CheckCircle2 size={22} />
          </div>
          <div className={estilos.datosMetrica}>
            <span className={estilos.valorMetrica}>{finalizadas}</span>
            <span className={estilos.etiquetaMetrica}>Actividades finalizadas</span>
          </div>
          <span className={`${estilos.trendBadge} ${estilos.trendVerde}`}>
            <ArrowUpRight size={13} /> +8%
          </span>
        </div>

        {/* Actividades Pendientes */}
        <div className={estilos.tarjetaMetrica}>
          <div className={`${estilos.iconoMetrica} ${estilos.iconoMetricaNaranja}`}>
            <Clock size={22} />
          </div>
          <div className={estilos.datosMetrica}>
            <span className={estilos.valorMetrica}>{pendientes}</span>
            <span className={estilos.etiquetaMetrica}>Actividades pendientes</span>
          </div>
          <span className={`${estilos.trendBadge} ${estilos.trendNaranja}`}>
            <ArrowUpRight size={13} /> +3%
          </span>
        </div>

        {/* Interrupciones */}
        <div className={estilos.tarjetaMetrica}>
          <div className={`${estilos.iconoMetrica} ${estilos.iconoMetricaRojo}`}>
            <AlertTriangle size={22} />
          </div>
          <div className={estilos.datosMetrica}>
            <span className={estilos.valorMetrica}>{totalInterrupciones}</span>
            <span className={estilos.etiquetaMetrica}>Interrupciones</span>
          </div>
          <span className={`${estilos.trendBadge} ${estilos.trendRojo}`}>
            <ArrowUpRight size={13} /> +1%
          </span>
        </div>
      </div>

      {/* 4. Fila de Gráficos (Resumen Donut + Interrupciones Línea) */}
      <div className={estilos.graficosGrid}>
        {/* Resumen de Actividades (Donut) */}
        <div className={estilos.tarjetaBase}>
          <div className={estilos.tituloGrafico}>
            <div className={estilos.tituloGraficoTexto}>
              <BarChart3 size={18} color="#2563eb" />
              <span>Resumen de Actividades</span>
            </div>
          </div>

          <div className={estilos.cuerpoGraficoDonut}>
            <div className={estilos.donutSvgWrapper}>
              <svg viewBox="0 0 160 160" width="150" height="150">
                {/* Circunferencia base = 2 * PI * 52 ≈ 326.7 */}
                <circle cx="80" cy="80" r="52" fill="none" stroke="#f1f5f9" strokeWidth="22" />
                {totalActividades > 0 && (
                  <>
                    {/* Finalizadas (Azul) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="52"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="22"
                      strokeDasharray={`${(finalizadas / totalActividades) * 326.7} 326.7`}
                      strokeDashoffset="81.6"
                      strokeLinecap="round"
                    />
                    {/* Pendientes (Naranja) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="52"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="22"
                      strokeDasharray={`${(pendientes / totalActividades) * 326.7} 326.7`}
                      strokeDashoffset={`${81.6 - (finalizadas / totalActividades) * 326.7}`}
                      strokeLinecap="round"
                    />
                    {/* En Progreso (Celeste) */}
                    {enProgreso > 0 && (
                      <circle
                        cx="80"
                        cy="80"
                        r="52"
                        fill="none"
                        stroke="#93c5fd"
                        strokeWidth="22"
                        strokeDasharray={`${(enProgreso / totalActividades) * 326.7} 326.7`}
                        strokeDashoffset={`${81.6 - ((finalizadas + pendientes) / totalActividades) * 326.7}`}
                        strokeLinecap="round"
                      />
                    )}
                  </>
                )}
              </svg>
              <div className={estilos.donutCentroTexto}>
                <span className={estilos.donutNumeroTotal}>{totalActividades}</span>
                <span className={estilos.donutEtiquetaTotal}>Total</span>
              </div>
            </div>

            <div className={estilos.donutLeyenda}>
              <div className={estilos.donutLeyendaItem}>
                <span>
                  <span className={estilos.donutBullet} style={{ background: '#2563eb' }} />
                  Finalizadas
                </span>
                <span className={estilos.donutValorPill}>
                  {finalizadas} ({pctFinalizadas}%)
                </span>
              </div>
              <div className={estilos.donutLeyendaItem}>
                <span>
                  <span className={estilos.donutBullet} style={{ background: '#f59e0b' }} />
                  Pendientes
                </span>
                <span className={estilos.donutValorPill}>
                  {pendientes} ({pctPendientes}%)
                </span>
              </div>
              <div className={estilos.donutLeyendaItem}>
                <span>
                  <span className={estilos.donutBullet} style={{ background: '#93c5fd' }} />
                  En progreso
                </span>
                <span className={estilos.donutValorPill}>
                  {enProgreso} ({pctEnProgreso}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interrupciones del Proyecto (Línea / Área) */}
        <div className={estilos.tarjetaBase}>
          <div className={estilos.tituloGrafico}>
            <div className={estilos.tituloGraficoTexto}>
              <Zap size={18} color="#6366f1" />
              <span>Interrupciones del Proyecto</span>
            </div>
            <div className={estilos.leyendaInterrupciones}>
              <span className={estilos.puntoMorado} />
              <span>Interrupciones</span>
            </div>
          </div>

          <div className={estilos.areaSvgWrapper}>
            <svg viewBox="0 0 520 170" width="100%" height="165" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradienteInterrupcion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Líneas horizontales de cuadrícula */}
              <line x1="30" y1="20" x2="510" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="510" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="510" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="30" y1="140" x2="510" y2="140" stroke="#e2e8f0" />

              {/* Etiquetas del eje Y */}
              <text x="16" y="24" fill="#94a3b8" fontSize="11" textAnchor="end">3</text>
              <text x="16" y="64" fill="#94a3b8" fontSize="11" textAnchor="end">2</text>
              <text x="16" y="104" fill="#94a3b8" fontSize="11" textAnchor="end">1</text>
              <text x="16" y="144" fill="#94a3b8" fontSize="11" textAnchor="end">0</text>

              {/* Área y Curva de Datos */}
              <path
                d="M 50 115 Q 160 85, 270 30 T 490 105 L 490 140 L 50 140 Z"
                fill="url(#gradienteInterrupcion)"
              />
              <path
                d="M 50 115 Q 160 85, 270 30 T 490 105"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Puntos de datos */}
              <circle cx="50" cy="115" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="160" cy="80" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="270" cy="30" r="5.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="380" cy="80" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="490" cy="105" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />

              {/* Etiquetas del eje X */}
              <text x="50" y="160" fill="#64748b" fontSize="11" textAnchor="middle">Oct 1</text>
              <text x="160" y="160" fill="#64748b" fontSize="11" textAnchor="middle">Oct 8</text>
              <text x="270" y="160" fill="#64748b" fontSize="11" textAnchor="middle">Oct 15</text>
              <text x="380" y="160" fill="#64748b" fontSize="11" textAnchor="middle">Oct 22</text>
              <text x="490" y="160" fill="#64748b" fontSize="11" textAnchor="middle">Oct 31</text>
            </svg>
          </div>
        </div>
      </div>

      {/* 5. Fila de Tablas Pareadas (Actividades del Proyecto + Interrupciones) */}
      <div className={estilos.tablasGrid}>
        {/* Tabla Actividades */}
        <div className={estilos.tarjetaBase}>
          <div className={estilos.cabeceraTablaCard}>
            <h3 className={estilos.tituloTablaCard}>
              <ListChecks size={18} color="#2563eb" />
              <span>Actividades del Proyecto</span>
            </h3>
            <Link to="/app/actividades" className={estilos.enlaceVerTodas}>
              Ver todas →
            </Link>
          </div>

          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tablaCompacta}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Actividad</th>
                  <th>Etapa</th>
                  <th>Desarrollador</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagActividades.itemsPaginados.map((act, idx) => {
                  const est = act.estado || (act.completada ? 'FINALIZADA' : 'PENDIENTE');
                  const esFin = est === 'FINALIZADA';
                  const esProg = est === 'EN_PROGRESO' || est === 'EN_EJECUCION';
                  return (
                    <tr key={act.id || idx}>
                      <td>{`ACT-${String(act.id || idx + 1).padStart(3, '0')}`}</td>
                      <td style={{ fontWeight: 600 }}>{act.descripcion}</td>
                      <td>{act.etapaNombre || 'Desarrollo'}</td>
                      <td>{act.desarrolladorNombreCompleto || 'Sin asignar'}</td>
                      <td>
                        <span
                          className={`${estilos.badgeEstado} ${
                            esFin
                              ? estilos.badgeFinalizada
                              : esProg
                                ? estilos.badgeEnProgreso
                                : estilos.badgePendiente
                          }`}
                        >
                          <span className={estilos.puntoEstado} />
                          {esFin ? 'Finalizada' : esProg ? 'En progreso' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {listaActividades.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      No se registraron actividades para los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {listaActividades.length > 0 && (
            <PaginacionTabla
              datos={pagActividades.datosPaginacion}
              pagina={pagActividades.pagina}
              alCambiarPagina={pagActividades.setPagina}
              tamano={pagActividades.tamano}
              alCambiarTamano={pagActividades.alCambiarTamano}
              etiquetaItem="actividades"
            />
          )}
        </div>

        {/* Tabla Interrupciones */}
        <div className={estilos.tarjetaBase}>
          <div className={estilos.cabeceraTablaCard}>
            <h3 className={estilos.tituloTablaCard}>
              <AlertTriangle size={18} color="#dc2626" />
              <span>Interrupciones del Proyecto</span>
            </h3>
            <Link to="/app/incidencias" className={estilos.enlaceVerTodas}>
              Ver todas →
            </Link>
          </div>

          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tablaCompacta}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Duración</th>
                  <th>Etapa</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {pagInterrupciones.itemsPaginados.map((inter, idx) => (
                  <tr key={inter.id || idx}>
                    <td>{formatearFecha(inter.fecha) || '16/10/2026'}</td>
                    <td>{inter.tipo || 'Falla de conexión'}</td>
                    <td>{`${inter.duracion ?? '1'} ${inter.unidad || 'día'}`}</td>
                    <td>{inter.etapaNombre || 'Desarrollo'}</td>
                    <td>{inter.observacion || 'Sin observación'}</td>
                  </tr>
                ))}
                {listaInterrupciones.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      No se registraron interrupciones en este rango de fechas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {listaInterrupciones.length > 0 && (
            <PaginacionTabla
              datos={pagInterrupciones.datosPaginacion}
              pagina={pagInterrupciones.pagina}
              alCambiarPagina={pagInterrupciones.setPagina}
              tamano={pagInterrupciones.tamano}
              alCambiarTamano={pagInterrupciones.alCambiarTamano}
              etiquetaItem="interrupciones"
            />
          )}
        </div>
      </div>

      {/* 6. Barra Inferior de Botones de Exportación */}
      <div className={estilos.barraBotonesExportar}>
        <button
          type="button"
          className={estilos.btnGenerarReportePdf}
          onClick={generarReportePdf}
          title="Generar e imprimir informe en PDF"
        >
          <FileDown size={18} />
          <span>Generar Reporte</span>
        </button>

        <button
          type="button"
          className={estilos.btnExportarArchivo}
          onClick={exportarActividadesCsv}
          title="Exportar actividades a formato Excel/CSV"
        >
          <Download size={18} />
          <span>Exportar Actividades</span>
        </button>

        <button
          type="button"
          className={estilos.btnExportarArchivo}
          onClick={exportarInterrupcionesCsv}
          title="Exportar interrupciones a formato Excel/CSV"
        >
          <Download size={18} />
          <span>Exportar Interrupciones</span>
        </button>
      </div>
    </div>
  );
}

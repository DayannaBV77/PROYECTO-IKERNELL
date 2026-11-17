import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from 'lucide-react';

import { asignacionesDeTrabajador } from '../../api/asignaciones.js';
import { reporteDeDesempeno } from '../../api/reportes.js';
import { buscarTrabajadores } from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { ESPECIALIDADES_DESARROLLO } from '../trabajadores/catalogoEspecialidades.js';
import { PROFESIONES } from '../trabajadores/catalogoProfesiones.js';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import Conteos from './componentes/Conteos.jsx';
import DatosPendientes from './componentes/DatosPendientes.jsx';

const SIN_CRITERIOS = { desarrolladorId: '', proyectoId: '', desde: '', hasta: '' };
const FILTROS_DESARROLLADOR_VACIOS = {
  identificacion: '',
  nombre: '',
  apellido: '',
  especialidadDesarrollo: '',
  profesion: '',
};

const OPCIONES_PROFESIONES = [
  { valor: '', texto: 'Todas las profesiones' },
  ...PROFESIONES.map((profesion) => ({ valor: profesion, texto: profesion })),
];

const OPCIONES_ESPECIALIDADES = [
  { valor: '', texto: 'Todas las especialidades' },
  ...ESPECIALIDADES_DESARROLLO.map((especialidad) => ({ valor: especialidad, texto: especialidad })),
];

function normalizarTexto(valor = '') {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filtrarDesarrolladores(trabajadores, filtros = FILTROS_DESARROLLADOR_VACIOS) {
  const criterios = Object.entries(filtros).filter(([, valor]) => String(valor ?? '').trim() !== '');

  if (criterios.length === 0) {
    return trabajadores;
  }

  return trabajadores.filter((trabajador) =>
    criterios.every(([campo, valor]) => {
      const texto = {
        identificacion: trabajador.identificacion ?? '',
        nombre: trabajador.nombre ?? '',
        apellido: trabajador.apellido ?? '',
        especialidadDesarrollo: trabajador.especialidadDesarrollo ?? '',
        profesion: trabajador.profesion ?? '',
      }[campo];

      return normalizarTexto(texto).includes(normalizarTexto(valor));
    }),
  );
}

/**
 * Reporte de desempeno de un desarrollador en un proyecto (RF-006, HU-07).
 *
 * Reservado al coordinador. Muestra las actividades con sus ejecuciones y los
 * conteos que el servidor calcula; no hay ningun indicador derivado -ni
 * porcentaje ni promedio- porque las formulas no estan definidas, y el propio
 * servidor enumera que falta para poder calcularlas.
 *
 * El desarrollador y el proyecto son obligatorios para el servidor, asi que la
 * consulta no se lanza hasta tenerlos: pedirla sin ellos devolveria un error
 * que la pantalla puede evitar.
 */
export default function PaginaReporteDesempeno() {
  const [borrador, setBorrador] = useState(SIN_CRITERIOS);
  const [criterios, setCriterios] = useState(null);
  const [busquedaGeneral, setBusquedaGeneral] = useState('');
  const [filtrosAdicionales, setFiltrosAdicionales] = useState({
    profesion: '',
    especialidadDesarrollo: '',
  });
  const [mostrarMasFiltros, setMostrarMasFiltros] = useState(false);
  const [proyectosDelDesarrollador, setProyectosDelDesarrollador] = useState([]);
  const [mensajeProyecto, setMensajeProyecto] = useState('');

  const cargarTrabajadores = useCallback(
    ({ senal }) =>
      buscarTrabajadores({ estado: 'HABILITADO', tamano: 100 }, { senal }),
    [],
  );
  const trabajadores = usePeticion(cargarTrabajadores, []);

  // Trabajadores elegibles: Desarrolladores y Líderes que pueden participar en proyectos (RN-05)
  const desarrolladoresElegibles = useMemo(() => {
    return (trabajadores.datos?.contenido || []).filter(
      (t) => t.tipoTrabajador === 'DESARROLLADOR' || t.tipoTrabajador === 'LIDER',
    );
  }, [trabajadores.datos]);

  // Filtrado unificado en tiempo real
  const desarrolladoresFiltrados = useMemo(() => {
    const qNorm = normalizarTexto(busquedaGeneral);
    return desarrolladoresElegibles.filter((t) => {
      if (qNorm) {
        const textoCompleto = normalizarTexto(
          `${t.nombre || ''} ${t.apellido || ''} ${t.identificacion || ''}`,
        );
        if (!textoCompleto.includes(qNorm)) {
          return false;
        }
      }
      if (
        filtrosAdicionales.profesion &&
        normalizarTexto(t.profesion) !== normalizarTexto(filtrosAdicionales.profesion)
      ) {
        return false;
      }
      if (
        filtrosAdicionales.especialidadDesarrollo &&
        normalizarTexto(t.especialidadDesarrollo) !==
          normalizarTexto(filtrosAdicionales.especialidadDesarrollo)
      ) {
        return false;
      }
      return true;
    });
  }, [desarrolladoresElegibles, busquedaGeneral, filtrosAdicionales]);

  const cargar = useCallback(
    ({ senal }) => (criterios ? reporteDeDesempeno(criterios, { senal }) : Promise.resolve(null)),
    [criterios],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios]);

  // Sincronizar selección de desarrollador si deja de estar en la lista filtrada
  useEffect(() => {
    if (
      borrador.desarrolladorId &&
      !desarrolladoresFiltrados.some(
        (t) => String(t.id) === String(borrador.desarrolladorId),
      )
    ) {
      setBorrador((prev) => ({ ...prev, desarrolladorId: '', proyectoId: '' }));
      setProyectosDelDesarrollador([]);
      setMensajeProyecto('');
      setCriterios(null);
    }
  }, [desarrolladoresFiltrados, borrador.desarrolladorId]);

  useEffect(() => {
    if (!borrador.desarrolladorId) {
      return undefined;
    }

    let cancelado = false;

    async function cargarAsignaciones() {
      try {
        const asignaciones = await asignacionesDeTrabajador(borrador.desarrolladorId);
        if (cancelado) {
          return;
        }

        const validas = (asignaciones || [])
          .filter((asignacion) => asignacion.activa && asignacion.rolEnProyecto === 'DESARROLLADOR')
          .map((asignacion) => ({
            valor: String(asignacion.proyectoId),
            texto: asignacion.proyectoNombre,
          }));

        setProyectosDelDesarrollador(validas);

        if (validas.length === 0) {
          setBorrador((previos) => ({ ...previos, proyectoId: '' }));
          setMensajeProyecto('El desarrollador seleccionado no tiene proyectos habilitados asignados.');
          return;
        }

        if (validas.length === 1) {
          setBorrador((previos) => ({ ...previos, proyectoId: validas[0].valor }));
          setMensajeProyecto('');
          return;
        }

        setMensajeProyecto('Selecciona el proyecto habilitado al que se le quiere consultar el rendimiento.');
        setBorrador((previos) =>
          previos.proyectoId && !validas.some((proyecto) => proyecto.valor === String(previos.proyectoId))
            ? { ...previos, proyectoId: '' }
            : previos,
        );
      } catch (errorCargar) {
        if (!cancelado) {
          setProyectosDelDesarrollador([]);
          setMensajeProyecto(errorCargar?.message || 'No se pudieron cargar los proyectos del desarrollador.');
        }
      }
    }

    cargarAsignaciones();
    return () => {
      cancelado = true;
    };
  }, [borrador.desarrolladorId]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    if (name === 'desarrolladorId') {
      setBorrador((previos) => ({ ...previos, desarrolladorId: value, proyectoId: '' }));
      setProyectosDelDesarrollador([]);
      setMensajeProyecto('');
      setCriterios(null);
      return;
    }
    if (name === 'proyectoId') {
      if (value && !proyectosDelDesarrollador.some((proyecto) => proyecto.valor === String(value))) {
        setBorrador((previos) => ({ ...previos, proyectoId: '' }));
        setMensajeProyecto('El proyecto seleccionado no corresponde a una asignacion valida del desarrollador.');
        return;
      }
    }
    setBorrador((previos) => ({ ...previos, [name]: value }));
    setCriterios(null);
  }

  function limpiarFiltrosDesarrollador() {
    setBusquedaGeneral('');
    setFiltrosAdicionales({ profesion: '', especialidadDesarrollo: '' });
  }

  const listo = borrador.desarrolladorId && borrador.proyectoId && proyectosDelDesarrollador.length > 0;

  return (
    <Seccion
      titulo="Reporte de desempeno"
      descripcion="Actividades y ejecuciones de un desarrollador dentro de un proyecto."
      id="reporte-desempeno"
    >
      <form
        className={estilos.buscador}
        onSubmit={(evento) => {
          evento.preventDefault();
          setCriterios(borrador);
        }}
      >
        {/* Componente de búsqueda unificada en tiempo real (mismo patrón que Trabajadores) */}
        <div className={estilos.buscador} style={{ marginBottom: 'var(--s-4)', padding: 'var(--s-4)', background: 'var(--c-fondo-tarjeta)', borderRadius: 'var(--r-md)', border: '1px solid var(--c-borde)' }}>
          <div className={estilos.filtroCampoGeneral}>
            <label className={estilos.filtroEtiqueta} htmlFor="busquedaGeneralDesempeno">
              Buscar por nombre, apellido o identificación
            </label>
            <div className={estilos.filtroInputIcono}>
              <Search size={16} className={estilos.filtroIconoBusqueda} aria-hidden="true" />
              <input
                id="busquedaGeneralDesempeno"
                className={estilos.filtroInput}
                type="text"
                placeholder="Escriba un nombre, apellido o número de documento..."
                value={busquedaGeneral}
                onChange={(e) => setBusquedaGeneral(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <button
            type="button"
            className={estilos.filtroToggle}
            onClick={() => setMostrarMasFiltros((v) => !v)}
            aria-expanded={mostrarMasFiltros}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>{mostrarMasFiltros ? 'Ocultar filtros adicionales' : 'Más filtros'}</span>
            {mostrarMasFiltros ? (
              <ChevronUp size={15} aria-hidden="true" />
            ) : (
              <ChevronDown size={15} aria-hidden="true" />
            )}
          </button>

          {mostrarMasFiltros && (
            <div className={estilos.filtroFilaDoble}>
              <Campo
                etiqueta="Profesión"
                nombre="profesion"
                opciones={OPCIONES_PROFESIONES}
                textoVacio="Todas las profesiones"
                value={filtrosAdicionales.profesion}
                onChange={(e) =>
                  setFiltrosAdicionales((prev) => ({ ...prev, profesion: e.target.value }))
                }
              />
              <Campo
                etiqueta="Especialidad de desarrollo"
                nombre="especialidadDesarrollo"
                opciones={OPCIONES_ESPECIALIDADES}
                textoVacio="Todas las especialidades"
                value={filtrosAdicionales.especialidadDesarrollo}
                onChange={(e) =>
                  setFiltrosAdicionales((prev) => ({
                    ...prev,
                    especialidadDesarrollo: e.target.value,
                  }))
                }
              />
            </div>
          )}

          <div className={estilos.filtroAcciones}>
            <button
              type="button"
              className={estilos.filtroBtnLimpiar}
              onClick={limpiarFiltrosDesarrollador}
              disabled={trabajadores.cargando}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>

        {desarrolladoresFiltrados.length === 0 && (
          <div style={{ marginBottom: 'var(--s-5)' }}>
            <EstadoVacio mensaje="No hay desarrolladores que coincidan con los filtros indicados." icono={Search} />
          </div>
        )}

        <div className={estilos.criterios}>
          <Campo
            etiqueta="Desarrollador"
            nombre="desarrolladorId"
            opciones={desarrolladoresFiltrados.map((t) => ({
              valor: String(t.id),
              texto: `${t.nombreCompleto || `${t.nombre} ${t.apellido}`} (${t.tipoTrabajador === 'LIDER' ? 'Líder' : 'Desarrollador'})`,
            }))}
            textoVacio={
              desarrolladoresFiltrados.length === 0
                ? 'No hay desarrolladores disponibles'
                : 'Seleccione un desarrollador'
            }
            obligatorio
            value={borrador.desarrolladorId}
            onChange={alCambiar}
          />
          <Campo
            etiqueta="Proyecto"
            nombre="proyectoId"
            opciones={proyectosDelDesarrollador}
            obligatorio
            value={borrador.proyectoId}
            onChange={alCambiar}
            textoVacio={proyectosDelDesarrollador.length > 0 ? 'Seleccione un proyecto' : null}
          />
          <Campo
            etiqueta="Desde"
            nombre="desde"
            tipo="date"
            value={borrador.desde}
            onChange={alCambiar}
            pista="Periodo opcional."
          />
          <Campo
            etiqueta="Hasta"
            nombre="hasta"
            tipo="date"
            value={borrador.hasta}
            onChange={alCambiar}
          />
        </div>

        {mensajeProyecto && (
          <p className={estilos.avisoError} role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            {mensajeProyecto}
          </p>
        )}

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={!listo || cargando || proyectosDelDesarrollador.length === 0}>
            {cargando ? 'Consultando...' : 'Generar reporte'}
          </Boton>
        </div>
      </form>

      {criterios && cargando && <EstadoCarga mensaje="Generando el reporte..." />}

      {criterios && !cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {criterios && !cargando && !error && datos && (
        <>
          <div className={estilos.ficha}>
            <dl className={estilos.datos}>
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
                    : 'Sin acotar'}
                </dd>
              </div>
            </dl>

            <Conteos conteos={datos.resumen} />
          </div>

          {/* El aviso de que no hay nada que reportar lo redacta el servidor. */}
          {(datos.contenido?.length || 0) === 0 ? (
            <EstadoVacio mensaje={datos.mensaje} icono={ClipboardList} />
          ) : (
            <div className={estilos.listaActividades}>
              {datos.contenido.map((actividad) => (
                <article key={actividad.actividadId} className={estilos.actividad}>
                  <div className={estilos.actividadCabecera}>
                    <div>
                      <p className={estilos.actividadProyecto}>
                        {actividad.etapaNombre} · {actividad.numeroEjecuciones} ejecucion(es)
                      </p>
                      <p className={estilos.actividadDescripcion}>{actividad.descripcion}</p>
                    </div>
                    {actividad.estado && (
                      <span className={estilos.actividadEstado}>{actividad.estado}</span>
                    )}
                  </div>

                  {actividad.ejecuciones?.length > 0 && (
                    <ul className={estilos.ejecuciones}>
                      {actividad.ejecuciones.map((ejecucion) => (
                        <li key={ejecucion.id}>
                          <span className={estilos.ejecucionFecha}>
                            {ejecucion.iniciadaEn?.slice(0, 16).replace('T', ' ')}
                            {ejecucion.finalizadaEn ? ' · finalizada' : ' · en curso'}
                          </span>
                          {ejecucion.observaciones && <span>{ejecucion.observaciones}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}

          <DatosPendientes pendientes={datos.datosPendientes} />
        </>
      )}
    </Seccion>
  );
}

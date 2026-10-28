import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Search, TriangleAlert } from 'lucide-react';

import { asignacionesDeTrabajador, obtenerProyectosAsignables } from '../../api/asignaciones.js';
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
  const [filtrosDesarrollador, setFiltrosDesarrollador] = useState(FILTROS_DESARROLLADOR_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_DESARROLLADOR_VACIOS);
  const [desarrolladoresDisponibles, setDesarrolladoresDisponibles] = useState([]);
  const [proyectosDelDesarrollador, setProyectosDelDesarrollador] = useState([]);
  const [buscandoDesarrolladores, setBuscandoDesarrolladores] = useState(false);
  const [mensajeProyecto, setMensajeProyecto] = useState('');

  const cargarTrabajadores = useCallback(
    ({ senal }) =>
      buscarTrabajadores({ tipoTrabajador: 'DESARROLLADOR', estado: 'HABILITADO', tamano: 100 }, { senal }),
    [],
  );
  const trabajadores = usePeticion(cargarTrabajadores, []);

  useEffect(() => {
    const lista = trabajadores.datos?.contenido || [];
    setDesarrolladoresDisponibles(lista);
    if (!borrador.desarrolladorId || !lista.some((trabajador) => String(trabajador.id) === String(borrador.desarrolladorId))) {
      setBorrador((previos) => ({ ...previos, desarrolladorId: '', proyectoId: '' }));
      setProyectosDelDesarrollador([]);
      setMensajeProyecto('');
    }
  }, [trabajadores.datos, borrador.desarrolladorId]);

  const cargarProyectos = useCallback(({ senal }) => obtenerProyectosAsignables({ senal }), []);
  const proyectos = usePeticion(cargarProyectos, []);

  const cargar = useCallback(
    ({ senal }) => (criterios ? reporteDeDesempeno(criterios, { senal }) : Promise.resolve(null)),
    [criterios],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios]);

  useEffect(() => {
    if (!borrador.desarrolladorId) {
      setProyectosDelDesarrollador([]);
      setMensajeProyecto('');
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
        if (borrador.proyectoId && !validas.some((proyecto) => proyecto.valor === String(borrador.proyectoId))) {
          setBorrador((previos) => ({ ...previos, proyectoId: '' }));
        }
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

  useEffect(() => {
    if (!borrador.proyectoId) {
      return;
    }

    const proyectoValido = proyectosDelDesarrollador.some(
      (proyecto) => proyecto.valor === String(borrador.proyectoId),
    );

    if (!proyectoValido) {
      setBorrador((previos) => ({ ...previos, proyectoId: '' }));
      setMensajeProyecto('El proyecto seleccionado no corresponde a una asignacion valida del desarrollador.');
    }
  }, [borrador.proyectoId, proyectosDelDesarrollador]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setBorrador((previos) => ({ ...previos, [name]: value }));
    setCriterios(null);
  }

  function alCambiarFiltro(evento) {
    const { name, value } = evento.target;
    setFiltrosDesarrollador((previos) => ({ ...previos, [name]: value }));
  }

  async function buscarDesarrolladoresConFiltros() {
    const criterios = Object.fromEntries(
      Object.entries(filtrosDesarrollador).filter(([, valor]) => String(valor ?? '').trim() !== ''),
    );

    setBuscandoDesarrolladores(true);

    try {
      const respuesta = await buscarTrabajadores({
        tipoTrabajador: 'DESARROLLADOR',
        estado: 'HABILITADO',
        ...criterios,
        tamano: 100,
      });
      const lista = respuesta?.contenido || [];
      setDesarrolladoresDisponibles(lista);
      setFiltrosAplicados({ ...filtrosDesarrollador });

      if (borrador.desarrolladorId && !lista.some((trabajador) => String(trabajador.id) === String(borrador.desarrolladorId))) {
        setBorrador((previos) => ({ ...previos, desarrolladorId: '', proyectoId: '' }));
        setProyectosDelDesarrollador([]);
        setMensajeProyecto('');
      }
    } catch (error) {
      setDesarrolladoresDisponibles([]);
      setFiltrosAplicados({ ...filtrosDesarrollador });
      setMensajeProyecto(error?.message || 'No se pudieron cargar los desarrolladores con los filtros indicados.');
    } finally {
      setBuscandoDesarrolladores(false);
    }
  }

  function limpiarFiltrosDesarrollador() {
    setFiltrosDesarrollador(FILTROS_DESARROLLADOR_VACIOS);
    setFiltrosAplicados(FILTROS_DESARROLLADOR_VACIOS);
    setDesarrolladoresDisponibles(trabajadores.datos?.contenido || []);
    if (borrador.desarrolladorId && !trabajadores.datos?.contenido?.some((trabajador) => String(trabajador.id) === String(borrador.desarrolladorId))) {
      setBorrador((previos) => ({ ...previos, desarrolladorId: '', proyectoId: '' }));
      setProyectosDelDesarrollador([]);
      setMensajeProyecto('');
    }
  }

  const listo = borrador.desarrolladorId && borrador.proyectoId && proyectosDelDesarrollador.length > 0;
  const desarrolladoresFiltrados = filtrarDesarrolladores(desarrolladoresDisponibles, filtrosAplicados);

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
        <div className={estilos.filtrosBarra}>
          <div className={estilos.filtrosCabecera}>
            <span className={estilos.rotulo}>Filtrar desarrollador</span>
          </div>
          <div className={estilos.filtrosGrid}>
            <Campo
              etiqueta="Identificacion"
              nombre="identificacion"
              value={filtrosDesarrollador.identificacion}
              onChange={alCambiarFiltro}
            />
            <Campo
              etiqueta="Nombre"
              nombre="nombre"
              value={filtrosDesarrollador.nombre}
              onChange={alCambiarFiltro}
            />
            <Campo
              etiqueta="Apellido"
              nombre="apellido"
              value={filtrosDesarrollador.apellido}
              onChange={alCambiarFiltro}
            />
            <Campo
              etiqueta="Especialidad"
              nombre="especialidadDesarrollo"
              opciones={OPCIONES_ESPECIALIDADES}
              value={filtrosDesarrollador.especialidadDesarrollo}
              onChange={alCambiarFiltro}
            />
            <Campo
              etiqueta="Profesion"
              nombre="profesion"
              opciones={OPCIONES_PROFESIONES}
              value={filtrosDesarrollador.profesion}
              onChange={alCambiarFiltro}
            />
          </div>
          <div className={estilos.filtrosAcciones}>
            <Boton type="button" icono={Search} onClick={buscarDesarrolladoresConFiltros} disabled={buscandoDesarrolladores}>
              {buscandoDesarrolladores ? 'Buscando...' : 'Buscar'}
            </Boton>
            <Boton type="button" variante="texto" onClick={limpiarFiltrosDesarrollador} disabled={buscandoDesarrolladores}>
              Limpiar filtros
            </Boton>
          </div>
        </div>

        {filtrosAplicados && Object.values(filtrosAplicados).some((valor) => String(valor).trim() !== '') && desarrolladoresFiltrados.length === 0 && (
          <div style={{ marginBottom: 'var(--s-5)' }}>
            <EstadoVacio mensaje="No hay desarrolladores que coincidan con los filtros indicados." icono={Search} />
          </div>
        )}

        <div className={estilos.criterios}>
          <Campo
            etiqueta="Desarrollador"
            nombre="desarrolladorId"
            opciones={desarrolladoresDisponibles.map((t) => ({
              valor: String(t.id),
              texto: t.nombreCompleto,
            }))}
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

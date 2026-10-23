import { useCallback, useState } from 'react';
import { ClipboardList, Search } from 'lucide-react';

import { obtenerProyectosAsignables } from '../../api/asignaciones.js';
import { reporteDeDesempeno } from '../../api/reportes.js';
import { buscarTrabajadores } from '../../api/trabajadores.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import Conteos from './componentes/Conteos.jsx';
import DatosPendientes from './componentes/DatosPendientes.jsx';

const SIN_CRITERIOS = { desarrolladorId: '', proyectoId: '', desde: '', hasta: '' };

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

  const cargarTrabajadores = useCallback(
    ({ senal }) =>
      buscarTrabajadores({ tipoTrabajador: 'DESARROLLADOR', tamano: 100 }, { senal }),
    [],
  );
  const trabajadores = usePeticion(cargarTrabajadores, []);

  const cargarProyectos = useCallback(({ senal }) => obtenerProyectosAsignables({ senal }), []);
  const proyectos = usePeticion(cargarProyectos, []);

  const cargar = useCallback(
    ({ senal }) => (criterios ? reporteDeDesempeno(criterios, { senal }) : Promise.resolve(null)),
    [criterios],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [criterios]);

  function alCambiar(evento) {
    const { name, value } = evento.target;
    setBorrador((previos) => ({ ...previos, [name]: value }));
  }

  const listo = borrador.desarrolladorId && borrador.proyectoId;

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
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Desarrollador"
            nombre="desarrolladorId"
            opciones={(trabajadores.datos?.contenido || []).map((t) => ({
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
            opciones={(proyectos.datos?.contenido || []).map((p) => ({
              valor: String(p.id),
              texto: p.nombre,
            }))}
            obligatorio
            value={borrador.proyectoId}
            onChange={alCambiar}
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

        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={!listo || cargando}>
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

import { useCallback, useState } from 'react';
import { ClipboardList, PauseCircle, Search } from 'lucide-react';

import { ETIQUETA_UNIDAD } from '../../api/incidencias.js';
import { reporteDeActividades, reporteDeInterrupciones } from '../../api/reportes.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import estilos from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import {
  useContextoDeProyecto,
  useProyectosComoOpciones,
} from '../actividades/componentes/useContextoDeProyecto.js';
import Conteos from './componentes/Conteos.jsx';

/**
 * Reportes de un proyecto: actividades (RF-018, HU-14) e interrupciones
 * (RF-017, HU-15).
 *
 * Los dos son del lider y los dos arrancan eligiendo un proyecto, asi que
 * comparten pantalla: separarlos obligaria a elegir el mismo proyecto dos
 * veces para responder a la misma pregunta sobre el.
 *
 * Los proyectos se piden sin filtrar por estado: un proyecto inhabilitado
 * conserva su historial (RN-02) y seguir pudiendo consultarlo es justamente el
 * sentido de inhabilitar en lugar de borrar.
 */
export default function PaginaReportesProyecto() {
  const [proyectoId, setProyectoId] = useState('');
  const { opcionesDeProyecto } = useProyectosComoOpciones();

  return (
    <>
      <Seccion
        titulo="Reportes del proyecto"
        descripcion="Elija un proyecto para consultar sus actividades y sus interrupciones."
        id="reportes-proyecto"
      >
        <div className={estilos.buscador}>
          <div style={{ maxWidth: '420px' }}>
            <Campo
              etiqueta="Proyecto"
              nombre="proyectoId"
              opciones={opcionesDeProyecto}
              value={proyectoId}
              onChange={(evento) => setProyectoId(evento.target.value)}
            />
          </div>
        </div>

        {!proyectoId && (
          <EstadoVacio
            mensaje="Elija un proyecto para generar sus reportes."
            icono={ClipboardList}
          />
        )}
      </Seccion>

      {proyectoId && <ReporteDeActividades proyectoId={proyectoId} />}
      {proyectoId && <ReporteDeInterrupciones proyectoId={proyectoId} />}
    </>
  );
}

/**
 * Actividades del proyecto con su desarrollador (RF-018, HU-14).
 *
 * Los filtros por etapa y por desarrollador los resuelve el servidor, y las
 * opciones salen del propio proyecto: sus etapas y su equipo.
 */
function ReporteDeActividades({ proyectoId }) {
  const [borrador, setBorrador] = useState({ etapaId: '', desarrolladorId: '' });
  const [criterios, setCriterios] = useState({ etapaId: '', desarrolladorId: '' });
  const [pagina, setPagina] = useState(0);

  const { opcionesDeEtapa, opcionesDeDesarrollador } = useContextoDeProyecto(proyectoId);

  const cargar = useCallback(
    ({ senal }) => reporteDeActividades(proyectoId, { ...criterios, pagina }, { senal }),
    [proyectoId, criterios, pagina],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [
    proyectoId,
    criterios,
    pagina,
  ]);

  const actividades = datos?.contenido || [];

  return (
    <Seccion titulo="Actividades del proyecto" fondo="tenue" id="reporte-actividades">
      <form
        className={estilos.buscador}
        onSubmit={(evento) => {
          evento.preventDefault();
          setCriterios(borrador);
          setPagina(0);
        }}
      >
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Etapa"
            nombre="etapaId"
            opciones={opcionesDeEtapa}
            textoVacio="Todas"
            value={borrador.etapaId}
            onChange={(evento) => setBorrador((p) => ({ ...p, etapaId: evento.target.value }))}
          />
          <Campo
            etiqueta="Desarrollador"
            nombre="desarrolladorId"
            opciones={opcionesDeDesarrollador}
            textoVacio="Todos"
            value={borrador.desarrolladorId}
            onChange={(evento) =>
              setBorrador((p) => ({ ...p, desarrolladorId: evento.target.value }))
            }
          />
        </div>
        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={cargando}>
            Filtrar
          </Boton>
        </div>
      </form>

      {cargando && <EstadoCarga mensaje="Generando el reporte de actividades..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && actividades.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje} icono={ClipboardList} />
      )}

      {!cargando && !error && actividades.length > 0 && (
        <>
          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tabla}>
              <caption className="solo-lectores">Actividades del proyecto</caption>
              <thead>
                <tr>
                  <th scope="col">Id</th>
                  <th scope="col">Actividad</th>
                  <th scope="col">Etapa</th>
                  <th scope="col">Desarrollador</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((actividad) => (
                  <tr key={actividad.id}>
                    <td>{actividad.id}</td>
                    <th scope="row" className={estilos.celdaDescripcion}>
                      {actividad.descripcion}
                    </th>
                    <td>{actividad.etapaNombre}</td>
                    <td>{actividad.desarrolladorNombreCompleto}</td>
                    <td>{actividad.estado || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {datos.totalPaginas > 1 ? (
            <nav className={estilos.paginacion} aria-label="Paginas del reporte">
              <Boton
                variante="secundario"
                onClick={() => setPagina(pagina - 1)}
                disabled={pagina <= 0}
              >
                Anterior
              </Boton>
              <p className={estilos.recuento} aria-live="polite">
                Pagina {datos.pagina + 1} de {datos.totalPaginas} · {datos.total} actividad(es)
              </p>
              <Boton
                variante="secundario"
                onClick={() => setPagina(pagina + 1)}
                disabled={pagina + 1 >= datos.totalPaginas}
              >
                Siguiente
              </Boton>
            </nav>
          ) : (
            <p className={estilos.recuento}>{datos.total} actividad(es).</p>
          )}
        </>
      )}
    </Seccion>
  );
}

/**
 * Interrupciones del proyecto (RF-017, HU-15).
 *
 * El total de duracion llega separado por unidad y no sumado: horas y dias no
 * se pueden sumar sin saber cuantas horas tiene una jornada laboral, y eso no
 * esta definido. El servidor entrega un total por unidad y la pantalla los
 * muestra tal cual, en vez de inventar la conversion.
 */
function ReporteDeInterrupciones({ proyectoId }) {
  const [borrador, setBorrador] = useState({ desde: '', hasta: '' });
  const [criterios, setCriterios] = useState({ desde: '', hasta: '' });

  const cargar = useCallback(
    ({ senal }) => reporteDeInterrupciones(proyectoId, criterios, { senal }),
    [proyectoId, criterios],
  );
  const { datos, error, cargando, reintentar } = usePeticion(cargar, [proyectoId, criterios]);

  const interrupciones = datos?.contenido || [];

  return (
    <Seccion titulo="Interrupciones del proyecto" id="reporte-interrupciones">
      <form
        className={estilos.buscador}
        onSubmit={(evento) => {
          evento.preventDefault();
          setCriterios(borrador);
        }}
      >
        <div className={estilos.criterios}>
          <Campo
            etiqueta="Desde"
            nombre="desde"
            tipo="date"
            value={borrador.desde}
            onChange={(evento) => setBorrador((p) => ({ ...p, desde: evento.target.value }))}
            pista="Periodo opcional."
          />
          <Campo
            etiqueta="Hasta"
            nombre="hasta"
            tipo="date"
            value={borrador.hasta}
            onChange={(evento) => setBorrador((p) => ({ ...p, hasta: evento.target.value }))}
          />
        </div>
        <div className={estilos.accionesBuscador}>
          <Boton type="submit" icono={Search} disabled={cargando}>
            Filtrar
          </Boton>
        </div>
      </form>

      {cargando && <EstadoCarga mensaje="Generando el reporte de interrupciones..." />}

      {!cargando && error && <EstadoError error={error} alReintentar={reintentar} />}

      {!cargando && !error && interrupciones.length === 0 && (
        <EstadoVacio mensaje={datos?.mensaje} icono={PauseCircle} />
      )}

      {!cargando && !error && interrupciones.length > 0 && (
        <>
          <div className={estilos.ficha}>
            <Conteos
              conteos={Object.fromEntries(
                Object.entries(datos.duracionTotalPorUnidad || {}).map(([unidad, valor]) => [
                  `Total en ${ETIQUETA_UNIDAD[unidad] || unidad.toLowerCase()}`,
                  valor,
                ]),
              )}
              titulo="Duracion acumulada"
            />
          </div>

          <div className={estilos.tablaEnvoltorio}>
            <table className={estilos.tabla}>
              <caption className="solo-lectores">Interrupciones del proyecto</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Duracion</th>
                  <th scope="col">Fase</th>
                </tr>
              </thead>
              <tbody>
                {interrupciones.map((interrupcion) => (
                  <tr key={interrupcion.id}>
                    <td>{formatearFecha(interrupcion.fecha)}</td>
                    <th scope="row" className={estilos.celdaNombre}>
                      {interrupcion.tipoInterrupcion}
                    </th>
                    <td>
                      {interrupcion.duracionValor}{' '}
                      {ETIQUETA_UNIDAD[interrupcion.duracionUnidad] ||
                        interrupcion.duracionUnidad?.toLowerCase()}
                    </td>
                    <td>{interrupcion.faseNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={estilos.recuento}>{datos.total} interrupcion(es).</p>
        </>
      )}
    </Seccion>
  );
}

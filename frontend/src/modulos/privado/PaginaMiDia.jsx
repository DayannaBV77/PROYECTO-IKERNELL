import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  ExternalLink,
  Mail,
  MessagesSquare,
  PauseCircle,
  TriangleAlert,
} from 'lucide-react';

import { ETIQUETA_PRIORIDAD } from '../../api/actividades.js';
import { obtenerMisProyectos } from '../../api/asignaciones.js';
import { obtenerMiDia } from '../../api/miDia.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import gestion from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import FormularioDeInterrupcion from '../incidencias/componentes/FormularioDeInterrupcion.jsx';
import estilos from './PaginaMiDia.module.css';

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * Las tres cosas que el requerimiento enumera, en el orden en que las enumera:
 * las actividades pendientes del dia ordenadas por prioridad, las notificaciones
 * no leidas y el acceso rapido al registro de bloqueos o interrupciones.
 *
 * El orden y el filtro los decide el servidor, no esta pantalla: aqui se
 * recorre la lista tal como llega. Las decisiones que RF-038 deja abiertas
 * -que cuenta como "del dia" (D-30), que como "pendiente" (D-31) y como se
 * ordena la prioridad (D-29)- viven en el servicio, de modo que el panel no
 * pueda acabar mostrando un criterio distinto del que aplica el servidor.
 *
 * No se ofrece por tipo de trabajador: lo que el panel usa es la actividad
 * asignada, y HU-16 C05 (RN-05) incluye al lider al que asignaron como
 * desarrollador en otro proyecto.
 */
export default function PaginaMiDia() {
  const [recarga, setRecarga] = useState(0);

  const cargar = useCallback(({ senal }) => obtenerMiDia({ senal }), []);
  const miDia = usePeticion(cargar, [recarga]);

  if (miDia.cargando) {
    return (
      <Seccion titulo="Mi dia" id="mi-dia">
        <EstadoCarga mensaje="Armando su panel del dia..." esqueleto={3} />
      </Seccion>
    );
  }

  if (miDia.error) {
    return (
      <Seccion titulo="Mi dia" id="mi-dia">
        <EstadoError error={miDia.error} alReintentar={miDia.reintentar} />
      </Seccion>
    );
  }

  const { dia, actividades, total, atrasadas, sinDiaPlanificado, notificaciones, mensaje } =
    miDia.datos;

  return (
    <>
      <Seccion
        titulo="Mi dia"
        descripcion={`Actividades pendientes para el ${formatearFecha(dia)}, ordenadas por prioridad.`}
        id="mi-dia"
      >
        {total === 0 ? (
          // El aviso lo redacta el servidor, que es quien sabe si no hay nada o
          // si lo que falta es que el lider planifique las actividades.
          <EstadoVacio mensaje={mensaje} icono={CalendarClock} />
        ) : (
          <>
            {atrasadas > 0 && (
              <p className={gestion.avisoPendiente} role="status">
                <TriangleAlert size={18} aria-hidden="true" />
                {atrasadas === 1
                  ? '1 actividad quedo de un dia anterior.'
                  : `${atrasadas} actividades quedaron de dias anteriores.`}
              </p>
            )}

            <div className={estilos.actividades}>
              {actividades.map(({ actividad, atrasada }) => (
                <ActividadDelDia key={actividad.id} actividad={actividad} atrasada={atrasada} />
              ))}
            </div>
          </>
        )}

        {/* Las actividades sin dia no salen en el panel, pero tampoco se ocultan
            en silencio: sin fecha no son "del dia", y RF-019 no obliga a
            ponersela, asi que su ausencia podria parecer un error. */}
        {sinDiaPlanificado > 0 && total > 0 && (
          <p className={gestion.avisoPendiente} role="status">
            <CalendarClock size={18} aria-hidden="true" />
            Tiene {sinDiaPlanificado} actividad(es) pendiente(s) sin dia planificado, que no
            aparecen en este panel.
          </p>
        )}
      </Seccion>

      <Notificaciones notificaciones={notificaciones} />

      <AccesoRapidoABloqueos alRegistrar={() => setRecarga((numero) => numero + 1)} />
    </>
  );
}

/**
 * Una actividad del dia.
 *
 * La prioridad va escrita y ademas marca el borde: el color no es la unica
 * senal, que es lo que RNF-002 pide de una interfaz comprensible.
 */
function ActividadDelDia({ actividad, atrasada }) {
  const clasePrioridad = actividad.prioridad ? estilos[`prioridad${actividad.prioridad}`] : '';

  return (
    <article className={`${estilos.actividad} ${clasePrioridad}`}>
      <div className={estilos.cabecera}>
        <span className={estilos.contexto}>
          {actividad.proyectoNombre} · {actividad.etapaNombre}
        </span>
        <span className={estilos.etiquetas}>
          <span className={estilos.prioridad}>
            {/* Sin prioridad no se inventa una: D-29 sigue abierta. */}
            {ETIQUETA_PRIORIDAD[actividad.prioridad] || 'Sin prioridad'}
          </span>
          {atrasada && (
            <span className={estilos.atrasada}>
              <TriangleAlert size={12} aria-hidden="true" />
              Atrasada
            </span>
          )}
        </span>
      </div>

      <p className={estilos.descripcion}>{actividad.descripcion}</p>

      <span className={estilos.contexto}>
        Planificada para el {formatearFecha(actividad.fechaPlanificada)}
      </span>

      {/* RF-038: "al seleccionar una actividad, debe permitir consultar su
          informacion disponible". La consulta propia y el registro de la
          ejecucion ya existen en Mis actividades (RF-022, HU-16). */}
      <Link className={gestion.abrir} to="/app/mis-actividades">
        Ver y registrar su ejecucion
        <span className="solo-lectores"> de la actividad {actividad.id}</span>
      </Link>
    </article>
  );
}

/**
 * Notificaciones no leidas de los servicios corporativos (RF-038).
 *
 * El chat entrega un numero real. El correo NO: RF-031 lo resuelve como enlace a
 * un servicio externo (D-13), de modo que el aplicativo no puede saber cuantos
 * mensajes sin leer hay al otro lado. Se muestra el estado del acceso y el aviso
 * que redacta el servidor, en lugar de un cero que se leeria como "no tiene
 * correos nuevos".
 */
function Notificaciones({ notificaciones }) {
  const { chatNoLeidos, correo, avisoCorreoNoLeidos } = notificaciones;

  return (
    <Seccion
      titulo="Notificaciones"
      descripcion="Mensajes sin leer de los servicios corporativos."
      fondo="tenue"
      id="notificaciones-mi-dia"
    >
      <div className={estilos.indicadores}>
        <div className={estilos.indicador}>
          <span className={estilos.indicadorValor}>{chatNoLeidos}</span>
          <span className={estilos.indicadorNombre}>
            <MessagesSquare size={14} aria-hidden="true" /> Mensajes sin leer en sus
            conversaciones
          </span>
          {chatNoLeidos > 0 && (
            <Link className={gestion.abrir} to="/app/chat">
              Abrir las conversaciones
            </Link>
          )}
        </div>

        <div className={estilos.indicador}>
          <span className={estilos.indicadorNombre}>
            <Mail size={14} aria-hidden="true" /> Correo corporativo
          </span>
          {correo?.disponible ? (
            <a
              className={gestion.abrir}
              href={correo.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Abrir el correo
              <ExternalLink size={14} aria-hidden="true" />
              <span className="solo-lectores">(se abre en una pestana nueva)</span>
            </a>
          ) : (
            <span className={estilos.indicadorNota}>{correo?.mensaje}</span>
          )}
          <span className={estilos.indicadorNota}>{avisoCorreoNoLeidos}</span>
        </div>
      </div>
    </Seccion>
  );
}

/**
 * Acceso rapido para reportar un bloqueo o una interrupcion (RF-038).
 *
 * RF-038 pide "acceder directamente a la funcion de registro de bloqueos o
 * interrupciones", de modo que lleva al registro que ya existe (RF-024, HU-18)
 * y no a uno nuevo: el formulario es el mismo componente que usa la pantalla de
 * incidencias, con sus mismas validaciones.
 *
 * Los proyectos son aquellos donde el trabajador esta asignado como
 * DESARROLLADOR, que es el rol que el servidor exige para registrar.
 */
function AccesoRapidoABloqueos({ alRegistrar }) {
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(({ senal }) => obtenerMisProyectos({ senal }), []);
  const misProyectos = usePeticion(cargar, []);

  const proyectos = (misProyectos.datos?.contenido || [])
    .filter(({ roles }) => roles.includes('DESARROLLADOR'))
    .map(({ proyectoId, proyectoNombre }) => ({
      valor: String(proyectoId),
      texto: proyectoNombre,
    }));

  return (
    <Seccion
      titulo="Reportar un bloqueo"
      descripcion="Deje constancia de una interrupcion que esta afectando su trabajo."
      id="bloqueo-rapido"
    >
      {!abierto && (
        <Boton variante="secundario" icono={PauseCircle} onClick={() => setAbierto(true)}>
          Reportar un bloqueo o interrupcion
        </Boton>
      )}

      {abierto && misProyectos.cargando && (
        <EstadoCarga mensaje="Cargando sus proyectos..." />
      )}

      {abierto && !misProyectos.cargando && misProyectos.error && (
        <EstadoError error={misProyectos.error} alReintentar={misProyectos.reintentar} />
      )}

      {abierto && !misProyectos.cargando && !misProyectos.error && proyectos.length === 0 && (
        <EstadoVacio
          mensaje="No esta asignado como desarrollador en ningun proyecto, de modo que no hay proyecto sobre el que reportar un bloqueo."
          icono={PauseCircle}
        />
      )}

      {abierto && !misProyectos.cargando && !misProyectos.error && proyectos.length > 0 && (
        <FormularioDeInterrupcion
          proyectos={proyectos}
          proyectoInicial={proyectos.length === 1 ? proyectos[0].valor : ''}
          alRegistrar={alRegistrar}
        />
      )}
    </Seccion>
  );
}

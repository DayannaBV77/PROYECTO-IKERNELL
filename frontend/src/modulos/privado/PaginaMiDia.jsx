import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Check,
  CircleCheck,
  ExternalLink,
  Mail,
  MessagesSquare,
  PauseCircle,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import { ETIQUETA_PRIORIDAD } from '../../api/actividades.js';
import { obtenerMisProyectos } from '../../api/asignaciones.js';
import {
  cambiarEstadoActividadMiDia,
  cambiarEstadoTareaMiDia,
  crearTareaMiDia,
  eliminarTareaMiDia,
  obtenerMiDia,
} from '../../api/miDia.js';
import EstadoCarga from '../../componentes/estados/EstadoCarga.jsx';
import EstadoError from '../../componentes/estados/EstadoError.jsx';
import EstadoVacio from '../../componentes/estados/EstadoVacio.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Dialogo from '../../componentes/ui/Dialogo.jsx';
import Seccion from '../../componentes/ui/Seccion.jsx';
import gestion from '../../estilos/gestion.module.css';
import { usePeticion } from '../../hooks/usePeticion.js';
import { formatearFecha } from '../../utilidades/formato.js';
import FormularioDeInterrupcion from '../incidencias/componentes/FormularioDeInterrupcion.jsx';
import estilos from './PaginaMiDia.module.css';

/** Orden de prioridad del servidor (D-29): ALTA primero, sin prioridad al final. */
const ORDEN_PRIORIDAD = { ALTA: 0, MEDIA: 1, BAJA: 2 };
const SIN_PRIORIDAD = Object.keys(ORDEN_PRIORIDAD).length;

/** Duracion de la animacion de salida antes de quitar la fila de la lista. */
const MS_SALIDA = 220;

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * Las tres cosas que el requerimiento enumera, en el orden en que las enumera:
 * el checklist del dia, las notificaciones no leidas y el acceso rapido al
 * registro de bloqueos o interrupciones.
 *
 * El orden y el filtro inicial los decide el servidor, no esta pantalla. Las
 * decisiones que RF-038 deja abiertas -que cuenta como "del dia" (D-30), que
 * como "pendiente" (D-31) y como se ordena la prioridad (D-29)- viven en el
 * servicio, de modo que el panel no pueda acabar mostrando un criterio distinto
 * del que aplica el servidor. Las operaciones del checklist si se reflejan de
 * inmediato en la interfaz y se confirman contra el backend.
 *
 * No se ofrece por tipo de trabajador: lo que el panel usa es la actividad
 * asignada, y HU-16 C05 (RN-05) incluye al lider al que asignaron como
 * desarrollador en otro proyecto.
 */
export default function PaginaMiDia() {
  const [recarga, setRecarga] = useState(0);
  const [bloqueo, setBloqueo] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const cargar = useCallback(({ senal }) => obtenerMiDia({ senal }), []);
  const miDia = usePeticion(cargar, [recarga]);

  function abrirBloqueo(contexto = {}) {
    setConfirmado(null);
    setBloqueo(contexto);
  }

  function cerrarBloqueo() {
    setBloqueo(null);
  }

  function alRegistrarBloqueo() {
    // El formulario ya guardo; se cierra el modal y se recarga el panel para
    // que cualquier cambio derivado se refleje de inmediato. El cierre se
    // limita al modal que envio: si el trabajador lo cerro y abrio otro
    // mientras la peticion viajaba, la respuesta tardia no debe cerrar el nuevo.
    const origen = bloqueo;
    setBloqueo((actual) => (actual === origen ? null : actual));
    setConfirmado('La interrupcion quedo registrada y asociada al proyecto.');
    setRecarga((numero) => numero + 1);
  }

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

  const {
    dia,
    actividades,
    tareasPersonales,
    sinDiaPlanificado,
    notificaciones,
    mensaje,
  } = miDia.datos;

  return (
    <>
      {/* `sinCabecera` porque el checklist trae su propia cabecera oscura. El
          id se conserva para que la region siga teniendo un titular asociado. */}
      <Seccion sinCabecera id="mi-dia" fondo="clara">
        <Checklist
          // Al recargar el panel se reinicia el estado local con lo que
          // devuelve el servidor, sin efectos de sincronizacion.
          key={recarga}
          dia={dia}
          actividadesIniciales={actividades}
          tareasIniciales={tareasPersonales}
          sinDiaPlanificado={sinDiaPlanificado}
          mensaje={mensaje}
          alAbrirBloqueo={abrirBloqueo}
        />
      </Seccion>

      <Notificaciones notificaciones={notificaciones} />

      <AccesoRapidoABloqueos
        abierto={Boolean(bloqueo)}
        contexto={bloqueo || {}}
        confirmado={confirmado}
        alAbrir={abrirBloqueo}
        alCerrar={cerrarBloqueo}
        alRegistrar={alRegistrarBloqueo}
      />
    </>
  );
}

/**
 * Checklist del dia: actividades del sistema y tareas personales en una sola
 * lista.
 *
 * El estado local nace de lo que devuelve el servidor y se actualiza de forma
 * optimista al marcar, agregar o eliminar. Si el backend rechaza la operacion,
 * la fila vuelve a su estado anterior y se muestra el mensaje del servidor, que
 * es el que conoce la regla de negocio.
 */
function Checklist({
  dia,
  actividadesIniciales,
  tareasIniciales,
  sinDiaPlanificado,
  mensaje,
  alAbrirBloqueo,
}) {
  const [actividades, setActividades] = useState(actividadesIniciales);
  const [tareas, setTareas] = useState(tareasIniciales);
  const [nueva, setNueva] = useState('');
  const [errorNueva, setErrorNueva] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [creando, setCreando] = useState(false);
  const [enCurso, setEnCurso] = useState(() => new Set());
  const [eliminando, setEliminando] = useState(() => new Set());

  const actividadesOrdenadas = useMemo(() => ordenarActividades(actividades), [actividades]);
  const tareasOrdenadas = useMemo(() => ordenarTareas(tareas), [tareas]);

  const total = actividadesOrdenadas.length + tareasOrdenadas.length;
  const completadas =
    actividadesOrdenadas.filter((elemento) => elemento.completada).length +
    tareasOrdenadas.filter((tarea) => tarea.completada).length;
  const pendientes = total - completadas;
  const atrasadas = actividadesOrdenadas.filter(
    (elemento) => !elemento.completada && elemento.atrasada,
  ).length;
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
  const vacio = total === 0;
  const todoHecho = total > 0 && pendientes === 0;

  function marcarEnCurso(clave, activo) {
    setEnCurso((previas) => {
      const siguientes = new Set(previas);
      if (activo) {
        siguientes.add(clave);
      } else {
        siguientes.delete(clave);
      }
      return siguientes;
    });
  }

  async function alternarActividad(actividadId, completada) {
    const clave = `actividad-${actividadId}`;
    if (enCurso.has(clave)) {
      return;
    }
    setAviso(null);
    marcarEnCurso(clave, true);
    setActividades((previas) =>
      previas.map((elemento) =>
        elemento.actividad.id === actividadId ? { ...elemento, completada } : elemento,
      ),
    );

    try {
      await cambiarEstadoActividadMiDia(actividadId, completada);
    } catch (error) {
      // Se deshace el cambio optimista: el servidor es la fuente de verdad.
      setActividades((previas) =>
        previas.map((elemento) =>
          elemento.actividad.id === actividadId
            ? { ...elemento, completada: !completada }
            : elemento,
        ),
      );
      setAviso(error.message);
    } finally {
      marcarEnCurso(clave, false);
    }
  }

  async function alternarTarea(tareaId, completada) {
    const clave = `tarea-${tareaId}`;
    if (enCurso.has(clave)) {
      return;
    }
    setAviso(null);
    marcarEnCurso(clave, true);
    setTareas((previas) =>
      previas.map((tarea) => (tarea.id === tareaId ? { ...tarea, completada } : tarea)),
    );

    try {
      await cambiarEstadoTareaMiDia(tareaId, completada);
    } catch (error) {
      setTareas((previas) =>
        previas.map((tarea) =>
          tarea.id === tareaId ? { ...tarea, completada: !completada } : tarea,
        ),
      );
      setAviso(error.message);
    } finally {
      marcarEnCurso(clave, false);
    }
  }

  async function agregarTarea(evento) {
    evento.preventDefault();
    const descripcion = nueva.trim();
    if (!descripcion) {
      setErrorNueva('Escriba la tarea que quiere agregar.');
      return;
    }
    if (descripcion.length > 500) {
      setErrorNueva('La tarea admite hasta 500 caracteres.');
      return;
    }

    setCreando(true);
    setErrorNueva(null);
    setAviso(null);
    try {
      const creada = await crearTareaMiDia({ descripcion });
      setTareas((previas) => [...previas, creada]);
      setNueva('');
    } catch (error) {
      setErrorNueva(error.campos?.descripcion || error.message);
    } finally {
      setCreando(false);
    }
  }

  async function quitarTarea(tareaId) {
    const clave = `tarea-${tareaId}`;
    if (enCurso.has(clave)) {
      return;
    }
    setAviso(null);
    marcarEnCurso(clave, true);
    try {
      await eliminarTareaMiDia(tareaId);
      // Se pinta la salida y solo despues se quita de la lista, para que la
      // fila no desaparezca de golpe.
      setEliminando((previas) => new Set(previas).add(tareaId));
      await new Promise((resolver) => {
        setTimeout(resolver, MS_SALIDA);
      });
      setTareas((previas) => previas.filter((tarea) => tarea.id !== tareaId));
      setEliminando((previas) => {
        const siguientes = new Set(previas);
        siguientes.delete(tareaId);
        return siguientes;
      });
    } catch (error) {
      setAviso(error.message);
    } finally {
      marcarEnCurso(clave, false);
    }
  }

  return (
    <div className={estilos.panel}>
      <header className={estilos.hero}>
        <div className={estilos.heroTexto}>
          <p className={estilos.eyebrow}>
            <CalendarClock size={14} aria-hidden="true" />
            {formatearFecha(dia)}
          </p>
          <h2 className={estilos.titulo} id="mi-dia-titulo">
            Mi Día
          </h2>
          <p className={estilos.subtitulo}>
            {todoHecho
              ? 'No le queda nada pendiente. Disfrute el resto del día.'
              : pendientes === 1
                ? 'Le queda 1 tarea por cerrar.'
                : `Le quedan ${pendientes} tareas por cerrar.`}
          </p>
        </div>

        <div
          className={estilos.anillo}
          role="img"
          aria-label={`${porcentaje}% del día completado`}
        >
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle className={estilos.anilloFondo} cx="32" cy="32" r="26" />
            <circle
              className={estilos.anilloValor}
              cx="32"
              cy="32"
              r="26"
              strokeDasharray="163.36"
              strokeDashoffset={163.36 * (1 - porcentaje / 100)}
            />
          </svg>
          <span className={estilos.anilloTexto}>{porcentaje}%</span>
        </div>
      </header>

      <div className={estilos.resumen}>
        <div className={estilos.barra} aria-hidden="true">
          <span className={estilos.barraValor} style={{ width: `${porcentaje}%` }} />
        </div>
        <div className={estilos.cifras}>
          <span className={estilos.cifra}>
            <strong>{pendientes}</strong> pendientes
          </span>
          <span className={estilos.cifra}>
            <strong>{completadas}</strong> completadas
          </span>
          {atrasadas > 0 && (
            <span className={estilos.cifraAlerta}>
              <TriangleAlert size={14} aria-hidden="true" />
              {atrasadas === 1 ? '1 atrasada' : `${atrasadas} atrasadas`}
            </span>
          )}
        </div>
      </div>

      <form className={estilos.agregar} onSubmit={agregarTarea} noValidate>
        <label className="solo-lectores" htmlFor="nueva-tarea-mi-dia">
          Nueva tarea personal para hoy
        </label>
        <div className={estilos.agregarFila}>
          <Plus className={estilos.agregarIcono} size={18} aria-hidden="true" />
          <input
            id="nueva-tarea-mi-dia"
            className={estilos.entrada}
            type="text"
            value={nueva}
            onChange={(evento) => {
              setNueva(evento.target.value);
              if (errorNueva) {
                setErrorNueva(null);
              }
            }}
            placeholder="Añadir una tarea personal para hoy…"
            maxLength={500}
            autoComplete="off"
            disabled={creando}
            aria-invalid={Boolean(errorNueva)}
            aria-describedby={errorNueva ? 'error-nueva-tarea' : undefined}
          />
          <button
            type="submit"
            className={estilos.botonAgregar}
            disabled={creando || nueva.trim().length === 0}
          >
            {creando ? 'Agregando…' : 'Añadir'}
          </button>
        </div>
        {errorNueva && (
          <p className={estilos.error} id="error-nueva-tarea" role="alert">
            {errorNueva}
          </p>
        )}
      </form>

      {aviso && (
        <p className={estilos.avisoError} role="alert">
          <TriangleAlert size={16} aria-hidden="true" />
          {aviso}
        </p>
      )}

      {todoHecho && (
        <p className={estilos.felicitacion} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          ¡Todo al día por hoy! No tiene tareas pendientes.
        </p>
      )}

      {vacio ? (
        <div className={estilos.vacio}>
          <span className={estilos.vacioIcono}>
            <CalendarClock size={26} aria-hidden="true" />
          </span>
          <p className={estilos.vacioTitulo}>Su día está despejado</p>
          <p className={estilos.vacioTexto}>
            {mensaje || 'No tiene tareas pendientes para hoy.'}
          </p>
          <p className={estilos.vacioAyuda}>
            Agregue una tarea personal arriba o espere a que le asignen actividades.
          </p>
        </div>
      ) : (
        <>
          {actividadesOrdenadas.length > 0 && (
            <div className={estilos.grupo}>
              <h3 className={estilos.grupoTitulo}>
                Actividades del sistema
                <span className={estilos.grupoCuenta}>{actividadesOrdenadas.length}</span>
              </h3>
              <ul className={estilos.lista}>
                {actividadesOrdenadas.map(({ actividad, atrasada, completada }) => (
                  <ActividadDelDia
                    key={actividad.id}
                    actividad={actividad}
                    atrasada={atrasada}
                    completada={completada}
                    ocupada={enCurso.has(`actividad-${actividad.id}`)}
                    alAlternar={() => alternarActividad(actividad.id, !completada)}
                    alAbrirBloqueo={alAbrirBloqueo}
                  />
                ))}
              </ul>
            </div>
          )}

          {tareasOrdenadas.length > 0 && (
            <div className={estilos.grupo}>
              <h3 className={estilos.grupoTitulo}>
                Tareas personales
                <span className={estilos.grupoCuenta}>{tareasOrdenadas.length}</span>
              </h3>
              <ul className={estilos.lista}>
                {tareasOrdenadas.map((tarea) => (
                  <TareaPersonal
                    key={tarea.id}
                    tarea={tarea}
                    ocupada={enCurso.has(`tarea-${tarea.id}`)}
                    saliendo={eliminando.has(tarea.id)}
                    alAlternar={() => alternarTarea(tarea.id, !tarea.completada)}
                    alEliminar={() => quitarTarea(tarea.id)}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Las actividades sin dia no salen en el panel, pero tampoco se ocultan
          en silencio: sin fecha no son "del dia", y RF-019 no obliga a
          ponersela, asi que su ausencia podria parecer un error. */}
      {!vacio && sinDiaPlanificado > 0 && (
        <p className={estilos.nota} role="status">
          <CalendarClock size={16} aria-hidden="true" />
          Tiene {sinDiaPlanificado} actividad(es) pendiente(s) sin día planificado, que no
          aparecen en este panel.
        </p>
      )}
    </div>
  );
}

/**
 * Una actividad del dia.
 *
 * La prioridad va escrita y ademas marca el borde: el color no es la unica
 * senal, que es lo que RNF-002 pide de una interfaz comprensible.
 *
 * El acceso rapido a "Reportar bloqueo" hereda el proyecto y la etapa de la
 * propia actividad, de modo que la interrupcion queda asociada al proyecto
 * correspondiente sin que el trabajador tenga que volver a elegirlo.
 */
function ActividadDelDia({
  actividad,
  atrasada,
  completada,
  ocupada,
  alAlternar,
  alAbrirBloqueo,
}) {
  return (
    <li
      className={`${estilos.item} ${completada ? estilos.itemCompletada : ''} ${
        atrasada && !completada ? estilos.itemAtrasada : ''
      }`}
    >
      <BotonCheck
        completada={completada}
        ocupada={ocupada}
        etiqueta={`${completada ? 'Desmarcar' : 'Marcar como completada'} la actividad ${
          actividad.descripcion
        }`}
        alAlternar={alAlternar}
      />

      <div className={estilos.itemCuerpo}>
        <p className={estilos.itemTexto}>{actividad.descripcion}</p>

        <div className={estilos.itemMeta}>
          <span className={estilos.contexto}>
            {actividad.proyectoNombre} · {actividad.etapaNombre}
          </span>

          {/* Sin prioridad no se inventa una: D-29 sigue abierta. */}
          {actividad.prioridad && (
            <span
              className={`${estilos.pastilla} ${estilos[`prioridad${actividad.prioridad}`]}`}
            >
              {ETIQUETA_PRIORIDAD[actividad.prioridad]}
            </span>
          )}

          {atrasada && !completada && (
            <span className={estilos.pastillaAtrasada}>
              <TriangleAlert size={12} aria-hidden="true" />
              Atrasada
            </span>
          )}

          {completada && (
            <span className={estilos.pastillaCompletada}>
              <CircleCheck size={12} aria-hidden="true" />
              Completada
            </span>
          )}

          {actividad.fechaPlanificada && (
            <span className={estilos.fecha}>
              Planificada: {formatearFecha(actividad.fechaPlanificada)}
            </span>
          )}
        </div>

        <div className={estilos.itemAcciones}>
          {/* RF-038: "al seleccionar una actividad, debe permitir consultar su
              informacion disponible". La consulta propia y el registro de la
              ejecucion ya existen en Mis actividades (RF-022, HU-16). */}
          <Link className={estilos.enlace} to="/app/mis-actividades">
            Ver y registrar su ejecución
            <span className="solo-lectores"> de la actividad {actividad.id}</span>
          </Link>

          <button
            type="button"
            className={estilos.enlaceBoton}
            onClick={() =>
              alAbrirBloqueo({
                proyectoId: String(actividad.proyectoId),
                etapaId: actividad.etapaId ? String(actividad.etapaId) : '',
              })
            }
          >
            <PauseCircle size={14} aria-hidden="true" />
            Reportar bloqueo
            <span className="solo-lectores"> de la actividad {actividad.id}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

/** Una tarea o recordatorio personal del checklist. */
function TareaPersonal({ tarea, ocupada, saliendo, alAlternar, alEliminar }) {
  return (
    <li
      className={`${estilos.item} ${tarea.completada ? estilos.itemCompletada : ''} ${
        saliendo ? estilos.itemSaliendo : ''
      }`}
    >
      <BotonCheck
        completada={tarea.completada}
        ocupada={ocupada}
        etiqueta={`${tarea.completada ? 'Desmarcar' : 'Marcar como completada'} la tarea ${
          tarea.descripcion
        }`}
        alAlternar={alAlternar}
      />

      <div className={estilos.itemCuerpo}>
        <p className={estilos.itemTexto}>{tarea.descripcion}</p>
        <div className={estilos.itemMeta}>
          <span className={estilos.pastillaPersonal}>
            <Sparkles size={12} aria-hidden="true" />
            Personal
          </span>
          {tarea.completada && (
            <span className={estilos.pastillaCompletada}>
              <CircleCheck size={12} aria-hidden="true" />
              Completada
            </span>
          )}
          <span className={estilos.fecha}>Recordatorio del día</span>
        </div>
      </div>

      <button
        type="button"
        className={estilos.eliminar}
        onClick={alEliminar}
        disabled={ocupada || saliendo}
        aria-label={`Eliminar la tarea ${tarea.descripcion}`}
        title="Eliminar tarea"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

/** Checkbox del checklist, con estado y etiqueta accesibles. */
function BotonCheck({ completada, ocupada, etiqueta, alAlternar }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completada}
      aria-label={etiqueta}
      className={`${estilos.check} ${completada ? estilos.checkHecho : ''}`}
      onClick={alAlternar}
      disabled={ocupada}
    >
      <Check size={14} strokeWidth={3} aria-hidden="true" />
    </button>
  );
}

/** Pendientes primero; dentro de cada grupo, prioridad y luego fecha. */
function ordenarActividades(lista) {
  return [...lista].sort((uno, otro) => {
    if (uno.completada !== otro.completada) {
      return uno.completada ? 1 : -1;
    }
    const prioridadUno = ORDEN_PRIORIDAD[uno.actividad.prioridad] ?? SIN_PRIORIDAD;
    const prioridadOtro = ORDEN_PRIORIDAD[otro.actividad.prioridad] ?? SIN_PRIORIDAD;
    if (prioridadUno !== prioridadOtro) {
      return prioridadUno - prioridadOtro;
    }
    const fechaUno = uno.actividad.fechaPlanificada || '9999-12-31';
    const fechaOtro = otro.actividad.fechaPlanificada || '9999-12-31';
    return fechaUno.localeCompare(fechaOtro) || uno.actividad.id - otro.actividad.id;
  });
}

/** Pendientes primero; dentro de cada grupo, las mas antiguas primero. */
function ordenarTareas(lista) {
  return [...lista].sort((uno, otro) => {
    if (uno.completada !== otro.completada) {
      return uno.completada ? 1 : -1;
    }
    return (uno.creadaEn || '').localeCompare(otro.creadaEn || '') || uno.id - otro.id;
  });
}

/**
 * Notificaciones no leidas de los servicios corporativos (RF-038).
 *
 * El chat entrega la lista de conversaciones con mensajes ajenos sin leer y el
 * total para el indicador. El correo NO: RF-031 lo resuelve como enlace a un
 * servicio externo (D-13), de modo que el aplicativo no puede saber cuantos
 * mensajes sin leer hay al otro lado. Se muestra el estado del acceso y el aviso
 * que redacta el servidor, en lugar de un cero que se leeria como "no tiene
 * correos nuevos".
 */
function Notificaciones({ notificaciones }) {
  const {
    chatNoLeidos,
    conversacionesNoLeidas = [],
    correo,
    avisoCorreoNoLeidos,
  } = notificaciones;

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

          {chatNoLeidos > 0 && conversacionesNoLeidas.length > 0 && (
            <ul className={estilos.listaNotificaciones}>
              {conversacionesNoLeidas.map((conversacion) => (
                <li key={conversacion.id} className={estilos.notificacion}>
                  <Link className={gestion.abrir} to="/app/chat">
                    {conversacion.titulo}
                  </Link>
                  <span className={estilos.indicadorNota}>
                    {conversacion.proyectoNombre}
                    {conversacion.etapaNombre ? ` · ${conversacion.etapaNombre}` : ''}
                  </span>
                  <span className={estilos.notificacionCuenta}>
                    {conversacion.noLeidos} sin leer
                  </span>
                </li>
              ))}
            </ul>
          )}

          {chatNoLeidos > 0 && conversacionesNoLeidas.length === 0 && (
            <Link className={gestion.abrir} to="/app/chat">
              Abrir las conversaciones
            </Link>
          )}

          {chatNoLeidos === 0 && (
            <span className={estilos.indicadorNota}>
              No tiene mensajes sin leer en sus conversaciones.
            </span>
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
 * interrupciones", de modo que abre el formulario que ya existe (RF-024, HU-18)
 * en un modal, con sus mismas validaciones de servidor y una validacion previa
 * en el cliente.
 *
 * El proyecto se asocia automaticamente cuando el acceso viene de una actividad
 * o cuando el trabajador solo participa como desarrollador en un proyecto. Si
 * participa en varios y abre el acceso general, el selector le deja elegir; el
 * servidor vuelve a comprobar la asignacion de todos modos.
 */
function AccesoRapidoABloqueos({
  abierto,
  contexto,
  confirmado,
  alAbrir,
  alCerrar,
  alRegistrar,
}) {
  const cargar = useCallback(
    ({ senal }) => (abierto ? obtenerMisProyectos({ senal }) : Promise.resolve(null)),
    [abierto],
  );
  const misProyectos = usePeticion(cargar, [abierto]);

  const proyectos = (misProyectos.datos?.contenido || [])
    .filter(({ roles }) => roles.includes('DESARROLLADOR'))
    .map(({ proyectoId, proyectoNombre }) => ({
      valor: String(proyectoId),
      texto: proyectoNombre,
    }));

  const proyectoDelContexto = contexto.proyectoId
    ? proyectos.find(({ valor }) => valor === contexto.proyectoId)
    : null;
  const proyectoFijo = Boolean(proyectoDelContexto);
  const proyectoInicial = proyectoFijo
    ? proyectoDelContexto.valor
    : proyectos.length === 1
      ? proyectos[0].valor
      : '';
  const etapaInicial = proyectoFijo ? contexto.etapaId || '' : '';

  return (
    <Seccion
      titulo="Reportar un bloqueo"
      descripcion="Deje constancia de una interrupcion que esta afectando su trabajo."
      id="bloqueo-rapido"
    >
      {confirmado && (
        <p className={gestion.avisoExito} role="status">
          <CircleCheck size={18} aria-hidden="true" />
          {confirmado}
        </p>
      )}

      <Boton variante="secundario" icono={PauseCircle} onClick={() => alAbrir({})}>
        Reportar un bloqueo o interrupcion
      </Boton>

      <Dialogo
        abierto={abierto}
        titulo="Registrar bloqueo o interrupcion"
        descripcion="Indique el tipo, la fecha, la duracion y la etapa. La interrupcion quedara asociada al proyecto y disponible para el lider."
        alCerrar={alCerrar}
      >
        {misProyectos.cargando && <EstadoCarga mensaje="Cargando sus proyectos..." />}

        {!misProyectos.cargando && misProyectos.error && (
          <EstadoError error={misProyectos.error} alReintentar={misProyectos.reintentar} />
        )}

        {!misProyectos.cargando &&
          !misProyectos.error &&
          proyectos.length === 0 && (
            <EstadoVacio
              mensaje="No esta asignado como desarrollador en ningun proyecto, de modo que no hay proyecto sobre el que reportar un bloqueo."
              icono={PauseCircle}
            />
          )}

        {!misProyectos.cargando && !misProyectos.error && proyectos.length > 0 && (
          <FormularioDeInterrupcion
            key={`${proyectoInicial}-${etapaInicial}`}
            proyectos={proyectos}
            proyectoInicial={proyectoInicial}
            etapaInicial={etapaInicial}
            proyectoFijo={proyectoFijo}
            alRegistrar={alRegistrar}
            alCancelar={alCerrar}
          />
        )}
      </Dialogo>
    </Seccion>
  );
}

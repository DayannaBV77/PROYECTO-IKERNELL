import { api, peticion } from './cliente.js';

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * Una sola peticion para las tres cosas que el requerimiento enumera: las
 * actividades del dia con su estado de checklist, las tareas personales, las
 * notificaciones no leidas y los avisos del panel. El servidor las compone para
 * que la pantalla no tenga que pedirlas por separado y combinarlas.
 *
 * El trabajador sale de la sesion, nunca de la peticion: no hay forma de pedir
 * ni modificar el panel de otra persona.
 *
 * Devuelve `{ dia, actividades: [{ actividad, atrasada, completada }],
 * tareasPersonales: [{ id, descripcion, fecha, completada, creadaEn }], total,
 * pendientes, completadas, atrasadas, sinDiaPlanificado, notificaciones: {
 * chatNoLeidos, conversacionesNoLeidas: [{ id, titulo, proyectoNombre,
 * etapaNombre, noLeidos, ... }], correo, avisoCorreoNoLeidos }, mensaje }`.
 *
 * `total`, `pendientes` y `completadas` cuentan actividades y tareas personales
 * juntas. `conversacionesNoLeidas` es la lista que RF-038 pide: cada hilo con
 * mensajes ajenos posteriores a la ultima lectura del trabajador.
 *
 * LIMITACION DECLARADA: `notificaciones` no trae contador ni lista de correo.
 * RF-038 lo pide, pero RF-031 resuelve el correo como enlace a un servicio
 * externo (D-13), de modo que el aplicativo no puede saber cuantos mensajes sin
 * leer hay. Llega el estado del acceso y `avisoCorreoNoLeidos` explicandolo, en
 * lugar de un cero que se leeria como "no tiene correos nuevos".
 */
export function obtenerMiDia(opciones) {
  return api.obtener('/api/mi-dia', opciones);
}

/**
 * Agrega una tarea o recordatorio personal al dia (RF-038).
 *
 * La fecha es opcional: si no se envia, el servidor usa el dia de hoy, que es
 * lo que espera el campo rapido del panel.
 *
 * @param {{ descripcion: string, fecha?: string }} tarea
 */
export function crearTareaMiDia(tarea) {
  return api.crear('/api/mi-dia/tareas', tarea);
}

/**
 * Marca o desmarca una tarea personal (RF-038).
 *
 * El cliente no usa `api` porque este helper no expone PATCH: la operacion es
 * parcial a proposito, solo cambia `completada`.
 */
export function cambiarEstadoTareaMiDia(tareaId, completada) {
  return peticion(`/api/mi-dia/tareas/${tareaId}`, {
    metodo: 'PATCH',
    cuerpo: { completada },
  });
}

/** Quita una tarea personal del panel (RF-038). */
export function eliminarTareaMiDia(tareaId) {
  return api.eliminar(`/api/mi-dia/tareas/${tareaId}`);
}

/**
 * Marca o desmarca una actividad asignada por el sistema (RF-038).
 *
 * No crea un estado paralelo: el servidor finaliza o reabre la ejecucion real
 * de la actividad (RF-022), que es de donde se deriva "pendiente" (D-31).
 */
export function cambiarEstadoActividadMiDia(actividadId, completada) {
  return peticion(`/api/mi-dia/actividades/${actividadId}`, {
    metodo: 'PATCH',
    cuerpo: { completada },
  });
}

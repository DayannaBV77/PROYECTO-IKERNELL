import { api } from './cliente.js';

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * Una sola peticion para las tres cosas que el requerimiento enumera: las
 * actividades pendientes del dia ordenadas por prioridad, las notificaciones no
 * leidas y los avisos del panel. El servidor las compone para que la pantalla no
 * tenga que pedirlas por separado y combinarlas.
 *
 * El trabajador sale de la sesion, nunca de la peticion: no hay forma de pedir
 * el panel de otra persona.
 *
 * Devuelve `{ dia, actividades: [{ actividad, atrasada }], total, atrasadas,
 * sinDiaPlanificado, notificaciones: { chatNoLeidos, correo,
 * avisoCorreoNoLeidos }, mensaje }`.
 *
 * LIMITACION DECLARADA: `notificaciones` no trae contador de correo. RF-038 lo
 * pide, pero RF-031 resuelve el correo como enlace a un servicio externo (D-13),
 * de modo que el aplicativo no puede saber cuantos mensajes sin leer hay. Llega
 * el estado del acceso y `avisoCorreoNoLeidos` explicandolo, en lugar de un cero
 * que se leeria como "no tiene correos nuevos".
 */
export function obtenerMiDia(opciones) {
  return api.obtener('/api/mi-dia', opciones);
}

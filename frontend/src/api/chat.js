import { api, construirConsulta } from './cliente.js';

/**
 * Hilos de conversacion por proyecto y etapa (RF-037, HU-22).
 *
 * El servidor decide quien entra: exige una asignacion activa en el proyecto,
 * con cualquier rol, y responde 403 a quien no participa (HU-22 C04). Esta capa
 * no filtra nada por su cuenta.
 *
 * NO cubre RF-028 (chat corporativo libre: conversaciones individuales, grupos,
 * disponibilidad), que sigue sin definir por D-12.
 */

/** HU-22 C01 y C03: hilos del proyecto; con `etapaId`, solo los de esa etapa. */
export function obtenerHilos(proyectoId, etapaId, opciones) {
  return api.obtener(
    `/api/proyectos/${proyectoId}/hilos${construirConsulta({ etapaId })}`,
    opciones,
  );
}

/**
 * RF-037, HU-22 C03: crea un hilo.
 *
 * Sin `etapaId` el hilo es del proyecto; con el queda vinculado a esa etapa.
 */
export function crearHilo(proyectoId, datos) {
  return api.crear(`/api/proyectos/${proyectoId}/hilos`, datos);
}

/** Datos del hilo, incluido su contador de mensajes sin leer. */
export function obtenerHilo(hiloId, opciones) {
  return api.obtener(`/api/hilos/${hiloId}`, opciones);
}

/**
 * HU-22 C05: mensajes del hilo, con autor y fecha.
 *
 * Consultarlos marca el hilo como leido en el servidor, de modo que el contador
 * de no leidos baja al abrirlo.
 */
export function obtenerMensajes(hiloId, opciones) {
  return api.obtener(`/api/hilos/${hiloId}/mensajes`, opciones);
}

/**
 * RF-037, HU-22 C02: envia un mensaje al hilo.
 *
 * Solo viaja el texto. El autor y la fecha los pone el servidor a partir de la
 * sesion, asi que no hay forma de escribir en nombre de otra persona.
 */
export function enviarMensaje(hiloId, cuerpo) {
  return api.crear(`/api/hilos/${hiloId}/mensajes`, { cuerpo });
}

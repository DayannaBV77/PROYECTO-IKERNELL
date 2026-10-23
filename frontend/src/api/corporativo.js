import { api, construirConsulta } from './cliente.js';

/**
 * Servicios internos del trabajador autenticado (RF-029, RF-030, RF-031).
 *
 * Los tres los ofrece el backend a cualquiera de los tres tipos de trabajador:
 * basta la sesion iniciada (HU-20, HU-21). No incluye el chat corporativo
 * (RF-028) porque el backend no lo implementa: D-12 deja sin definir sus
 * funciones y si vive dentro del aplicativo o en un servicio externo.
 */

/** RF-029, HU-21 C01: biblioteca de programas, con busqueda del servidor. */
export function obtenerProgramas(busqueda, opciones) {
  return api.obtener(`/api/corporativo/programas${construirConsulta({ busqueda })}`, opciones);
}

/** RF-029, HU-21 C02: detalle del programa con su enlace autorizado. */
export function obtenerPrograma(id, opciones) {
  return api.obtener(`/api/corporativo/programas/${id}`, opciones);
}

/** RF-030, HU-21 C03: tutoriales de programacion. */
export function obtenerTutoriales(busqueda, opciones) {
  return api.obtener(`/api/corporativo/tutoriales${construirConsulta({ busqueda })}`, opciones);
}

/** RF-030, HU-21 C03: contenido del tutorial. */
export function obtenerTutorial(id, opciones) {
  return api.obtener(`/api/corporativo/tutoriales/${id}`, opciones);
}

/**
 * RF-031, HU-20 C04 y C05: acceso al correo corporativo.
 *
 * Responde `{ disponible, url }` o `{ disponible: false, mensaje }`. El aviso
 * de indisponibilidad lo redacta el servidor; el cliente no escribe uno propio.
 */
export function obtenerAccesoCorreo(opciones) {
  return api.obtener('/api/corporativo/correo', opciones);
}

import { api, construirConsulta } from './cliente.js';

/**
 * Actividades de los desarrolladores (RF-019 a RF-022; HU-13, HU-16).
 *
 * Dos caras del mismo dato con permisos distintos:
 *
 *  - /api/actividades lo gestiona el lider: registra, busca y modifica la
 *    planificacion del equipo.
 *  - /api/mis-actividades lo consulta cada trabajador sobre lo suyo. No lleva
 *    restriccion por tipo a proposito: HU-16 C05 incluye al lider asignado como
 *    desarrollador en otro proyecto, y limitarlo al tipo global lo dejaria
 *    fuera (RN-05).
 */

/**
 * RF-019, HU-13 C01: registra una actividad en una etapa del proyecto.
 *
 * `confirmado` cubre D-24: si el desarrollador no esta asignado al proyecto, el
 * servidor responde 409 con la advertencia y no guarda nada; se repite con
 * `confirmado=true` para continuar.
 */
export function registrarActividad(proyectoId, datos, confirmado = false) {
  return api.crear(`/api/actividades/proyecto/${proyectoId}?confirmado=${confirmado}`, datos);
}

/** RF-020, HU-13 C03 y C04: busca por proyecto, etapa, desarrollador o id. */
export function buscarActividades(criterios, opciones) {
  return api.obtener(`/api/actividades${construirConsulta(criterios)}`, opciones);
}

/** RF-020, HU-13 C03: abre el detalle para revisarla. */
export function obtenerActividad(id, opciones) {
  return api.obtener(`/api/actividades/${id}`, opciones);
}

/**
 * RF-021, HU-13 C05: modifica la actividad ante una eventualidad.
 *
 * Admite etapa y descripcion. El desarrollador no se puede cambiar: RF-021
 * ordena conservar esa asociacion, y el servidor no acepta el campo.
 */
export function modificarActividad(id, datos) {
  return api.reemplazar(`/api/actividades/${id}`, datos);
}

/** HU-16 C01 y C04: las actividades asignadas a quien tiene la sesion abierta. */
export function obtenerMisActividades(opciones) {
  return api.obtener('/api/mis-actividades', opciones);
}

/**
 * RF-022, HU-16 C02: registra la ejecucion de una actividad propia.
 *
 * Los dos campos son opcionales porque la empresa aun no define que debe
 * registrarse al ejecutar (D-04); lo unico que el criterio exige es que la
 * ejecucion quede guardada. Ejecutar una actividad ajena o inexistente lo
 * rechaza el servidor (C03).
 */
export function registrarEjecucion(actividadId, datos) {
  return api.crear(`/api/mis-actividades/${actividadId}/ejecucion`, datos);
}

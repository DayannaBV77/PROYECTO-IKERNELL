import { api } from './cliente.js';

/**
 * Errores e interrupciones de un proyecto (RF-023, RF-024; HU-17, HU-18).
 *
 * Quien registra es el desarrollador, pero el servidor no se queda en el tipo
 * global: exige una asignacion activa como desarrollador EN ESE proyecto. Es el
 * nivel 2 de autorizacion, y es lo que permite que un lider asignado como
 * desarrollador en otro proyecto registre alli sus incidencias (RN-05).
 */

/** Unidades en que se expresa la duracion de una interrupcion. */
export const UNIDADES_DURACION = [
  { valor: 'HORAS', texto: 'Horas' },
  { valor: 'DIAS', texto: 'Dias' },
];

export const ETIQUETA_UNIDAD = {
  HORAS: 'horas',
  DIAS: 'dias',
};

/**
 * Catalogo de fases del proyecto.
 *
 * Abierto a cualquier trabajador autenticado: sin el, el desarrollador no
 * tendria de donde escoger la fase que RN-10 le exige indicar.
 */
export function obtenerFases(opciones) {
  return api.obtener('/api/fases', opciones);
}

/** RF-023, HU-17 C01: registra un error encontrado en el proyecto. */
export function registrarError(proyectoId, datos) {
  return api.crear(`/api/proyectos/${proyectoId}/errores`, datos);
}

/** RF-024, HU-18 C01: registra una interrupcion que afecto al proyecto. */
export function registrarInterrupcion(proyectoId, datos) {
  return api.crear(`/api/proyectos/${proyectoId}/interrupciones`, datos);
}

/** HU-18 C04: interrupciones registradas del proyecto. Las consulta el lider. */
export function obtenerInterrupciones(proyectoId, opciones) {
  return api.obtener(`/api/proyectos/${proyectoId}/interrupciones`, opciones);
}

/** Errores registrados del proyecto. Los consulta el lider. */
export function obtenerErrores(proyectoId, opciones) {
  return api.obtener(`/api/proyectos/${proyectoId}/errores`, opciones);
}

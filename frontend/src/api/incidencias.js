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
 * Etiqueta de la fase de una incidencia.
 *
 * D-36: la fase es la etapa del proyecto, y la respuesta trae `etapaNombre`.
 * Los registros anteriores a esa decision no tienen etapa y conservan en
 * `faseHistorica` el nombre de la fase del catalogo retirado (D-37); el
 * servidor entrega los dos campos por separado para no presentar uno como el
 * otro, y aqui se elige el que corresponda con la marca que lo distingue.
 *
 * La lista de etapas entre las que escoger NO esta en este modulo: la sirve el
 * de proyectos (`obtenerEtapas`), que es a quien pertenece.
 */
export function etiquetaDeFase({ etapaNombre, faseHistorica } = {}) {
  if (etapaNombre) {
    return etapaNombre;
  }
  return faseHistorica ? `${faseHistorica} (fase anterior)` : '';
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

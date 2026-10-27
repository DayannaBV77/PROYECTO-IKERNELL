import { api, construirConsulta } from './cliente.js';

/**
 * Gestion de proyectos (RF-008, RF-013 a RF-015; HU-08, HU-09).
 *
 * El backend reserva el modulo al lider de proyectos. Queda abierta A-02: no se
 * comprueba que el lider sea el responsable DEL proyecto concreto, asi que
 * cualquier lider gestiona cualquier proyecto mientras no se confirme.
 */

/** Estados de habilitacion; el mismo dominio cerrado que en trabajadores. */
export const ESTADOS_HABILITACION = [
  { valor: 'HABILITADO', texto: 'Habilitado' },
  { valor: 'INHABILITADO', texto: 'Inhabilitado' },
];

export function etiquetaEstadoOperativo(estado) {
  return {
    EN_EJECUCION: 'En ejecución',
    FINALIZADO: 'Finalizado',
  }[estado] || estado || 'Sin iniciar';
}

/** RF-013, HU-09 C01 y C02: busca por identificador, nombre o estado. */
export function buscarProyectos(criterios, opciones) {
  return api.obtener(`/api/proyectos${construirConsulta(criterios)}`, opciones);
}

/** RF-013, HU-09 C01: abre el detalle. */
export function obtenerProyecto(id, opciones) {
  return api.obtener(`/api/proyectos/${id}`, opciones);
}

/**
 * RF-008, HU-08 C01: registra el proyecto.
 *
 * El identificador lo asigna el servidor y por eso no viaja en la peticion; es
 * lo que hace cierto HU-08 C03, que exige que ninguno se repita.
 */
export function registrarProyecto(datos) {
  return api.crear('/api/proyectos', datos);
}

/** RF-014, HU-09 C03: modifica nombre y descripcion. */
export function modificarProyecto(id, datos) {
  return api.reemplazar(`/api/proyectos/${id}`, datos);
}

/** Registra la fecha real de inicio del proyecto. */
export function iniciarProyecto(id) {
  return api.crear(`/api/proyectos/${id}/inicio`);
}

/** Registra la fecha real de finalizacion del proyecto. */
export function finalizarProyecto(id) {
  return api.crear(`/api/proyectos/${id}/finalizacion`);
}

/**
 * Advertencias previas a inhabilitar (HU-09 C05).
 *
 * El backend las expone aparte para que la interfaz pueda mostrarlas ANTES de
 * pedir la confirmacion. Devuelve una lista de textos, vacia cuando no hay
 * ninguna. Hoy esta siempre vacia: HU-09 T5 deja a la empresa definir que
 * cuenta como "actividades pendientes o dependencias", y el mecanismo del
 * servidor ya esta listo para cuando se definan.
 */
export function advertenciasDeInhabilitacion(id, opciones) {
  return api.obtener(`/api/proyectos/${id}/inhabilitacion/advertencias`, opciones);
}

/**
 * RF-015, HU-09 C05: inhabilita conservando el historial.
 *
 * `confirmado` viaja al servidor porque la confirmacion no es solo cosa de la
 * interfaz: con advertencias pendientes y sin confirmar, el backend responde
 * 409 con la lista y no modifica nada, de modo que el paso no se pueda omitir
 * ni llamando directamente a la API.
 */
export function inhabilitarProyecto(id, confirmado = false) {
  return api.crear(`/api/proyectos/${id}/inhabilitacion?confirmado=${confirmado}`);
}

/**
 * RF-016, HU-12: estado del proyecto y datos de avance disponibles.
 *
 * No devuelve un porcentaje: la formula de avance no esta definida (D-03), asi
 * que el servidor entrega conteos crudos, el aviso cuando aun no hay nada de lo
 * que derivar un avance (C02) y que falta para poder calcularlo.
 */
export function obtenerEstadoProyecto(id, opciones) {
  return api.obtener(`/api/proyectos/${id}/estado`, opciones);
}

/** RF-009, HU-10 C05: equipo de desarrolladores asignado al proyecto. */
export function obtenerEquipo(proyectoId, opciones) {
  return api.obtener(`/api/proyectos/${proyectoId}/equipo`, opciones);
}

/**
 * RF-009, HU-10 C01: desarrolladores que se pueden asignar ahora mismo.
 *
 * El servidor ya descarta a los inhabilitados y a los que tienen una asignacion
 * activa en el proyecto, que son los dos casos que la asignacion rechazaria.
 */
export function obtenerCandidatos(proyectoId, opciones) {
  return api.obtener(`/api/proyectos/${proyectoId}/equipo/candidatos`, opciones);
}

/**
 * RF-009, HU-10 C01: asigna uno o varios desarrolladores.
 *
 * Responde 200 con `{ asignados, rechazados }` incluso cuando alguno se
 * rechaza: HU-10 C03 descarta al desarrollador inhabilitado concreto, no al
 * lote entero. Un proyecto inhabilitado si detiene la operacion completa y
 * responde 409 (C02).
 */
export function asignarDesarrolladores(proyectoId, desarrolladorIds) {
  return api.crear(`/api/proyectos/${proyectoId}/equipo`, { desarrolladorIds });
}

/** Rol con que un trabajador participa en un proyecto. */
export const ETIQUETA_ROL = {
  LIDER: 'Lider',
  DESARROLLADOR: 'Desarrollador',
};

/**
 * Etapas de un proyecto (RF-010 a RF-012, HU-11).
 *
 * Cuelgan del proyecto en la ruta porque una etapa no existe por si sola: el
 * backend las expone bajo /api/proyectos/{id}/etapas.
 */

/** Lista las etapas del proyecto, origen de la seleccion de HU-11. */
export function obtenerEtapas(proyectoId, opciones) {
  return api.obtener(`/api/proyectos/${proyectoId}/etapas`, opciones);
}

/** RF-010, HU-11 C01. */
export function registrarEtapa(proyectoId, datos) {
  return api.crear(`/api/proyectos/${proyectoId}/etapas`, datos);
}

/** RF-011, HU-11 C03. */
export function modificarEtapa(proyectoId, etapaId, datos) {
  return api.reemplazar(`/api/proyectos/${proyectoId}/etapas/${etapaId}`, datos);
}

/**
 * RF-012, HU-11 C04 y C05: elimina la etapa.
 *
 * Es la unica operacion de borrado real del sistema; el resto inhabilita
 * (RN-02). Se permite porque una etapa mal creada es un error de estructura, no
 * un hecho historico. Si tiene actividades u otros registros asociados, el
 * servidor responde 409 y no borra nada (C05).
 */
export function eliminarEtapa(proyectoId, etapaId) {
  return api.eliminar(`/api/proyectos/${proyectoId}/etapas/${etapaId}`);
}

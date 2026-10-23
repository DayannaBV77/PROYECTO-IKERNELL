import { api } from './cliente.js';

/**
 * Asignacion de trabajadores a proyectos por el coordinador (RF-003, HU-06).
 *
 * No confundir con el equipo de HU-10: alli es el lider quien asigna
 * desarrolladores a SU proyecto, y aqui es el coordinador quien deja registrado
 * en que proyecto participa cada persona, con el rol que le corresponda.
 */

/** Roles con que un trabajador puede participar en un proyecto. */
export const ROLES_EN_PROYECTO = [
  { valor: 'LIDER', texto: 'Lider' },
  { valor: 'DESARROLLADOR', texto: 'Desarrollador' },
];

export const ETIQUETA_ROL = {
  LIDER: 'Lider',
  DESARROLLADOR: 'Desarrollador',
};

/**
 * RF-003, HU-06 C01: proyectos a los que se puede asignar.
 *
 * Existe porque la gestion de proyectos esta reservada al lider y responde 403
 * al coordinador: sin esta lista tendria que conocer los identificadores de
 * memoria. Devuelve solo los habilitados.
 */
export function obtenerProyectosAsignables(opciones) {
  return api.obtener('/api/asignaciones/proyectos-asignables', opciones);
}

/**
 * RF-003, HU-06 C01: registra la asignacion.
 *
 * `confirmado` cubre C04: con una asignacion equivalente ya activa el servidor
 * responde 409 con la advertencia y no registra nada, para que el coordinador
 * la revise antes de continuar.
 */
export function asignarTrabajador(datos, confirmado = false) {
  return api.crear(`/api/asignaciones?confirmado=${confirmado}`, datos);
}

/** HU-06 C05: asignaciones registradas de un trabajador. */
export function asignacionesDeTrabajador(trabajadorId, opciones) {
  return api.obtener(`/api/asignaciones/trabajador/${trabajadorId}`, opciones);
}

/** HU-06 C05: asignaciones registradas de un proyecto. */
export function asignacionesDeProyecto(proyectoId, opciones) {
  return api.obtener(`/api/asignaciones/proyecto/${proyectoId}`, opciones);
}

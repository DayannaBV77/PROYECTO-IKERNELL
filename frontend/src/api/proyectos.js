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

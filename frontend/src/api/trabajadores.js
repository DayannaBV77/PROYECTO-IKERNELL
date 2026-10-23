import { api, construirConsulta, peticion } from './cliente.js';

/**
 * Gestion de trabajadores (RF-001, RF-002, RF-004, RF-005, RF-007; HU-04, HU-05).
 *
 * Todo el modulo esta reservado al coordinador de proyectos en el servidor. El
 * cliente solo evita ofrecer lo que iba a ser rechazado; la restriccion real la
 * aplica @PreAuthorize.
 */

/** Tipos de trabajador, para las listas desplegables. */
export const TIPOS_TRABAJADOR = [
  { valor: 'COORDINADOR', texto: 'Coordinador de proyectos' },
  { valor: 'LIDER', texto: 'Lider de proyectos' },
  { valor: 'DESARROLLADOR', texto: 'Desarrollador' },
];

/** Estados de habilitacion (RF-007, RN-02: inhabilitar no borra). */
export const ESTADOS_HABILITACION = [
  { valor: 'HABILITADO', texto: 'Habilitado' },
  { valor: 'INHABILITADO', texto: 'Inhabilitado' },
];

export const ETIQUETA_ESTADO = {
  HABILITADO: 'Habilitado',
  INHABILITADO: 'Inhabilitado',
};

/**
 * RF-004, HU-05 C01 y C02: busca por uno o varios criterios.
 *
 * Los criterios vacios no se envian (los descarta construirConsulta), de modo
 * que una busqueda sin datos devuelve el listado completo paginado.
 */
export function buscarTrabajadores(criterios, opciones) {
  return api.obtener(`/api/trabajadores${construirConsulta(criterios)}`, opciones);
}

/** RF-004, HU-05 C01: abre el perfil completo. */
export function obtenerTrabajador(id, opciones) {
  return api.obtener(`/api/trabajadores/${id}`, opciones);
}

/** RF-001, HU-04 C01: registra el perfil. Responde 201 con el perfil creado. */
export function registrarTrabajador(datos) {
  return api.crear('/api/trabajadores', datos);
}

/**
 * RF-005, HU-05 C03: modifica los campos autorizados.
 *
 * Solo direccion, especialidad y tipo: la identificacion no es editable y el
 * backend no admite enviarla.
 */
export function modificarTrabajador(id, datos) {
  return api.reemplazar(`/api/trabajadores/${id}`, datos);
}

/**
 * RF-007, HU-05 C05: inhabilita conservando el historial.
 *
 * No es un DELETE porque no se borra nada (RN-02). El paso de confirmacion lo
 * pone la interfaz; el servidor solo registra el cambio de estado.
 */
export function inhabilitarTrabajador(id) {
  return api.crear(`/api/trabajadores/${id}/inhabilitacion`);
}

/**
 * RF-002, HU-04 C04: adjunta o reemplaza la fotografia.
 *
 * Va como multipart: el navegador fija el Content-Type con su boundary, y por
 * eso se usa `formulario` en vez de `cuerpo`. El formato y el tamano los valida
 * el servidor con los limites que la empresa configure (HU-04 C05); el cliente
 * no los duplica porque no los conoce.
 */
export function adjuntarFotografia(id, archivo) {
  const formulario = new FormData();
  formulario.append('fotografia', archivo);
  return peticion(`/api/trabajadores/${id}/fotografia`, { metodo: 'POST', formulario });
}

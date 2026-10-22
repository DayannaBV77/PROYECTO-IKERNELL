import { api, construirConsulta } from './cliente.js';

/**
 * Informacion empresarial publica (RF-026, RF-032 a RF-036, HU-01) y
 * formulario de consultas (RF-035, HU-02).
 *
 * Son los unicos endpoints que el backend abre sin autenticacion.
 */

/** Las seis secciones que enumera HU-01 C01. No hay mas; el enum es cerrado. */
export const TIPOS_CONTENIDO = {
  LINEAMIENTO: 'LINEAMIENTO',
  PORTAFOLIO_SERVICIO: 'PORTAFOLIO_SERVICIO',
  NOTICIA: 'NOTICIA',
  PREGUNTA_FRECUENTE: 'PREGUNTA_FRECUENTE',
  ENLACE_INTERES: 'ENLACE_INTERES',
  INFORMACION_CONTACTO: 'INFORMACION_CONTACTO',
};

/** RF-026: las seis secciones de una sola vez, para la pagina de inicio. */
export function obtenerInformacionEmpresarial(opciones) {
  return api.obtener('/api/publico/informacion-empresarial', opciones);
}

/**
 * Una seccion concreta.
 *
 * @param {string} tipo     uno de TIPOS_CONTENIDO
 * @param {string} busqueda termino opcional; solo preguntas frecuentes lo
 *                          contempla como requisito (RF-034)
 */
export function obtenerSeccion(tipo, busqueda, opciones) {
  return api.obtener(`/api/publico/secciones/${tipo}${construirConsulta({ busqueda })}`, opciones);
}

/** RF-035, HU-02: envia una consulta sin iniciar sesion. */
export function enviarConsulta(datos) {
  return api.crear('/api/publico/consultas', datos);
}

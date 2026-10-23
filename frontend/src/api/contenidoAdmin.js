import { api, construirConsulta } from './cliente.js';

/**
 * Administracion del contenido publico y de las consultas recibidas.
 *
 * TODO ESTE MODULO ES UNA PROPUESTA, igual que el controlador que lo atiende:
 * ningun requerimiento lo describe. RF-032 admite textualmente que "el proceso
 * para actualizarlo debe definirse con la empresa", y HU-02 T2 deja abierto
 * quien recibe y atiende las consultas. Sin estas pantallas, el contenido solo
 * podria entrar manipulando la base de datos -como hace el script de carga
 * inicial- y las consultas recibidas no serian legibles por nadie.
 *
 * Queda pendiente D-26: se reserva al coordinador por ser el rol mas
 * administrativo, pero la empresa debe confirmar quien administra esto.
 */

/** Las seis secciones, con el nombre que ve el administrador. */
export const SECCIONES = [
  { valor: 'LINEAMIENTO', texto: 'Lineamientos' },
  { valor: 'PORTAFOLIO_SERVICIO', texto: 'Portafolio de servicios' },
  { valor: 'NOTICIA', texto: 'Noticias' },
  { valor: 'PREGUNTA_FRECUENTE', texto: 'Preguntas frecuentes' },
  { valor: 'ENLACE_INTERES', texto: 'Enlaces de interes' },
  { valor: 'INFORMACION_CONTACTO', texto: 'Informacion de contacto' },
];

/**
 * Que exige cada seccion, segun las reglas que aplica el servidor.
 *
 * Un enlace de interes sin destino no cumple RF-036, y una pregunta frecuente
 * sin respuesta no cumple RF-034. Aqui solo se usa para orientar al que
 * escribe; quien valida es el servidor.
 */
export const EXIGENCIA_DE_SECCION = {
  ENLACE_INTERES: 'Esta seccion exige un enlace de destino.',
  PREGUNTA_FRECUENTE: 'Esta seccion exige la respuesta en el cuerpo.',
};

/** Contenido de una seccion, incluidos los borradores sin publicar. */
export function obtenerContenido(tipo, opciones) {
  return api.obtener(`/api/admin/contenido${construirConsulta({ tipo })}`, opciones);
}

/** Crea una pieza. Nace sin publicar, para que nada aparezca por descuido. */
export function crearContenido(datos) {
  return api.crear('/api/admin/contenido', datos);
}

export function actualizarContenido(id, datos) {
  return api.reemplazar(`/api/admin/contenido/${id}`, datos);
}

/**
 * Publica o retira una pieza.
 *
 * No hay borrado: retirar de la pagina se hace despublicando, coherente con
 * RN-02, que en el resto del sistema conserva lo registrado y solo cambia su
 * estado.
 */
export function cambiarPublicacion(id, publicada) {
  return api.crear(`/api/admin/contenido/${id}/publicacion?publicada=${publicada}`);
}

/** RF-035: consultas recibidas por el formulario publico. */
export function obtenerConsultas(atendida, opciones) {
  return api.obtener(`/api/admin/consultas${construirConsulta({ atendida })}`, opciones);
}

/** Marca una consulta como atendida y deja constancia de quien la atendio. */
export function marcarConsultaAtendida(id) {
  return api.crear(`/api/admin/consultas/${id}/atencion`);
}

import { api, construirConsulta } from './cliente.js';
import { ErrorApi, MENSAJE_INESPERADO, MENSAJE_RED } from './errores.js';

/**
 * Reportes (RF-006, RF-017, RF-018; HU-07, HU-14, HU-15).
 *
 * Cada uno tiene su actor: el desempeno es del coordinador y los dos de
 * proyecto son del lider. Ninguno devuelve indicadores calculados -ni
 * porcentajes de avance ni promedios- porque las formulas no estan definidas
 * (D-03, D-04): el servidor entrega los registros y sus conteos, y dice que
 * falta para poder calcular algo mas.
 */

/**
 * RF-006, HU-07: desempeno y actividades de un desarrollador en un proyecto.
 *
 * El periodo es opcional. Si la fecha inicial es posterior a la final, el
 * servidor lo rechaza con su propio mensaje.
 */
export function reporteDeDesempeno(criterios, opciones) {
  return api.obtener(`/api/reportes/desempeno${construirConsulta(criterios)}`, opciones);
}

/** RF-018, HU-14: actividades de un proyecto, con filtro por etapa y por desarrollador. */
export function reporteDeActividades(proyectoId, criterios, opciones) {
  return api.obtener(
    `/api/reportes/proyectos/${proyectoId}/actividades${construirConsulta(criterios)}`,
    opciones,
  );
}

/** RF-017, HU-15: interrupciones de un proyecto dentro de un periodo. */
export function reporteDeInterrupciones(proyectoId, criterios, opciones) {
  return api.obtener(
    `/api/reportes/proyectos/${proyectoId}/interrupciones${construirConsulta(criterios)}`,
    opciones,
  );
}

/**
 * RF-025, HU-19: genera y descarga el archivo plano.
 *
 * No pasa por `peticion()` porque la respuesta no es JSON ni texto plano que
 * interese como cadena: es un archivo que hay que entregar al navegador tal
 * cual, con su codificacion intacta.
 *
 * Se descarga entera antes de devolverla, y los errores se traducen al mismo
 * ErrorApi que el resto del cliente. Asi HU-19 C03 y C04 llegan como mensaje
 * -no hay informacion, o fallo la generacion- en lugar de como una descarga
 * vacia o una pagina de error del navegador, que es justo lo que C04 descarta.
 *
 * @returns {Promise<{nombre: string, blob: Blob}>}
 */
export async function descargarArchivoPlano(proyectoIds = []) {
  const ruta = `/api/reportes/archivo-plano${construirConsulta({
    // La lista viaja repetida, que es como Spring espera un List<Long>.
    proyectoIds: proyectoIds.length > 0 ? proyectoIds.join(',') : '',
  })}`;

  let respuesta;
  try {
    respuesta = await fetch(ruta, { credentials: 'include' });
  } catch {
    throw new ErrorApi({ estado: 0, mensaje: MENSAJE_RED });
  }

  if (!respuesta.ok) {
    // El servidor responde con el cuerpo de error habitual; se reutiliza su
    // mensaje en lugar de redactar uno propio.
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorApi({
      estado: respuesta.status,
      mensaje: cuerpo?.mensaje || MENSAJE_INESPERADO,
    });
  }

  return {
    nombre: nombreDeLaDescarga(respuesta) || 'ikernell-proyectos.txt',
    blob: await respuesta.blob(),
  };
}

/** Lee el nombre que el servidor propone en Content-Disposition. */
function nombreDeLaDescarga(respuesta) {
  const cabecera = respuesta.headers.get('content-disposition') || '';
  const coincidencia = cabecera.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
}

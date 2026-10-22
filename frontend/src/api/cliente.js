import { obtenerTokenCsrf } from './csrf.js';
import { ErrorApi, MENSAJE_INESPERADO, MENSAJE_RED } from './errores.js';

/**
 * Punto unico de salida hacia la API.
 *
 * Centraliza lo que el backend exige y que seria un error repetir en cada
 * vista:
 *
 *  1. `credentials: 'include'`: la sesion vive en la cookie JSESSIONID, no en
 *     una cabecera Authorization.
 *  2. CSRF: el token se pide a /api/auth/csrf y viaja en X-XSRF-TOKEN en toda
 *     peticion que modifique datos. Si caduca, se renueva y se reintenta una
 *     vez (ver csrf.js).
 *  3. Traduccion de `ErrorRespuesta` a un ErrorApi con `campos` y
 *     `advertencias`.
 *  4. Respuestas 204 sin cuerpo.
 *
 * La URL base es relativa a proposito: en desarrollo el proxy de Vite reenvia
 * /api al backend, de modo que el navegador ve un unico origen y la cookie de
 * sesion viaja sin configuracion adicional.
 */

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Construye la query string descartando los parametros vacios. */
export function construirConsulta(parametros = {}) {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      busqueda.append(clave, String(valor));
    }
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : '';
}

async function interpretarError(respuesta) {
  const cuerpo = await respuesta.json().catch(() => null);

  return new ErrorApi({
    estado: respuesta.status,
    mensaje: cuerpo?.mensaje || MENSAJE_INESPERADO,
    campos: cuerpo?.campos ?? null,
    advertencias: cuerpo?.advertencias ?? null,
  });
}

async function enviar(ruta, { metodo, cuerpo, formulario, senal }, tokenCsrf) {
  const cabeceras = {};
  let contenido;

  if (formulario) {
    // El navegador fija el Content-Type con el boundary; no se debe tocar.
    contenido = formulario;
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    contenido = JSON.stringify(cuerpo);
  }

  if (tokenCsrf) {
    cabeceras['X-XSRF-TOKEN'] = tokenCsrf;
  }

  try {
    return await fetch(ruta, {
      method: metodo,
      credentials: 'include',
      headers: cabeceras,
      body: contenido,
      signal: senal,
    });
  } catch (fallo) {
    if (fallo?.name === 'AbortError') {
      throw fallo;
    }
    throw new ErrorApi({ estado: 0, mensaje: MENSAJE_RED });
  }
}

/**
 * Ejecuta una peticion contra la API.
 *
 * @param {string} ruta     ruta absoluta que empieza por /api
 * @param {object} opciones metodo, cuerpo (objeto JSON) o formulario
 * @returns {Promise<any>}  cuerpo de la respuesta, o null si fue 204
 */
export async function peticion(ruta, opciones = {}) {
  const { metodo = 'GET' } = opciones;
  const modifica = !METODOS_SEGUROS.has(metodo);

  let respuesta = await enviar(ruta, { ...opciones, metodo }, modifica ? await obtenerTokenCsrf() : null);

  // Un 403 en una operacion de escritura puede deberse a un token caducado
  // -el servidor renueva la sesion al autenticar- y no a una falta de permiso.
  // Se renueva y se reintenta una sola vez; si era falta de permiso, el
  // segundo intento devuelve el mismo 403 con su mensaje, sin efecto alguno.
  if (modifica && respuesta.status === 403) {
    const renovado = await obtenerTokenCsrf({ forzar: true });
    if (renovado) {
      respuesta = await enviar(ruta, { ...opciones, metodo }, renovado);
    }
  }

  if (!respuesta.ok) {
    throw await interpretarError(respuesta);
  }

  if (respuesta.status === 204) {
    return null;
  }

  const tipo = respuesta.headers.get('content-type') || '';
  return tipo.includes('application/json') ? respuesta.json() : respuesta.text();
}

export const api = {
  obtener: (ruta, opciones) => peticion(ruta, { ...opciones, metodo: 'GET' }),
  crear: (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'POST', cuerpo }),
  reemplazar: (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'PUT', cuerpo }),
  eliminar: (ruta, opciones) => peticion(ruta, { ...opciones, metodo: 'DELETE' }),
};

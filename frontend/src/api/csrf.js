/**
 * Token CSRF.
 *
 * El backend protege con CSRF toda peticion que modifica datos y guarda el
 * token en la cookie XSRF-TOKEN. Esa cookie NO sirve para rellenar la cabecera:
 * Spring Security aplica por defecto su proteccion contra BREACH, que enmascara
 * el token en cada resolucion. La cookie conserva el valor en crudo, mientras
 * que el servidor solo acepta el valor enmascarado.
 *
 * Comprobado contra la API: enviar el valor de la cookie responde 403, y enviar
 * el que devuelve GET /api/auth/csrf responde 200. Por eso el token se pide
 * siempre a ese endpoint y nunca se lee de document.cookie.
 *
 * El valor se guarda en memoria y se descarta cuando la sesion cambia, porque
 * al iniciar o cerrar sesion el servidor renueva la sesion y con ella el token.
 */

let tokenEnMemoria = null;
let peticionEnCurso = null;

/** Descarta el token guardado. Se invoca al iniciar y al cerrar sesion. */
export function invalidarTokenCsrf() {
  tokenEnMemoria = null;
  peticionEnCurso = null;
}

/**
 * Devuelve el token vigente, pidiendolo si hace falta.
 *
 * Las peticiones simultaneas comparten una sola solicitud: sin esto, varias
 * operaciones lanzadas a la vez pediran cada una su token.
 */
export async function obtenerTokenCsrf({ forzar = false } = {}) {
  if (forzar) {
    invalidarTokenCsrf();
  }
  if (tokenEnMemoria) {
    return tokenEnMemoria;
  }
  if (!peticionEnCurso) {
    peticionEnCurso = fetch('/api/auth/csrf', { credentials: 'include' })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((cuerpo) => {
        tokenEnMemoria = cuerpo?.token ?? null;
        return tokenEnMemoria;
      })
      .catch(() => null)
      .finally(() => {
        peticionEnCurso = null;
      });
  }
  return peticionEnCurso;
}

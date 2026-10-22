/**
 * Errores normalizados de la API.
 *
 * El backend responde con un cuerpo unico para los fallos:
 * `ErrorRespuesta { mensaje, campos }`, donde `campos` llega solo en los
 * errores de validacion. Conservar `campos` es lo que permite marcar cada campo
 * del formulario sin descartar lo que la persona ya escribio (RN-13).
 */
export class ErrorApi extends Error {
  constructor({ estado, mensaje, campos = null, advertencias = null }) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.campos = campos;
    this.advertencias = advertencias;
  }

  /** 401: no hay sesion, o caduco. */
  get esSinSesion() {
    return this.estado === 401;
  }

  /** 403: hay sesion, pero la operacion no esta permitida para este rol. */
  get esSinPermiso() {
    return this.estado === 403;
  }

  get esNoEncontrado() {
    return this.estado === 404;
  }

  /**
   * 409 acompanado de advertencias: la operacion no se ejecuto y espera una
   * confirmacion explicita (HU-09 C05, HU-06 C04). Un 409 sin advertencias es
   * una regla de negocio que bloquea la operacion y no admite confirmacion.
   */
  get requiereConfirmacion() {
    return this.estado === 409 && Array.isArray(this.advertencias) && this.advertencias.length > 0;
  }

  /** Fallo de red: el servidor no respondio. */
  get esDeRed() {
    return this.estado === 0;
  }
}

export const MENSAJE_RED =
  'No se pudo contactar con el servidor. Compruebe su conexion y vuelva a intentarlo.';

export const MENSAJE_INESPERADO =
  'Ocurrio un error inesperado al procesar la solicitud. Vuelva a intentarlo.';

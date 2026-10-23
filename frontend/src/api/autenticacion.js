import { api } from './cliente.js';
import { invalidarTokenCsrf } from './csrf.js';

/**
 * Inicio y cierre de sesion de los trabajadores (RF-027, HU-03).
 *
 * La sesion se mantiene en la cookie JSESSIONID que emite el servidor; el
 * cliente no guarda ni manipula ningun token de identidad.
 *
 * Las dos operaciones descartan el token CSRF guardado en memoria: al
 * autenticar, el servidor renueva el identificador de sesion, y al cerrar
 * sesion la invalida y borra el token de su repositorio. Conservarlo dejaria
 * un valor caducado para la primera escritura que viniera despues.
 */

/** HU-03 C01: valida las credenciales y abre la sesion. */
export async function iniciarSesion(credenciales) {
  const sesion = await api.crear('/api/auth/login', credenciales);
  invalidarTokenCsrf();
  return sesion;
}

/** Datos de la sesion vigente. Responde 401 cuando no hay ninguna. */
export function obtenerSesion(opciones) {
  return api.obtener('/api/auth/sesion', opciones);
}

/** Cierra la sesion; el servidor responde 204 e invalida la cookie. */
export async function cerrarSesion() {
  try {
    return await api.crear('/api/auth/logout');
  } finally {
    // Tambien si la peticion fallo: el token queda en duda y pedirlo de nuevo
    // es una sola peticion mas.
    invalidarTokenCsrf();
  }
}

/** Etiquetas de los tipos de trabajador para mostrar en la interfaz. */
export const ETIQUETA_TIPO = {
  COORDINADOR: 'Coordinador de proyectos',
  LIDER: 'Lider de proyectos',
  DESARROLLADOR: 'Desarrollador',
};

/**
 * Nombres legibles de los servicios comunes que el backend enumera en la
 * sesion (HU-03 C02). Los valores llegan del servidor; aqui solo se traducen.
 */
export const ETIQUETA_SERVICIO = {
  CORREO_ELECTRONICO: 'Correo electronico corporativo',
  CHAT_CORPORATIVO: 'Chat corporativo',
  BIBLIOTECA_DE_PROGRAMAS: 'Biblioteca de programas',
  TUTORIALES_DE_PROGRAMACION: 'Tutoriales de programacion',
};

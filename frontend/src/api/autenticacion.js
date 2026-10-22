import { api } from './cliente.js';

/**
 * Inicio y cierre de sesion de los trabajadores (RF-027, HU-03).
 *
 * La sesion se mantiene en la cookie JSESSIONID que emite el servidor; el
 * cliente no guarda ni manipula ningun token de identidad.
 */

/** HU-03 C01: valida las credenciales y abre la sesion. */
export function iniciarSesion(credenciales) {
  return api.crear('/api/auth/login', credenciales);
}

/** Datos de la sesion vigente. Responde 401 cuando no hay ninguna. */
export function obtenerSesion(opciones) {
  return api.obtener('/api/auth/sesion', opciones);
}

/** Cierra la sesion; el servidor responde 204 e invalida la cookie. */
export function cerrarSesion() {
  return api.crear('/api/auth/logout');
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

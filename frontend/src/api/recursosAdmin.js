import { api, construirConsulta } from './cliente.js';

/** Administracion de programas y tutoriales, reservada al coordinador. */
export function obtenerRecursosAdmin(tipo, opciones) {
  return api.obtener(`/api/admin/recursos${construirConsulta({ tipo })}`, opciones);
}

export function crearRecurso(datos) {
  return api.crear('/api/admin/recursos', datos);
}

export function actualizarRecurso(id, datos) {
  return api.reemplazar(`/api/admin/recursos/${id}`, datos);
}

export function cambiarPublicacionRecurso(id, publicada) {
  return api.crear(`/api/admin/recursos/${id}/publicacion?publicada=${publicada}`);
}

export function eliminarRecurso(id) {
  return api.eliminar(`/api/admin/recursos/${id}`);
}

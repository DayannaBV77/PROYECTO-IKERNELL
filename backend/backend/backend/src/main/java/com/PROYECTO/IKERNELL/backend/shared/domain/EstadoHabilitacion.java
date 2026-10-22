package com.PROYECTO.IKERNELL.backend.shared.domain;

/**
 * Estado de habilitacion de trabajadores y proyectos.
 *
 * <p>CONFIRMADO por RF-007 y RF-015: inhabilitar nunca borra, conserva el
 * historial (RN-02). Un trabajador inhabilitado no recibe nuevas asignaciones
 * ni inicia sesion (RN-03).
 */
public enum EstadoHabilitacion {

	HABILITADO,
	INHABILITADO;

	public boolean esHabilitado() {
		return this == HABILITADO;
	}

}

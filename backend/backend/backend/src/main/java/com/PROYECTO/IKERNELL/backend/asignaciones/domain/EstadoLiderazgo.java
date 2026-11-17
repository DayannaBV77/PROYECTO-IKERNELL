package com.PROYECTO.IKERNELL.backend.asignaciones.domain;

/**
 * Estado del liderazgo de un proyecto.
 *
 * <p>Permite registrar al lider como ACTIVO o PAUSADO (por ausencia temporal o eventualidad).
 */
public enum EstadoLiderazgo {

	ACTIVO,
	PAUSADO;

	public boolean esActivo() {
		return this == ACTIVO;
	}

}

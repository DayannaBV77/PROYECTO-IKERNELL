package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

/**
 * Asignacion de uno o varios desarrolladores a un proyecto por su lider
 * (RF-009, HU-10 C01).
 *
 * <p>No lleva rol: el lider solo puede asignar desarrolladores. RF-003 habla de
 * asignar "trabajadores" y RF-009 de asignar "desarrolladores", y esa diferencia
 * de redaccion es la base de la PROPUESTA D-21.
 */
public record AsignacionEquipoRequest(

		@NotEmpty(message = "Debe indicar al menos un desarrollador.")
		List<Long> desarrolladorIds) {
}

package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

import jakarta.validation.constraints.NotNull;

/**
 * Asignacion de un trabajador a un proyecto por el coordinador (RF-003, HU-06).
 *
 * <p>El rol es obligatorio y explicito. RF-003 habla de asignar "trabajadores"
 * sin precisar con que responsabilidad, pero sin rol la asignacion no podria
 * sostener RN-05 ni el nivel 2 de autorizacion.
 */
public record AsignacionRequest(

		@NotNull(message = "Debe indicar el trabajador.")
		Long trabajadorId,

		@NotNull(message = "Debe indicar el proyecto.")
		Long proyectoId,

		@NotNull(message = "Debe indicar el rol del trabajador en el proyecto.")
		RolEnProyecto rolEnProyecto) {
}

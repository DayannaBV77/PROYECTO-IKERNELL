package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

/** Asignaciones con rol individual para el equipo de un proyecto. */
public record AsignacionLoteRequest(

		@NotEmpty(message = "Debe seleccionar al menos un trabajador.")
		List<@Valid AsignacionEquipoTrabajadorRequest> asignaciones) {
}

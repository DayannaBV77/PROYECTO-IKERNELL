package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

import jakarta.validation.constraints.NotNull;

public record ContextoProyectoRequest(
		@NotNull(message = "Debe indicar el proyecto.")
		Long proyectoId,

		RolEnProyecto rol) {
}

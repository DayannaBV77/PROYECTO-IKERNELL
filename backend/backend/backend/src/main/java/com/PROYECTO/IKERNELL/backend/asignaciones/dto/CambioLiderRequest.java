package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import jakarta.validation.constraints.NotNull;

/** Peticion para cambiar el lider responsable de un proyecto. */
public record CambioLiderRequest(
		@NotNull(message = "Debe indicar el nuevo líder.")
		Long nuevoLiderId) {
}

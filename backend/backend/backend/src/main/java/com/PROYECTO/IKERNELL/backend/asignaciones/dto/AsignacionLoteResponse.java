package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.List;

/** Resultado atómico de la asignación del equipo por el coordinador. */
public record AsignacionLoteResponse(
		List<AsignacionResponse> asignadas,
		List<AsignacionResponse> yaExistentes) {
}

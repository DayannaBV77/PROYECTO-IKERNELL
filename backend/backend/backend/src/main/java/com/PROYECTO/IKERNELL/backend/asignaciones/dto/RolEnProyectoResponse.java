package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

public record RolEnProyectoResponse(
		Long proyectoId,
		String proyectoNombre,
		List<RolEnProyecto> roles,
		RolEnProyecto rolActivo) {
}

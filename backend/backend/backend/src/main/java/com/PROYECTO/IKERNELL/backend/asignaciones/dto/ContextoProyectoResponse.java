package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

public record ContextoProyectoResponse(
		Long proyectoId,
		String proyectoNombre,
		RolEnProyecto rolActivo,
		EstadoHabilitacion estadoHabilitacion,
		String estadoOperativo,
		List<RolEnProyecto> rolesEnProyecto,
		List<String> permisos) {
}

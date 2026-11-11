package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.time.OffsetDateTime;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

/** Proyecto y datos de resumen necesarios para la pantalla del coordinador. */
public record ProyectoAsignacionResponse(
		Long id,
		String codigo,
		String nombre,
		String descripcion,
		EstadoHabilitacion estadoHabilitacion,
		String estadoOperativo,
		OffsetDateTime fechaCreacion,
		Long liderResponsableId,
		String liderResponsableNombre,
		long numeroIntegrantes) {

	public static ProyectoAsignacionResponse de(Proyecto proyecto, long numeroIntegrantes) {
		var lider = proyecto.getLiderResponsable();
		return new ProyectoAsignacionResponse(
				proyecto.getId(),
				codigoDe(proyecto.getId()),
				proyecto.getNombre(),
				proyecto.getDescripcion(),
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				proyecto.getFechaCreacion(),
				lider != null ? lider.getId() : null,
				lider != null ? lider.nombreCompleto() : null,
				numeroIntegrantes);
	}

	public static String codigoDe(Long id) {
		return id == null ? null : "PRY-%03d".formatted(id);
	}
}

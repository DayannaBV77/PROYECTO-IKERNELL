package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Detalle de un proyecto (RF-013, HU-09 C01). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProyectoResponse(
		Long id,
		String nombre,
		String descripcion,
		EstadoHabilitacion estadoHabilitacion,
		String estadoOperativo,
		Long liderResponsableId) {

	public static ProyectoResponse de(Proyecto proyecto) {
		return new ProyectoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				proyecto.getDescripcion(),
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				proyecto.getLiderResponsable() != null ? proyecto.getLiderResponsable().getId() : null);
	}

}

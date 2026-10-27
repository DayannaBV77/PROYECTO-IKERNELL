package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import java.time.LocalDate;

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
		LocalDate fechaInicioReal,
		LocalDate fechaFinReal,
		boolean excedeSeisAnios,
		Long liderResponsableId) {

	public static ProyectoResponse de(Proyecto proyecto) {
		return new ProyectoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				proyecto.getDescripcion(),
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				proyecto.getFechaInicioReal(),
				proyecto.getFechaFinReal(),
				proyecto.excedeSeisAnios(),
				proyecto.getLiderResponsable() != null ? proyecto.getLiderResponsable().getId() : null);
	}

}

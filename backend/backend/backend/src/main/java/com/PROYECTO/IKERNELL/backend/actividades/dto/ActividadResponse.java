package com.PROYECTO.IKERNELL.backend.actividades.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.PrioridadActividad;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Detalle de una actividad (RF-020, HU-13 C03).
 *
 * <p>{@code prioridad} y {@code fechaPlanificada} pueden faltar: los anade
 * RF-038 y las actividades registradas antes no los tienen. Con
 * {@code NON_NULL} simplemente no viajan, y el cliente lo muestra como lo que
 * es -un dato sin diligenciar- en lugar de suponerle un valor.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActividadResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		Long etapaId,
		String etapaNombre,
		Long desarrolladorId,
		String desarrolladorNombreCompleto,
		String descripcion,
		String estado,
		PrioridadActividad prioridad,
		LocalDate fechaPlanificada) {

	public static ActividadResponse de(Actividad actividad) {
		return new ActividadResponse(
				actividad.getId(),
				actividad.getProyecto().getId(),
				actividad.getProyecto().getNombre(),
				actividad.getEtapa().getId(),
				actividad.getEtapa().getNombre(),
				actividad.getDesarrollador().getId(),
				actividad.getDesarrollador().nombreCompleto(),
				actividad.getDescripcion(),
				actividad.getEstado(),
				actividad.getPrioridad(),
				actividad.getFechaPlanificada());
	}

}

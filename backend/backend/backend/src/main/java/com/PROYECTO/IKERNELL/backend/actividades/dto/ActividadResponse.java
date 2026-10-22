package com.PROYECTO.IKERNELL.backend.actividades.dto;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Detalle de una actividad (RF-020, HU-13 C03). */
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
		String estado) {

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
				actividad.getEstado());
	}

}

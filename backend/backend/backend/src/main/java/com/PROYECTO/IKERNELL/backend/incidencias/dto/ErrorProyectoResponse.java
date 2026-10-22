package com.PROYECTO.IKERNELL.backend.incidencias.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.ErrorProyecto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Error registrado en un proyecto (RF-023). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorProyectoResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		String tipoError,
		Long faseId,
		String faseNombre,
		String descripcion,
		LocalDate fecha,
		Long registradoPorId) {

	public static ErrorProyectoResponse de(ErrorProyecto error) {
		return new ErrorProyectoResponse(
				error.getId(),
				error.getProyecto().getId(),
				error.getProyecto().getNombre(),
				error.getTipoError(),
				error.getFase().getId(),
				error.getFase().getNombre(),
				error.getDescripcion(),
				error.getFecha(),
				error.getRegistradoPor().getId());
	}

}

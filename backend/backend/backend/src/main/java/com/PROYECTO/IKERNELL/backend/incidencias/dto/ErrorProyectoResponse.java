package com.PROYECTO.IKERNELL.backend.incidencias.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.ErrorProyecto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Error registrado en un proyecto (RF-023).
 *
 * <p>D-36: la fase es la etapa del proyecto. Los registros previos a esa
 * decision no tienen etapa y conservan en {@code faseHistorica} el nombre de la
 * fase del catalogo retirado (D-37), asi que el cliente debe estar preparado
 * para mostrar uno o el otro. Se entregan los dos tal cual, sin mezclarlos en un
 * solo campo: un nombre del catalogo antiguo no es el nombre de una etapa, y
 * presentarlo como tal falsearia el dato.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorProyectoResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		String tipoError,
		Long etapaId,
		String etapaNombre,
		String faseHistorica,
		String descripcion,
		LocalDate fecha,
		Long registradoPorId) {

	public static ErrorProyectoResponse de(ErrorProyecto error) {
		return new ErrorProyectoResponse(
				error.getId(),
				error.getProyecto().getId(),
				error.getProyecto().getNombre(),
				error.getTipoError(),
				error.getEtapa() == null ? null : error.getEtapa().getId(),
				error.getEtapa() == null ? null : error.getEtapa().getNombre(),
				error.getFaseHistorica(),
				error.getDescripcion(),
				error.getFecha(),
				error.getRegistradoPor().getId());
	}

}

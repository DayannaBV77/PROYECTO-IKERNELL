package com.PROYECTO.IKERNELL.backend.actividades.dto;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Ejecucion registrada de una actividad (RF-022). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EjecucionResponse(
		Long id,
		Long actividadId,
		Long ejecutadaPorId,
		LocalDateTime iniciadaEn,
		LocalDateTime finalizadaEn,
		String observaciones) {

	public static EjecucionResponse de(EjecucionActividad ejecucion) {
		return new EjecucionResponse(
				ejecucion.getId(),
				ejecucion.getActividad().getId(),
				ejecucion.getEjecutadaPor().getId(),
				ejecucion.getIniciadaEn(),
				ejecucion.getFinalizadaEn(),
				ejecucion.getObservaciones());
	}

}

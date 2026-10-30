package com.PROYECTO.IKERNELL.backend.midia.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.midia.domain.TareaMiDia;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Tarea personal del checklist de «Mi Dia» (RF-038).
 *
 * <p>{@code completada} es el estado que la interfaz alterna con el checkbox.
 * Viaja siempre, incluso en {@code false}, porque el cliente necesita saber que
 * la tarea sigue pendiente para pintarla sin tachado.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TareaMiDiaResponse(
		Long id,
		String descripcion,
		LocalDate fecha,
		boolean completada,
		LocalDateTime creadaEn) {

	public static TareaMiDiaResponse de(TareaMiDia tarea) {
		return new TareaMiDiaResponse(
				tarea.getId(),
				tarea.getDescripcion(),
				tarea.getFecha(),
				tarea.isCompletada(),
				tarea.getCreadaEn());
	}

}

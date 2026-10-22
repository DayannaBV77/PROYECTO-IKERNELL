package com.PROYECTO.IKERNELL.backend.incidencias.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.UnidadDuracion;

/**
 * Interrupcion registrada (RF-024).
 *
 * <p>Devuelve tipo, fecha, duracion y fase, que son exactamente los datos que
 * HU-18 C04 exige ver en la consulta y en el reporte del lider.
 */
public record InterrupcionProyectoResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		String tipoInterrupcion,
		LocalDate fecha,
		BigDecimal duracionValor,
		UnidadDuracion duracionUnidad,
		Long faseId,
		String faseNombre,
		Long registradoPorId) {

	public static InterrupcionProyectoResponse de(InterrupcionProyecto interrupcion) {
		return new InterrupcionProyectoResponse(
				interrupcion.getId(),
				interrupcion.getProyecto().getId(),
				interrupcion.getProyecto().getNombre(),
				interrupcion.getTipoInterrupcion(),
				interrupcion.getFecha(),
				interrupcion.getDuracionValor(),
				interrupcion.getDuracionUnidad(),
				interrupcion.getFase().getId(),
				interrupcion.getFase().getNombre(),
				interrupcion.getRegistradoPor().getId());
	}

}

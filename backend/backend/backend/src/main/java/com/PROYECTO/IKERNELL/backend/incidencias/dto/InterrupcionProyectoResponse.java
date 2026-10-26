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
 *
 * <p>D-36: la fase es la etapa del proyecto. Los registros previos no tienen
 * etapa y conservan el nombre de la fase del catalogo retirado en
 * {@code faseHistorica} (D-37); se entregan los dos campos por separado para no
 * presentar un valor del catalogo antiguo como si fuera el nombre de una etapa.
 */
public record InterrupcionProyectoResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		String tipoInterrupcion,
		LocalDate fecha,
		BigDecimal duracionValor,
		UnidadDuracion duracionUnidad,
		Long etapaId,
		String etapaNombre,
		String faseHistorica,
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
				interrupcion.getEtapa() == null ? null : interrupcion.getEtapa().getId(),
				interrupcion.getEtapa() == null ? null : interrupcion.getEtapa().getNombre(),
				interrupcion.getFaseHistorica(),
				interrupcion.getRegistradoPor().getId());
	}

}

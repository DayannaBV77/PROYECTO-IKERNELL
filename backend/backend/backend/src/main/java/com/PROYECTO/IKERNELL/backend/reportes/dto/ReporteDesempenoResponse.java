package com.PROYECTO.IKERNELL.backend.reportes.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Reporte de desempeno y actividades de un desarrollador en un proyecto
 * (RF-006, HU-07).
 *
 * <p>No incluye ningun indicador calculado de desempeno, y es deliberado:
 * RF-006 dice que "los indicadores especificos de desempeno deberan definirse
 * con la empresa" y HU-07 C02 habla de "los datos de desempeno que la empresa
 * haya definido". Como no hay ninguno definido (D-09), el reporte entrega los
 * hechos registrados -actividades y sus ejecuciones- mas conteos derivados de
 * ellos, y declara en {@code datosPendientes} que falta por acordar.
 *
 * <p>Es el mismo criterio aplicado en RF-016: datos disponibles, nunca una
 * metrica inventada.
 *
 * @param resumen          conteos de hechos registrados, no indicadores
 * @param datosPendientes  que debe definir la empresa para poder medir desempeno
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReporteDesempenoResponse(
		Long desarrolladorId,
		String desarrolladorNombreCompleto,
		Long proyectoId,
		String proyectoNombre,
		LocalDate periodoDesde,
		LocalDate periodoHasta,
		List<ActividadConEjecucionesResponse> contenido,
		int total,
		Map<String, Long> resumen,
		String mensaje,
		List<String> datosPendientes) {
}

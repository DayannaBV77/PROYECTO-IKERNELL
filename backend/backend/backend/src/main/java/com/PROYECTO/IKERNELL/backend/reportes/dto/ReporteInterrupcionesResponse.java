package com.PROYECTO.IKERNELL.backend.reportes.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.PROYECTO.IKERNELL.backend.incidencias.dto.InterrupcionProyectoResponse;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Reporte de interrupciones por proyecto (RF-017, HU-15).
 *
 * <p>Cada fila trae tipo, fecha, duracion y fase, los cuatro datos que exige
 * HU-15 C02. Por D-36 la fase de cada fila es la etapa del proyecto; las filas
 * previas a esa decision no tienen etapa y traen su fase historica (D-37), de
 * modo que el dato que HU-15 C02 exige nunca falta.
 *
 * <p>{@code duracionTotalPorUnidad} suma las duraciones SEPARADAS POR UNIDAD y
 * no en un unico numero. Sumar horas con dias exigiria un factor de conversion
 * -cuantas horas tiene una jornada- que ningun documento define (D-07).
 * Entregar los totales por unidad informa sin inventar esa equivalencia.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReporteInterrupcionesResponse(
		Long proyectoId,
		String proyectoNombre,
		LocalDate periodoDesde,
		LocalDate periodoHasta,
		List<InterrupcionProyectoResponse> contenido,
		int total,
		Map<String, BigDecimal> duracionTotalPorUnidad,
		String mensaje) {
}

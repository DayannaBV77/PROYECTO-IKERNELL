package com.PROYECTO.IKERNELL.backend.reportes.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.actividades.dto.ActividadResponse;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Reporte de actividades por proyecto (RF-018, HU-14).
 *
 * <p>Cada fila trae los datos de la actividad y el desarrollador asignado, que
 * es exactamente lo que exige HU-14 C02.
 *
 * <p>Esta paginado y el total corresponde al conjunto filtrado completo, no a la
 * pagina: asi la generacion del reporte no bloquea otras funcionalidades
 * (RNF-005) sin que el lider pierda la cuenta real.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReporteActividadesProyectoResponse(
		Long proyectoId,
		String proyectoNombre,
		List<ActividadResponse> contenido,
		long total,
		int pagina,
		int totalPaginas,
		String mensaje) {
}

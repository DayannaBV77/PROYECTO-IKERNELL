package com.PROYECTO.IKERNELL.backend.actividades.dto;

/**
 * Criterios de busqueda de actividades (RF-020, HU-13 C03).
 *
 * <p>Los cuatro que enumera el criterio de aceptacion: "el proyecto, el
 * desarrollador, la etapa o el identificador de la actividad". Todos opcionales,
 * combinados con AND.
 */
public record CriteriosBusquedaActividad(
		Long identificador,
		Long proyectoId,
		Long etapaId,
		Long desarrolladorId) {
}

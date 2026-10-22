package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

/**
 * Criterios de busqueda de proyectos (RF-013, HU-09 C01).
 *
 * <p>Los tres que menciona el criterio de aceptacion: "el identificador, el
 * nombre o el estado del proyecto". Todos opcionales, combinados con AND.
 */
public record CriteriosBusquedaProyecto(
		Long identificador,
		String nombre,
		EstadoHabilitacion estadoHabilitacion) {
}

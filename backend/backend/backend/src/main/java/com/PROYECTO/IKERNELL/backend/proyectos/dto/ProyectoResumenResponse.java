package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

/** Fila de la lista de resultados de RF-013; mas corta que el detalle (RNF-005). */
public record ProyectoResumenResponse(
		Long id,
		String nombre,
		EstadoHabilitacion estadoHabilitacion,
		String estadoOperativo,
		boolean reporteExternoAutorizado) {

	public static ProyectoResumenResponse de(Proyecto proyecto) {
		return new ProyectoResumenResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				proyecto.estaAutorizadoParaReporteExterno());
	}

}

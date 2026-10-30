package com.PROYECTO.IKERNELL.backend.reportes.externo.dto;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.reportes.externo.DatosEjecucionProyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

/**
 * Proyecto autorizado para el reporte externo (RF-025, HU-19 C01).
 *
 * <p>La pantalla solo ofrece proyectos con {@code autorizado = true}; no es una
 * lista de todos los proyectos filtrada en el cliente, sino la seleccion que el
 * servidor ya valido. {@code tieneDatosEjecucion} permite avisar antes de
 * generar que un proyecto no aportaria ninguna fila.
 */
public record ProyectoReporteExternoResponse(
		Long id,
		String nombre,
		EstadoHabilitacion estadoHabilitacion,
		String estadoOperativo,
		long ejecucionesRegistradas,
		boolean tieneDatosEjecucion) {

	public static ProyectoReporteExternoResponse de(Proyecto proyecto,
			DatosEjecucionProyecto ejecucion) {
		return new ProyectoReporteExternoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				ejecucion.ejecucionesRegistradas(),
				ejecucion.tieneDatos());
	}

}

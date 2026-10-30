package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.time.LocalDateTime;

/**
 * Resumen de ejecucion de un proyecto para el reporte externo (RF-025).
 *
 * <p>Contiene solo conteos y marcas de tiempo. No guarda quien ejecuto cada
 * actividad ni sus observaciones: esa es precisamente la informacion personal
 * que el reporte excluye.
 */
public record DatosEjecucionProyecto(
		long ejecucionesRegistradas,
		long ejecucionesFinalizadas,
		LocalDateTime primeraEjecucion,
		LocalDateTime ultimaEjecucion) {

	/** Proyecto sin ninguna ejecucion registrada. */
	public static DatosEjecucionProyecto vacio() {
		return new DatosEjecucionProyecto(0, 0, null, null);
	}

	/** Solo los proyectos con ejecucion aportan datos al reporte. */
	public boolean tieneDatos() {
		return ejecucionesRegistradas > 0;
	}

}

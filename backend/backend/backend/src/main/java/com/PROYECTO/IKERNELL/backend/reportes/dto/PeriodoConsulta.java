package com.PROYECTO.IKERNELL.backend.reportes.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/**
 * Periodo opcional de consulta de los reportes (HU-07 C04, HU-15 C04).
 *
 * <p>Los dos criterios lo plantean condicionado: "que la empresa definio un
 * periodo de consulta". Mientras no se confirme, el filtro se ofrece como
 * opcional: sin fechas el reporte sale completo.
 */
public record PeriodoConsulta(LocalDate desde, LocalDate hasta) {

	public static PeriodoConsulta de(LocalDate desde, LocalDate hasta) {
		if (desde != null && hasta != null && desde.isAfter(hasta)) {
			throw new ReglaNegocioException("La fecha inicial del periodo no puede ser posterior a la final.");
		}
		return new PeriodoConsulta(desde, hasta);
	}

	public boolean estaDefinido() {
		return desde != null || hasta != null;
	}

	/** Comprueba si una fecha cae dentro del periodo; los extremos son inclusivos. */
	public boolean contiene(LocalDate fecha) {
		if (fecha == null) {
			return !estaDefinido();
		}
		if (desde != null && fecha.isBefore(desde)) {
			return false;
		}
		return hasta == null || !fecha.isAfter(hasta);
	}

}

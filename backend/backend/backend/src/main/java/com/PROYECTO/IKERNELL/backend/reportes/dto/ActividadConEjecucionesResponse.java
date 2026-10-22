package com.PROYECTO.IKERNELL.backend.reportes.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.EjecucionResponse;

/**
 * Actividad con sus ejecuciones registradas, para el reporte de RF-006.
 *
 * <p>HU-07 C02 pide listar las actividades "con los datos guardados de cada
 * una". Las ejecuciones son parte de esos datos: son el unico registro del
 * trabajo realmente realizado (HU-16 C02).
 */
public record ActividadConEjecucionesResponse(
		Long actividadId,
		Long etapaId,
		String etapaNombre,
		String descripcion,
		String estado,
		int numeroEjecuciones,
		List<EjecucionResponse> ejecuciones) {

	public static ActividadConEjecucionesResponse de(Actividad actividad,
			List<EjecucionActividad> ejecuciones) {
		return new ActividadConEjecucionesResponse(
				actividad.getId(),
				actividad.getEtapa().getId(),
				actividad.getEtapa().getNombre(),
				actividad.getDescripcion(),
				actividad.getEstado(),
				ejecuciones.size(),
				ejecuciones.stream().map(EjecucionResponse::de).toList());
	}

}

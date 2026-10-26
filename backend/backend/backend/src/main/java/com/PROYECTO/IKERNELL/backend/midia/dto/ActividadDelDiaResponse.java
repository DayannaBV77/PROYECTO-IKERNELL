package com.PROYECTO.IKERNELL.backend.midia.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.ActividadResponse;

/**
 * Una actividad del panel «Mi Dia», con lo que el panel necesita saber de ella
 * y que no es un atributo propio (RF-038).
 *
 * <p>Los datos de la actividad no se vuelven a describir: viajan en
 * {@link ActividadResponse}, el mismo que usan el resto de pantallas. Asi
 * cualquier campo que se anada a una actividad aparece aqui sin tocar este
 * registro.
 *
 * <p>{@code atrasada} es derivado, no almacenado: la actividad quedo planificada
 * para un dia anterior a hoy y sigue pendiente. Existe por la decision D-30,
 * que mantiene las vencidas en el panel en lugar de ocultarlas; sin la marca,
 * una de ayer y una de hoy se verian igual.
 */
public record ActividadDelDiaResponse(ActividadResponse actividad, boolean atrasada) {

	public static ActividadDelDiaResponse de(Actividad actividad, LocalDate hoy) {
		LocalDate planificada = actividad.getFechaPlanificada();
		return new ActividadDelDiaResponse(
				ActividadResponse.de(actividad),
				planificada != null && planificada.isBefore(hoy));
	}

}

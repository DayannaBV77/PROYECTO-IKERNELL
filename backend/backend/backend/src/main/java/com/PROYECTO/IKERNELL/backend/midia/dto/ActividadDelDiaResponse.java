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
 *
 * <p>{@code completada} es el estado que el checklist alterna. Se deriva de las
 * ejecuciones (D-31) y no de {@code actividad.estado}, que sigue sin dominio
 * definido (D-04): marcar el checkbox finaliza o reabre una ejecucion real, de
 * modo que «Mis actividades» y el panel nunca dicen cosas distintas.
 */
public record ActividadDelDiaResponse(
		ActividadResponse actividad,
		boolean atrasada,
		boolean completada) {

	public static ActividadDelDiaResponse de(Actividad actividad, LocalDate hoy, boolean completada) {
		LocalDate planificada = actividad.getFechaPlanificada();
		return new ActividadDelDiaResponse(
				ActividadResponse.de(actividad),
				planificada != null && planificada.isBefore(hoy),
				completada);
	}

}

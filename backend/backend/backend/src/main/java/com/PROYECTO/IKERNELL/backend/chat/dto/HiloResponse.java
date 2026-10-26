package com.PROYECTO.IKERNELL.backend.chat.dto;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.chat.ServicioHilos.HiloConResumen;
import com.PROYECTO.IKERNELL.backend.chat.domain.HiloConversacion;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Hilo de conversacion con su resumen (RF-037, HU-22 C01).
 *
 * <p>{@code etapaId} y {@code etapaNombre} llegan vacios en un hilo de proyecto:
 * es la forma de distinguir los dos tipos que HU-22 contempla, sin un campo
 * aparte que pudiera contradecirlos.
 *
 * <p>{@code noLeidos} cuenta los mensajes de otras personas posteriores a la
 * ultima lectura de quien consulta. Es el dato que el panel «Mi Dia» necesitara
 * para el indicador de notificaciones no leidas del chat (RF-038).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record HiloResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		Long etapaId,
		String etapaNombre,
		String titulo,
		Long creadoPorId,
		String creadoPorNombreCompleto,
		LocalDateTime creadoEn,
		long totalMensajes,
		long noLeidos) {

	public static HiloResponse de(HiloConResumen resumen) {
		HiloConversacion hilo = resumen.hilo();
		return new HiloResponse(
				hilo.getId(),
				hilo.getProyecto().getId(),
				hilo.getProyecto().getNombre(),
				hilo.getEtapa() == null ? null : hilo.getEtapa().getId(),
				hilo.getEtapa() == null ? null : hilo.getEtapa().getNombre(),
				hilo.getTitulo(),
				hilo.getCreadoPor().getId(),
				hilo.getCreadoPor().nombreCompleto(),
				hilo.getCreadoEn(),
				resumen.totalMensajes(),
				resumen.noLeidos());
	}

	/** Un hilo recien creado todavia no tiene mensajes ni lecturas. */
	public static HiloResponse de(HiloConversacion hilo) {
		return de(new HiloConResumen(hilo, 0, 0));
	}

}

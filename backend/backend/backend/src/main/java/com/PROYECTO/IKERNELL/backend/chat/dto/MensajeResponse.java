package com.PROYECTO.IKERNELL.backend.chat.dto;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.chat.domain.MensajeHilo;

/**
 * Mensaje registrado en un hilo (RF-037, HU-22 C02 y C05).
 *
 * <p>Trae los tres datos que C02 exige: el mensaje, quien lo escribio y cuando.
 */
public record MensajeResponse(
		Long id,
		Long hiloId,
		Long autorId,
		String autorNombreCompleto,
		String cuerpo,
		LocalDateTime enviadoEn) {

	public static MensajeResponse de(MensajeHilo mensaje) {
		return new MensajeResponse(
				mensaje.getId(),
				mensaje.getHilo().getId(),
				mensaje.getAutor().getId(),
				mensaje.getAutor().nombreCompleto(),
				mensaje.getCuerpo(),
				mensaje.getEnviadoEn());
	}

}

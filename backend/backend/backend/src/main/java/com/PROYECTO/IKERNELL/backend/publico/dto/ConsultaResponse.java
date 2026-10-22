package com.PROYECTO.IKERNELL.backend.publico.dto;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Consulta recibida, para la vista interna.
 *
 * <p>Nunca se devuelve en la pagina publica: HU-02 C05 lo prohibe.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConsultaResponse(
		Long id,
		String pregunta,
		String nombreContacto,
		String correoContacto,
		String telefonoContacto,
		LocalDateTime recibidaEn,
		boolean atendida,
		Long atendidaPorId) {

	public static ConsultaResponse de(ConsultaPublica consulta) {
		return new ConsultaResponse(
				consulta.getId(),
				consulta.getPregunta(),
				consulta.getNombreContacto(),
				consulta.getCorreoContacto(),
				consulta.getTelefonoContacto(),
				consulta.getRecibidaEn(),
				consulta.estaAtendida(),
				consulta.getAtendidaPor() != null ? consulta.getAtendidaPor().getId() : null);
	}

}

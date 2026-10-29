package com.PROYECTO.IKERNELL.backend.publico.dto;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.publico.domain.RespuestaConsulta;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Representación de una respuesta redactada en el historial de una consulta web (RF-035, HU-02).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RespuestaConsultaResponse(
		Long id,
		Long consultaId,
		Long trabajadorId,
		String nombreTrabajador,
		String contenido,
		LocalDateTime fechaRespuesta,
		boolean enviadaPorCorreo,
		String detalleError
) {
	public static RespuestaConsultaResponse de(RespuestaConsulta respuesta) {
		String nombre = null;
		if (respuesta.getTrabajador() != null) {
			nombre = (respuesta.getTrabajador().getNombre() + " " + respuesta.getTrabajador().getApellido()).trim();
		}
		return new RespuestaConsultaResponse(
				respuesta.getId(),
				respuesta.getConsulta() != null ? respuesta.getConsulta().getId() : null,
				respuesta.getTrabajador() != null ? respuesta.getTrabajador().getId() : null,
				nombre,
				respuesta.getContenido(),
				respuesta.getFechaRespuesta(),
				respuesta.isEnviadaPorCorreo(),
				respuesta.getDetalleError()
		);
	}
}


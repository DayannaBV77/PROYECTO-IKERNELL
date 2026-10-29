package com.PROYECTO.IKERNELL.backend.publico.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resultado de la operación de respuesta y notificación de una consulta (RF-035, HU-02).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OperacionRespuestaResponse(
		boolean exitoso,
		String mensaje,
		ConsultaResponse consulta,
		RespuestaConsultaResponse respuesta
) {}


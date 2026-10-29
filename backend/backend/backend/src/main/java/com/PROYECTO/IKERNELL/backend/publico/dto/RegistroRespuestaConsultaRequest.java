package com.PROYECTO.IKERNELL.backend.publico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Petición para registrar y enviar la respuesta a una consulta web pública (RF-035, HU-02).
 */
public record RegistroRespuestaConsultaRequest(
		@NotBlank(message = "La respuesta a la consulta no puede estar vacía.")
		@Size(min = 5, max = 4000, message = "La respuesta debe contener entre 5 y 4000 caracteres.")
		String respuesta,
		String tokenTransaccion
) {}


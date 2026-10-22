package com.PROYECTO.IKERNELL.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Credenciales de inicio de sesion (RF-027).
 *
 * <p>Las validaciones cubren HU-03 C05: si falta alguno de los datos, el sistema
 * no intenta iniciar la sesion y pide completarlos. El mensaje de cada campo es
 * el que el cliente muestra junto al campo correspondiente (RNF-002).
 *
 * <p>PROPUESTA pendiente de validacion (D-01): el identificador es el correo
 * corporativo. HU-03 T1 deja abierto que credenciales usara la empresa.
 */
public record LoginRequest(

		@NotBlank(message = "Debe indicar su correo corporativo.")
		String correoCorporativo,

		@NotBlank(message = "Debe indicar su contrasena.")
		String password) {
}

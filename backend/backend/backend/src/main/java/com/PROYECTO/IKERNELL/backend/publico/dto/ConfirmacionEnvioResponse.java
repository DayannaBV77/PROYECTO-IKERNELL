package com.PROYECTO.IKERNELL.backend.publico.dto;

/**
 * Confirmacion que recibe el interesado tras enviar el formulario (HU-02 C02).
 *
 * <p>Deliberadamente no devuelve la consulta registrada: el interesado solo
 * necesita saber que llego, y devolver menos reduce lo que un formulario publico
 * expone.
 */
public record ConfirmacionEnvioResponse(String mensaje) {

	public static ConfirmacionEnvioResponse recibida() {
		return new ConfirmacionEnvioResponse("Su consulta fue enviada correctamente.");
	}

}

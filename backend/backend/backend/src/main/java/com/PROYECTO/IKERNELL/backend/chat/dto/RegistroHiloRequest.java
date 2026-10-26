package com.PROYECTO.IKERNELL.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear un hilo de conversacion (RF-037).
 *
 * <p>El proyecto llega en la ruta, no en el cuerpo: un hilo no existe sin
 * proyecto, y asi es imposible crear uno sin indicarlo.
 *
 * <p>{@code etapaId} es OPCIONAL a proposito, y es lo que distingue las dos
 * formas que contempla HU-22: sin etapa el hilo es del proyecto (C01), con etapa
 * queda vinculado a esa etapa (C03). Debe ser una etapa del mismo proyecto; lo
 * comprueba el servicio.
 */
public record RegistroHiloRequest(

		@NotBlank(message = "Debe indicar el asunto del hilo.")
		@Size(max = 250, message = "El asunto admite hasta 250 caracteres.")
		String titulo,

		Long etapaId) {
}

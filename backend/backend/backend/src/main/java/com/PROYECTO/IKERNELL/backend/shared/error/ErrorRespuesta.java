package com.PROYECTO.IKERNELL.backend.shared.error;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Cuerpo unico de respuesta para los errores de la API.
 *
 * <p>Da soporte a RNF-002: {@code mensaje} es el texto comprensible para el
 * usuario y {@code campos} indica, campo por campo, que debe corregirse. Eso es
 * lo que permite al cliente senalar los datos faltantes <b>conservando lo ya
 * diligenciado</b>, como exige RN-13 (HU-02 C03, HU-04 C02, HU-08 C02,
 * HU-11 C02, HU-13 C02).
 *
 * @param mensaje texto para mostrar al usuario
 * @param campos  errores por campo; nulo cuando el error no es de validacion
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorRespuesta(String mensaje, Map<String, String> campos) {

	public static ErrorRespuesta de(String mensaje) {
		return new ErrorRespuesta(mensaje, null);
	}

	public static ErrorRespuesta deValidacion(String mensaje, Map<String, String> campos) {
		return new ErrorRespuesta(mensaje, campos);
	}

}

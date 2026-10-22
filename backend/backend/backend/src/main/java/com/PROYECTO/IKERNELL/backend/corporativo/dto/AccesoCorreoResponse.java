package com.PROYECTO.IKERNELL.backend.corporativo.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Acceso al correo electronico corporativo (RF-031, HU-20 C04 y C05).
 *
 * <p>RF-031 admite que el correo sea externo al aplicativo y que el sistema
 * "podra proporcionar un acceso o enlace autorizado", dejando la integracion
 * tecnica por confirmar (D-13). Por eso se resuelve como un enlace
 * configurable: es lo que el requerimiento permite sin suponer nada.
 *
 * <p>Cuando no hay enlace configurado, {@code disponible} es false y se devuelve
 * el aviso que pide HU-20 C05, en lugar de una pantalla en blanco.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AccesoCorreoResponse(boolean disponible, String url, String mensaje) {

	public static AccesoCorreoResponse enlace(String url) {
		return new AccesoCorreoResponse(true, url, null);
	}

	public static AccesoCorreoResponse noDisponible() {
		return new AccesoCorreoResponse(false, null,
				"No se puede acceder al correo corporativo por ahora.");
	}

}

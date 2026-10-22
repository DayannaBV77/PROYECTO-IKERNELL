package com.PROYECTO.IKERNELL.backend.auth.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Datos de la sesion abierta (RF-027).
 *
 * <p>{@code serviciosComunes} son los cuatro servicios internos que HU-03 C02
 * enumera para cualquier trabajador autenticado. Se devuelven para que el
 * cliente arme el menu; los endpoints que los atienden corresponden a
 * RF-028..031 y llegan en la ultima fase de implementacion.
 *
 * <p>El {@code tipoTrabajador} permite al cliente mostrar solo las funciones de
 * su tipo "y ninguna de las que corresponden a otro tipo" (HU-03 C02). La
 * restriccion real se aplica en el servidor, no en el menu.
 */
public record SesionResponse(
		Long trabajadorId,
		String nombreCompleto,
		String correoCorporativo,
		TipoTrabajador tipoTrabajador,
		List<String> serviciosComunes) {

	private static final List<String> SERVICIOS_COMUNES = List.of(
			"CORREO_ELECTRONICO",
			"CHAT_CORPORATIVO",
			"BIBLIOTECA_DE_PROGRAMAS",
			"TUTORIALES_DE_PROGRAMACION");

	public static SesionResponse de(TrabajadorAutenticado trabajador) {
		return new SesionResponse(
				trabajador.getTrabajadorId(),
				trabajador.getNombreCompleto(),
				trabajador.getUsername(),
				trabajador.getTipoTrabajador(),
				SERVICIOS_COMUNES);
	}

}

package com.PROYECTO.IKERNELL.backend.trabajadores.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Tipo de documento de identificacion del trabajador (RF-001).
 *
 * <p>Opciones permitidas: Cedula de ciudadania y Cedula de extranjeria.
 */
public enum TipoIdentificacion {

	CEDULA_CIUDADANIA("Cédula de ciudadanía"),
	CEDULA_EXTRANJERIA("Cédula de extranjería");

	private final String descripcion;

	TipoIdentificacion(String descripcion) {
		this.descripcion = descripcion;
	}

	@JsonValue
	public String getDescripcion() {
		return descripcion;
	}

	@JsonCreator
	public static TipoIdentificacion de(String valor) {
		if (valor == null || valor.isBlank()) {
			return null;
		}
		String normalizado = valor.trim().toUpperCase();
		if (normalizado.contains("EXTRANJER") || normalizado.equals("CEDULA_EXTRANJERIA") || normalizado.equals("CE")) {
			return CEDULA_EXTRANJERIA;
		}
		if (normalizado.contains("CIUDADAN") || normalizado.equals("CEDULA_CIUDADANIA") || normalizado.equals("CC")) {
			return CEDULA_CIUDADANIA;
		}
		for (TipoIdentificacion tipo : values()) {
			if (tipo.name().equalsIgnoreCase(normalizado)) {
				return tipo;
			}
		}
		throw new IllegalArgumentException("Tipo de identificación no válido: " + valor);
	}

}

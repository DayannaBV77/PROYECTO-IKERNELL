package com.PROYECTO.IKERNELL.backend.trabajadores.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Catalogo oficial de tipos de documento de identificacion del trabajador (RF-001).
 */
public enum TipoIdentificacion {

	CEDULA_CIUDADANIA("Cédula de ciudadanía"),
	TARJETA_IDENTIDAD("Tarjeta de identidad"),
	CEDULA_EXTRANJERIA("Cédula de extranjería"),
	PASAPORTE("Pasaporte"),
	PPT("Permiso por protección temporal");

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
		if (normalizado.equals("TI") || normalizado.contains("TARJETA")) {
			return TARJETA_IDENTIDAD;
		}
		if (normalizado.equals("PA") || normalizado.contains("PASAPORTE")) {
			return PASAPORTE;
		}
		if (normalizado.equals("PPT") || normalizado.contains("PROTECCION TEMPORAL")
				|| normalizado.contains("PROTECCIÓN TEMPORAL")) {
			return PPT;
		}
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

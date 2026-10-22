package com.PROYECTO.IKERNELL.backend.shared.error;

/**
 * El trabajador esta autenticado pero no puede realizar esta operacion.
 *
 * <p>Se usa para el <b>nivel 2</b> de autorizacion, el que depende del proyecto
 * concreto y no del tipo global: registrar errores e interrupciones exige una
 * asignacion activa como desarrollador en ese proyecto (HU-17 C05, HU-18 C05).
 * Esa comprobacion no se puede expresar con {@code @PreAuthorize} por rol.
 */
public class OperacionNoAutorizadaException extends RuntimeException {

	public OperacionNoAutorizadaException(String mensaje) {
		super(mensaje);
	}

}

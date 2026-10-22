package com.PROYECTO.IKERNELL.backend.shared.error;

/** El registro solicitado no existe. Se traduce a 404. */
public class RecursoNoEncontradoException extends RuntimeException {

	public RecursoNoEncontradoException(String mensaje) {
		super(mensaje);
	}

}

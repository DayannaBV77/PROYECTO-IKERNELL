package com.PROYECTO.IKERNELL.backend.shared.error;

/**
 * Una regla de negocio impide completar la operacion: identificacion duplicada
 * (RN-01), proyecto o trabajador inhabilitado (RN-03, RN-04), dependencias que
 * bloquean una eliminacion (RN-08).
 *
 * <p>Se traduce a 409 y el mensaje es el que se muestra al usuario (RNF-002).
 */
public class ReglaNegocioException extends RuntimeException {

	public ReglaNegocioException(String mensaje) {
		super(mensaje);
	}

}

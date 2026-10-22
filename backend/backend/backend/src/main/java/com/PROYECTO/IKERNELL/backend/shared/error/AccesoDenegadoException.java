package com.PROYECTO.IKERNELL.backend.shared.error;

/**
 * Credenciales invalidas o cuenta inhabilitada.
 *
 * <p>Una sola excepcion para los dos casos, de forma deliberada: RN-11 exige
 * que HU-03 C03 (credenciales incorrectas) y HU-03 C04 (trabajador
 * inhabilitado) produzcan el mismo mensaje generico, sin revelar cual de los
 * datos fallo.
 */
public class AccesoDenegadoException extends RuntimeException {

	public static final String MENSAJE = "Acceso denegado.";

	public AccesoDenegadoException() {
		super(MENSAJE);
	}

}

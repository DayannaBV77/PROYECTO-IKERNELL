package com.PROYECTO.IKERNELL.backend.shared.error;

/**
 * La fotografia no cumple el formato o el tamano permitidos (RF-002).
 *
 * <p>HU-04 C05 exige explicar el motivo sin perder los demas datos del perfil;
 * por eso es un error de la operacion de adjuntar, no del perfil completo.
 */
public class ArchivoInvalidoException extends RuntimeException {

	public ArchivoInvalidoException(String mensaje) {
		super(mensaje);
	}

}

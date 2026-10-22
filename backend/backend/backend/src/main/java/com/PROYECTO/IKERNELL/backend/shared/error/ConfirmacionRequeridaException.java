package com.PROYECTO.IKERNELL.backend.shared.error;

import java.util.List;

/**
 * La operacion tiene advertencias y necesita una confirmacion explicita.
 *
 * <p>Da forma al patron "advertir, no bloquear" que aparece dos veces en los
 * criterios: HU-09 C05 (dependencias antes de inhabilitar un proyecto) y
 * HU-06 C04 (asignacion equivalente activa). En ambos el usuario debe poder
 * revisar y decidir, asi que no se puede resolver con una restriccion de base
 * de datos ni con un rechazo definitivo.
 *
 * <p>PROPUESTA de diseno para la ambiguedad A-06: la operacion se repite con la
 * confirmacion activada. Es la forma de representar un flujo de dos pasos en
 * una API sin estado.
 */
public class ConfirmacionRequeridaException extends RuntimeException {

	private final List<String> advertencias;

	public ConfirmacionRequeridaException(String mensaje, List<String> advertencias) {
		super(mensaje);
		this.advertencias = List.copyOf(advertencias);
	}

	public List<String> getAdvertencias() {
		return advertencias;
	}

}

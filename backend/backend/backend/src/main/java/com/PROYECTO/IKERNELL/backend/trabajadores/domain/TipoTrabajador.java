package com.PROYECTO.IKERNELL.backend.trabajadores.domain;

/**
 * Tipo global del trabajador.
 *
 * <p>CONFIRMADO por el Caso de Estudio ADSI 2017, p.2: "en la empresa los
 * trabajadores pueden ser de tres tipos: Coordinador de proyectos, lider de
 * proyectos y desarrolladores".
 *
 * <p>Este tipo resuelve el <b>nivel 1</b> de autorizacion (que operaciones
 * puede invocar el trabajador). El <b>nivel 2</b> (sobre que proyecto concreto
 * puede operar) se resuelve con el rol de la asignacion, no con este tipo, para
 * preservar RN-05: un lider puede actuar como desarrollador en otro proyecto.
 */
public enum TipoTrabajador {

	COORDINADOR,
	LIDER,
	DESARROLLADOR;

	/** Nombre del rol de Spring Security asociado a este tipo. */
	public String nombreRol() {
		return "ROLE_" + name();
	}

}

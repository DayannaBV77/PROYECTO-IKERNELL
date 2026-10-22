package com.PROYECTO.IKERNELL.backend.asignaciones.domain;

/**
 * Rol que un trabajador cumple en UN proyecto concreto.
 *
 * <p>DERIVADO de RN-05 (Caso de Estudio p.3): "si fuera necesario por limites de
 * tiempo, los lideres pueden llegar a ser desarrolladores de otro proyecto".
 * Esa frase hace imposible representar la responsabilidad con el tipo global del
 * trabajador, porque la misma persona puede ser LIDER en su proyecto y
 * DESARROLLADOR en otro al mismo tiempo (HU-10 C04, HU-16 C05).
 *
 * <p>No se incluye COORDINADOR: ningun documento describe a un coordinador
 * asignado a un proyecto. El coordinador asigna, no se asigna.
 */
public enum RolEnProyecto {

	LIDER,
	DESARROLLADOR

}

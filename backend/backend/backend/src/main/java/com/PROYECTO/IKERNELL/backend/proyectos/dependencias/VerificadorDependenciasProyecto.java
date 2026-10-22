package com.PROYECTO.IKERNELL.backend.proyectos.dependencias;

import java.util.List;

/**
 * Reune las advertencias que deben mostrarse antes de inhabilitar un proyecto.
 *
 * <p>HU-09 C05 exige advertir "si el proyecto tiene actividades pendientes o
 * dependencias" antes de confirmar. Que casos cuentan como tales lo debe
 * acordar la empresa: HU-09 T5 lo deja explicitamente abierto.
 *
 * <p>De ahi que no se incluya ninguna regla todavia. Inventar una -por ejemplo
 * advertir por tener etapas registradas- seria agregar un requisito que nadie
 * pidio. El mecanismo queda listo y probado; las reglas se registran como beans
 * cuando se definan.
 */
public interface VerificadorDependenciasProyecto {

	/** @return advertencias para mostrar al lider; lista vacia si no hay ninguna */
	List<String> advertenciasAntesDeInhabilitar(Long proyectoId);

}

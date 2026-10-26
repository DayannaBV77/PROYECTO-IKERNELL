package com.PROYECTO.IKERNELL.backend.actividades.domain;

/**
 * Prioridad con que el lider planifica una actividad.
 *
 * <p>PROPUESTA pendiente de confirmar (D-29). Ningun documento enumera las
 * prioridades: RF-038 exige mostrar las actividades del dia "ordenadas por
 * prioridad" y da por registrado el dato, pero no dice cuales son los valores.
 * Estos tres son el minimo que permite un orden; si la empresa define otros,
 * cambia este enum y no el esquema, que deliberadamente no lleva CHECK.
 *
 * <p>El orden de declaracion ES la severidad, de mayor a menor, y de ahi lo
 * toma el panel: {@link #ordinal()} da 0 a ALTA. Ordenar por el nombre no
 * serviria, porque alfabeticamente ALTA precede a BAJA y esta a MEDIA.
 */
public enum PrioridadActividad {

	ALTA,
	MEDIA,
	BAJA

}

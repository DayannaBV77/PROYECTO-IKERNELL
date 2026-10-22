package com.PROYECTO.IKERNELL.backend.incidencias.domain;

/**
 * Unidad en que se expresa la duracion de una interrupcion (RF-024).
 *
 * <p>Los dos valores no son invencion: HU-18 T1 pide acordar "como se registrara
 * la duracion (por ejemplo en horas o en dias)". Se guarda junto al valor para
 * que, cuando la empresa cierre D-07, no haya que convertir datos ya
 * registrados.
 */
public enum UnidadDuracion {

	HORAS,
	DIAS

}

package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import java.util.List;
import java.util.Map;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Estado y datos de avance de un proyecto (RF-016, HU-12).
 *
 * <p>Materializa la decision C-04: el estado almacenado y el avance son cosas
 * distintas. Esta respuesta entrega lo primero tal cual esta guardado y, de lo
 * segundo, unicamente "los datos disponibles" que RF-016 menciona literalmente.
 * NO devuelve un porcentaje: la formula de avance no esta definida (D-03) y
 * calcular uno seria inventarla.
 *
 * @param datosDisponibles conteos crudos que cada modulo aporta: etapas,
 *                         actividades y, mas adelante, errores e interrupciones
 * @param mensajeAvance    aviso cuando aun no hay datos de avance (HU-12 C02)
 * @param datosPendientes  que falta para poder calcular el avance; se devuelve
 *                         en la respuesta para que quien consuma la API sepa
 *                         por que no hay porcentaje
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EstadoProyectoResponse(
		Long proyectoId,
		String nombre,
		EstadoHabilitacion estadoHabilitacion,
		String estadoOperativo,
		Map<String, Long> datosDisponibles,
		String mensajeAvance,
		List<String> datosPendientes) {
}

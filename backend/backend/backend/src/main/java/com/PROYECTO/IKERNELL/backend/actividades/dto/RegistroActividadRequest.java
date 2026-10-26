package com.PROYECTO.IKERNELL.backend.actividades.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.actividades.domain.PrioridadActividad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para registrar una actividad (RF-019, HU-13 C01).
 *
 * <p>Los tres referentes que exige el requerimiento -proyecto, etapa y
 * desarrollador- se reducen a dos campos: la etapa determina el proyecto, de
 * modo que pedir el proyecto por separado solo abriria la puerta a que llegara
 * uno que no corresponde a la etapa.
 *
 * <p>{@code prioridad} y {@code fechaPlanificada} son OPCIONALES. Los pide
 * RF-038 para el panel del desarrollador, no RF-019 para el registro, asi que
 * exigirlos aqui anadiria una obligacion que ningun criterio de HU-13 respalda.
 * Una actividad sin ellos se registra igual y el panel del dia lo advierte.
 */
public record RegistroActividadRequest(

		@NotNull(message = "Debe indicar la etapa del proyecto.")
		Long etapaId,

		@NotNull(message = "Debe indicar el desarrollador.")
		Long desarrolladorId,

		@NotBlank(message = "Debe indicar la descripcion de la actividad.")
		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion,

		PrioridadActividad prioridad,

		LocalDate fechaPlanificada) {
}

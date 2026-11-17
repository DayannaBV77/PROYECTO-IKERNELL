package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Asignacion de un trabajador a un proyecto por el coordinador (RF-003, HU-06).
 *
 * <p>El rol es obligatorio y explicito. RF-003 habla de asignar "trabajadores"
 * sin precisar con que responsabilidad, pero sin rol la asignacion no podria
 * sostener RN-05 ni el nivel 2 de autorizacion.
 */
public record AsignacionRequest(

		@NotNull(message = "Debe indicar el trabajador.")
		Long trabajadorId,

		@NotNull(message = "Debe indicar el proyecto.")
		Long proyectoId,

		RolEnProyecto rolEnProyecto,

		@DecimalMin(value = "1.00", message = "La dedicacion debe ser al menos 1%.")
		@DecimalMax(value = "100.00", message = "La dedicacion no puede superar 100%.")
		BigDecimal dedicacionPorcentaje,

		Long rolId) {

	public AsignacionRequest(Long trabajadorId, Long proyectoId, RolEnProyecto rolEnProyecto) {
		this(trabajadorId, proyectoId, rolEnProyecto, null, null);
	}

	public AsignacionRequest(Long trabajadorId, Long proyectoId, Long rolId, BigDecimal dedicacionPorcentaje) {
		this(trabajadorId, proyectoId, null, dedicacionPorcentaje, rolId);
	}

	@JsonIgnore
	@AssertTrue(message = "Debe indicar un rol válido mediante rolId.")
	public boolean isRolIndicado() {
		return rolId != null || rolEnProyecto != null;
	}

}

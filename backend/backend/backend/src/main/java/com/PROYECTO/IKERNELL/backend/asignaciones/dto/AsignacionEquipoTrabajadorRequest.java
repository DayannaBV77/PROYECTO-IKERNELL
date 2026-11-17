package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.math.BigDecimal;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import com.fasterxml.jackson.annotation.JsonIgnore;

/** Un trabajador y su rol/dedicacion dentro del lote del coordinador. */
public record AsignacionEquipoTrabajadorRequest(

		@NotNull(message = "Debe indicar el trabajador.")
		Long trabajadorId,

		RolEnProyecto rolEnProyecto,

		@DecimalMin(value = "1.00", message = "La dedicacion debe ser al menos 1%.")
		@DecimalMax(value = "100.00", message = "La dedicacion no puede superar 100%.")
		BigDecimal dedicacionPorcentaje,

		Long rolId) {

	public AsignacionEquipoTrabajadorRequest(
			Long trabajadorId, RolEnProyecto rolEnProyecto, BigDecimal dedicacionPorcentaje) {
		this(trabajadorId, rolEnProyecto, dedicacionPorcentaje, null);
	}

	@JsonIgnore
	@AssertTrue(message = "Debe indicar un rol válido mediante rolId.")
	public boolean isRolIndicado() {
		return rolId != null || rolEnProyecto != null;
	}
}

package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.math.BigDecimal;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/** Un trabajador y su rol/dedicacion dentro del lote del coordinador. */
public record AsignacionEquipoTrabajadorRequest(

		@NotNull(message = "Debe indicar el trabajador.")
		Long trabajadorId,

		@NotNull(message = "Debe indicar el rol del trabajador en el proyecto.")
		RolEnProyecto rolEnProyecto,

		@DecimalMin(value = "1.00", message = "La dedicacion debe ser al menos 1%.")
		@DecimalMax(value = "100.00", message = "La dedicacion no puede superar 100%.")
		BigDecimal dedicacionPorcentaje) {
}

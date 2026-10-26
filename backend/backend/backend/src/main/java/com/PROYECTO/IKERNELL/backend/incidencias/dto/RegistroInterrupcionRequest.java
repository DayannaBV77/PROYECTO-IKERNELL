package com.PROYECTO.IKERNELL.backend.incidencias.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.UnidadDuracion;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para registrar una interrupcion (RF-024, HU-18 C01).
 *
 * <p>Los cuatro campos que RN-10 declara obligatorios lo son aqui tambien, de
 * modo que HU-18 C02 se cumple campo por campo. El proyecto llega en la ruta
 * (HU-18 C03), y por D-36 la fase es una etapa de ESE proyecto: que lo sea lo
 * comprueba el servicio.
 */
public record RegistroInterrupcionRequest(

		@NotBlank(message = "Debe indicar el tipo de interrupcion.")
		@Size(max = 50, message = "El tipo admite hasta 50 caracteres.")
		String tipoInterrupcion,

		@NotNull(message = "Debe indicar la fecha de la interrupcion.")
		LocalDate fecha,

		@NotNull(message = "Debe indicar la duracion de la interrupcion.")
		@DecimalMin(value = "0.01", message = "La duracion debe ser mayor que cero.")
		BigDecimal duracionValor,

		@NotNull(message = "Debe indicar la unidad de la duracion.")
		UnidadDuracion duracionUnidad,

		@NotNull(message = "Debe indicar la etapa del proyecto en la que ocurrio.")
		Long etapaId) {
}

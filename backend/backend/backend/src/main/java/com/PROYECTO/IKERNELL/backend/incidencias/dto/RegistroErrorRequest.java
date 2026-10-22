package com.PROYECTO.IKERNELL.backend.incidencias.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para registrar un error (RF-023, HU-17 C01).
 *
 * <p>RN-10 fija el minimo obligatorio: tipo de error y fase. El proyecto llega
 * en la ruta, lo que hace imposible el caso de HU-17 C03 (guardar sin elegir
 * proyecto).
 *
 * <p>Descripcion y fecha son opcionales: RF-023 dice que el error "podra
 * incluir" esos datos. HU-17 C04 contempla que la empresa los declare
 * obligatorios; cuando lo haga, basta anadir las anotaciones aqui.
 */
public record RegistroErrorRequest(

		@NotBlank(message = "Debe indicar el tipo de error.")
		@Size(max = 50, message = "El tipo de error admite hasta 50 caracteres.")
		String tipoError,

		@NotNull(message = "Debe indicar la fase del proyecto en la que encontro el error.")
		Long faseId,

		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion,

		LocalDate fecha) {
}

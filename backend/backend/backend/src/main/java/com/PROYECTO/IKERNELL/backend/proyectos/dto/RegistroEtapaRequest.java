package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Datos de una etapa, para registrarla o modificarla (RF-010, RF-011).
 *
 * <p>RF-010 nombra "nombre, descripcion y demas datos que defina la empresa";
 * HU-11 T1 deja abierto cuales seran obligatorios. Se exige el nombre, que es
 * el unico sin el cual la etapa no se puede identificar en la lista de HU-11.
 */
public record RegistroEtapaRequest(

		@NotBlank(message = "Debe indicar el nombre de la etapa.")
		@Size(max = 150, message = "El nombre admite hasta 150 caracteres.")
		String nombre,

		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion,

		@Positive(message = "El orden debe ser un numero mayor que cero.")
		Integer orden) {
}

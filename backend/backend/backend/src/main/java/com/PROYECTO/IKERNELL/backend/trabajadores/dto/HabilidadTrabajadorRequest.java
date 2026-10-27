package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.CategoriaHabilidad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HabilidadTrabajadorRequest(
		@NotNull(message = "Debe indicar la categoria de la habilidad.")
		CategoriaHabilidad categoria,

		@NotBlank(message = "Debe indicar la habilidad.")
		@Size(max = 50, message = "La habilidad admite hasta 50 caracteres.")
		String nombre) {
}

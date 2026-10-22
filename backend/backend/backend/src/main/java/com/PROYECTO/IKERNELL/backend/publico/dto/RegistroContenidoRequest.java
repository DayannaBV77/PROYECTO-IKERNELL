package com.PROYECTO.IKERNELL.backend.publico.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear o editar una pieza de contenido publico.
 *
 * <p>PROPUESTA COMPLETA: ningun RF describe esta operacion. RF-032 a RF-036 solo
 * definen como se MUESTRA el contenido, y RF-032 admite textualmente que "el
 * proceso para actualizarlo debe definirse con la empresa".
 *
 * <p>Las validaciones que dependen del tipo -enlace obligatorio en un enlace de
 * interes, respuesta obligatoria en una pregunta frecuente- se aplican en el
 * servicio, porque no se pueden expresar campo a campo.
 */
public record RegistroContenidoRequest(

		@NotNull(message = "Debe indicar el tipo de contenido.")
		TipoContenido tipo,

		@NotBlank(message = "Debe indicar el titulo.")
		@Size(max = 250, message = "El titulo admite hasta 250 caracteres.")
		String titulo,

		@Size(max = 8000, message = "El contenido admite hasta 8000 caracteres.")
		String cuerpo,

		@Size(max = 500, message = "El enlace admite hasta 500 caracteres.")
		String enlace,

		LocalDate fecha,

		Integer orden) {
}

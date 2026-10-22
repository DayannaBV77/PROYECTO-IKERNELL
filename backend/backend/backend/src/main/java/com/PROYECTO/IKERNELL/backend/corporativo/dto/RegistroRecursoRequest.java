package com.PROYECTO.IKERNELL.backend.corporativo.dto;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear o editar un programa o un tutorial.
 *
 * <p>PROPUESTA: ningun RF describe esta operacion. RF-029 deja a la empresa "la
 * forma de busqueda, descarga, versiones y permisos" y RF-030 "la
 * administracion, clasificacion, formato y actualizacion". Sin estos endpoints,
 * la biblioteca y los tutoriales estarian siempre vacios.
 *
 * <p>Las reglas que dependen del tipo -un programa necesita su enlace, un
 * tutorial necesita contenido o enlace- se aplican en el servicio.
 */
public record RegistroRecursoRequest(

		@NotNull(message = "Debe indicar si es un programa o un tutorial.")
		TipoRecurso tipo,

		@NotBlank(message = "Debe indicar el titulo.")
		@Size(max = 250, message = "El titulo admite hasta 250 caracteres.")
		String titulo,

		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion,

		@Size(max = 100, message = "La categoria admite hasta 100 caracteres.")
		String categoria,

		@Size(max = 50, message = "La version admite hasta 50 caracteres.")
		String version,

		@Size(max = 16000, message = "El contenido admite hasta 16000 caracteres.")
		String contenido,

		@Size(max = 500, message = "El enlace admite hasta 500 caracteres.")
		String enlace,

		Integer orden) {
}

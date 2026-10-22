package com.PROYECTO.IKERNELL.backend.publico.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.publico.domain.ContenidoPublico;
import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Una pieza de contenido publico.
 *
 * <p>{@code publicada} solo se informa en la vista de administracion; en la
 * pagina publica todo lo que se devuelve esta publicado por definicion.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ContenidoResponse(
		Long id,
		TipoContenido tipo,
		String titulo,
		String cuerpo,
		String enlace,
		LocalDate fecha,
		Integer orden,
		Boolean publicada) {

	/** Vista publica: sin el indicador de publicacion. */
	public static ContenidoResponse publica(ContenidoPublico contenido) {
		return new ContenidoResponse(contenido.getId(), contenido.getTipo(), contenido.getTitulo(),
				contenido.getCuerpo(), contenido.getEnlace(), contenido.getFecha(),
				contenido.getOrden(), null);
	}

	/** Vista de administracion: incluye si esta publicado o es borrador. */
	public static ContenidoResponse administrativa(ContenidoPublico contenido) {
		return new ContenidoResponse(contenido.getId(), contenido.getTipo(), contenido.getTitulo(),
				contenido.getCuerpo(), contenido.getEnlace(), contenido.getFecha(),
				contenido.getOrden(), contenido.estaPublicada());
	}

}

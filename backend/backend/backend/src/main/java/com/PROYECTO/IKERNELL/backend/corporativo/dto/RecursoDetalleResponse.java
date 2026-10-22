package com.PROYECTO.IKERNELL.backend.corporativo.dto;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.RecursoInterno;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Detalle de un programa o tutorial (HU-21 C02 y C03).
 *
 * <p>Incluye el enlace o recurso autorizado y, en los tutoriales, su contenido.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecursoDetalleResponse(
		Long id,
		TipoRecurso tipo,
		String titulo,
		String descripcion,
		String categoria,
		String version,
		String contenido,
		String enlace) {

	public static RecursoDetalleResponse de(RecursoInterno recurso) {
		return new RecursoDetalleResponse(recurso.getId(), recurso.getTipo(), recurso.getTitulo(),
				recurso.getDescripcion(), recurso.getCategoria(), recurso.getVersion(),
				recurso.getContenido(), recurso.getEnlace());
	}

}

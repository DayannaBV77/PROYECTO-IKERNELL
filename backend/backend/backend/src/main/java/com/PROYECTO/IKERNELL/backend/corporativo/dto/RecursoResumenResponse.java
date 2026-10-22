package com.PROYECTO.IKERNELL.backend.corporativo.dto;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.RecursoInterno;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Fila de la lista de programas o tutoriales (HU-21 C01 y C03).
 *
 * <p>No incluye el contenido ni el enlace: esos se obtienen al abrir el detalle
 * (HU-21 C02), de modo que un listado no arrastre el cuerpo completo de cada
 * tutorial (RNF-005).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RecursoResumenResponse(
		Long id,
		TipoRecurso tipo,
		String titulo,
		String descripcion,
		String categoria,
		String version,
		Boolean publicada) {

	public static RecursoResumenResponse de(RecursoInterno recurso) {
		return new RecursoResumenResponse(recurso.getId(), recurso.getTipo(), recurso.getTitulo(),
				recurso.getDescripcion(), recurso.getCategoria(), recurso.getVersion(), null);
	}

	/** Vista de administracion: informa si esta publicado o es borrador. */
	public static RecursoResumenResponse administrativa(RecursoInterno recurso) {
		return new RecursoResumenResponse(recurso.getId(), recurso.getTipo(), recurso.getTitulo(),
				recurso.getDescripcion(), recurso.getCategoria(), recurso.getVersion(),
				recurso.estaPublicada());
	}

}

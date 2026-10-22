package com.PROYECTO.IKERNELL.backend.shared.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Lista completa, sin paginar, con el aviso de RN-14 cuando viene vacia.
 *
 * <p>Complementa a {@link PaginaResponse} para los casos en que el conjunto es
 * acotado por naturaleza y paginarlo no aporta, como las actividades asignadas a
 * un solo desarrollador (HU-16 C04).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ListaResponse<T>(List<T> contenido, int total, String mensaje) {

	public static <T> ListaResponse<T> de(List<T> contenido, String mensajeSinResultados) {
		return new ListaResponse<>(
				contenido,
				contenido.size(),
				contenido.isEmpty() ? mensajeSinResultados : null);
	}

}

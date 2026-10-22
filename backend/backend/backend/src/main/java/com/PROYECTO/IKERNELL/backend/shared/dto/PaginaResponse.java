package com.PROYECTO.IKERNELL.backend.shared.dto;

import java.util.List;

import org.springframework.data.domain.Page;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resultado paginado de una busqueda.
 *
 * <p>La paginacion responde a RNF-005: las consultas recuperan unicamente la
 * informacion necesaria para la operacion solicitada.
 *
 * <p>{@code mensaje} se llena solo cuando no hay coincidencias, porque los
 * criterios piden un aviso explicito "en lugar de una lista vacia o un error"
 * (RN-14: HU-05 C02, HU-09 C02, HU-13 C04).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaginaResponse<T>(
		List<T> contenido,
		int pagina,
		int tamano,
		long totalElementos,
		int totalPaginas,
		String mensaje) {

	public static <T> PaginaResponse<T> de(Page<T> pagina, String mensajeSinResultados) {
		return new PaginaResponse<>(
				pagina.getContent(),
				pagina.getNumber(),
				pagina.getSize(),
				pagina.getTotalElements(),
				pagina.getTotalPages(),
				pagina.isEmpty() ? mensajeSinResultados : null);
	}

}

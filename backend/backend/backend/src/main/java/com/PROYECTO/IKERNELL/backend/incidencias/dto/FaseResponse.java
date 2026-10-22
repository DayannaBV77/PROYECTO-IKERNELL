package com.PROYECTO.IKERNELL.backend.incidencias.dto;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.FaseProyecto;

/** Fase disponible para elegir al registrar un error o una interrupcion. */
public record FaseResponse(Long id, String nombre, Integer orden) {

	public static FaseResponse de(FaseProyecto fase) {
		return new FaseResponse(fase.getId(), fase.getNombre(), fase.getOrden());
	}

}

package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Etapa de un proyecto (RF-010, RF-011). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EtapaResponse(
		Long id,
		Long proyectoId,
		String nombre,
		String descripcion,
		Integer orden) {

	public static EtapaResponse de(Etapa etapa) {
		return new EtapaResponse(
				etapa.getId(),
				etapa.getProyecto().getId(),
				etapa.getNombre(),
				etapa.getDescripcion(),
				etapa.getOrden());
	}

}

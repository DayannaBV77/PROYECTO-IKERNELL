package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.time.LocalDate;
import java.math.BigDecimal;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Asignacion;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.EstadoLiderazgo;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

/** Asignacion registrada (HU-06 C05, HU-10 C05). */
public record AsignacionResponse(
		Long id,
		Long trabajadorId,
		String trabajadorIdentificacion,
		String trabajadorNombreCompleto,
		Long proyectoId,
		String proyectoNombre,
		RolEnProyecto rolEnProyecto,
		Long rolId,
		String nombreRol,
		boolean activa,
		EstadoLiderazgo estadoLiderazgo,
		LocalDate fechaAsignacion,
		BigDecimal dedicacionPorcentaje) {

	public static AsignacionResponse de(Asignacion asignacion) {
		return new AsignacionResponse(
				asignacion.getId(),
				asignacion.getTrabajador().getId(),
				asignacion.getTrabajador().getIdentificacion(),
				asignacion.getTrabajador().nombreCompleto(),
				asignacion.getProyecto().getId(),
				asignacion.getProyecto().getNombre(),
				asignacion.getRolEnProyecto(),
				asignacion.getRol().getId(),
				asignacion.getRol().getNombreRol(),
				asignacion.estaActiva(),
				asignacion.getEstadoLiderazgo(),
				asignacion.getFechaAsignacion(),
				asignacion.getDedicacionPorcentaje());
	}

}

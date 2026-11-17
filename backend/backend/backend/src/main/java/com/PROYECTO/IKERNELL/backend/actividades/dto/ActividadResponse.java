package com.PROYECTO.IKERNELL.backend.actividades.dto;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.PrioridadActividad;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Detalle de una actividad (RF-020, HU-13 C03, HU-16).
 *
 * <p>{@code prioridad} y {@code fechaPlanificada} pueden faltar: los anade
 * RF-038 y las actividades registradas antes no los tienen. Con
 * {@code NON_NULL} simplemente no viajan, y el cliente lo muestra como lo que
 * es -un dato sin diligenciar- en lugar de suponerle un valor.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ActividadResponse(
		Long id,
		Long proyectoId,
		String proyectoNombre,
		String proyectoDescripcion,
		String proyectoEstado,
		Integer proyectoAvance,
		Long etapaId,
		String etapaNombre,
		Integer etapaOrden,
		Long desarrolladorId,
		String desarrolladorNombreCompleto,
		String descripcion,
		String estado,
		PrioridadActividad prioridad,
		LocalDate fechaPlanificada,
		Integer porcentajeAvance,
		String liderNombre,
		String ultimaActualizacion,
		String observaciones) {

	public ActividadResponse(
			Long id,
			Long proyectoId,
			String proyectoNombre,
			Long etapaId,
			String etapaNombre,
			Long desarrolladorId,
			String desarrolladorNombreCompleto,
			String descripcion,
			String estado,
			PrioridadActividad prioridad,
			LocalDate fechaPlanificada) {
		this(id, proyectoId, proyectoNombre, null, null, null, etapaId, etapaNombre, null,
				desarrolladorId, desarrolladorNombreCompleto, descripcion,
				estado != null ? estado : "PENDIENTE", prioridad, fechaPlanificada, null, null, null, null);
	}

	public static ActividadResponse de(Actividad actividad) {
		String estado = actividad.getEstado() != null && !actividad.getEstado().isBlank()
				? actividad.getEstado()
				: "PENDIENTE";
		Integer porcentaje = "FINALIZADA".equalsIgnoreCase(estado)
				? 100
				: ("EN_PROGRESO".equalsIgnoreCase(estado) ? 70 : 0);

		String lider = "Líder de Proyecto";
		try {
			if (actividad.getProyecto() != null && actividad.getProyecto().getLiderResponsable() != null) {
				String nombreLider = actividad.getProyecto().getLiderResponsable().nombreCompleto();
				if (nombreLider != null && !nombreLider.isBlank()) {
					lider = nombreLider;
				}
			}
		} catch (Exception e) {
			lider = "Líder de Proyecto";
		}

		String descProyecto = null;
		try {
			if (actividad.getProyecto() != null) {
				descProyecto = actividad.getProyecto().getDescripcion();
			}
		} catch (Exception ignored) {
		}

		String estProyecto = "Activo";
		try {
			if (actividad.getProyecto() != null) {
				if (actividad.getProyecto().getEstadoOperativo() != null) {
					estProyecto = "EN_EJECUCION".equalsIgnoreCase(actividad.getProyecto().getEstadoOperativo())
							? "Activo"
							: actividad.getProyecto().getEstadoOperativo();
				} else if (actividad.getProyecto().getEstadoHabilitacion() != null) {
					estProyecto = actividad.getProyecto().getEstadoHabilitacion().name();
				}
			}
		} catch (Exception ignored) {
		}

		Integer ordenEtapa = actividad.getEtapa() != null ? actividad.getEtapa().getOrden() : 1;

		return new ActividadResponse(
				actividad.getId(),
				actividad.getProyecto().getId(),
				actividad.getProyecto().getNombre(),
				descProyecto,
				estProyecto,
				null,
				actividad.getEtapa().getId(),
				actividad.getEtapa().getNombre(),
				ordenEtapa,
				actividad.getDesarrollador().getId(),
				actividad.getDesarrollador().nombreCompleto(),
				actividad.getDescripcion(),
				estado,
				actividad.getPrioridad(),
				actividad.getFechaPlanificada(),
				porcentaje,
				lider,
				null,
				null);
	}

}

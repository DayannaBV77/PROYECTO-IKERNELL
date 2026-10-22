package com.PROYECTO.IKERNELL.backend.actividades;

import org.springframework.data.jpa.domain.Specification;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.CriteriosBusquedaActividad;

/**
 * Construye la consulta de RF-020 con los cuatro criterios de HU-13 C03.
 *
 * <p>El criterio de proyecto navega por la etapa, porque la actividad no guarda
 * el proyecto por separado.
 */
final class ActividadSpecifications {

	private ActividadSpecifications() {
	}

	static Specification<Actividad> desde(CriteriosBusquedaActividad criterios) {
		Specification<Actividad> especificacion = (raiz, consulta, cb) -> cb.conjunction();

		if (criterios.identificador() != null) {
			especificacion = especificacion
					.and((raiz, consulta, cb) -> cb.equal(raiz.get("id"), criterios.identificador()));
		}
		if (criterios.proyectoId() != null) {
			especificacion = especificacion.and((raiz, consulta, cb) -> cb.equal(
					raiz.get("etapa").get("proyecto").get("id"), criterios.proyectoId()));
		}
		if (criterios.etapaId() != null) {
			especificacion = especificacion
					.and((raiz, consulta, cb) -> cb.equal(raiz.get("etapa").get("id"), criterios.etapaId()));
		}
		if (criterios.desarrolladorId() != null) {
			especificacion = especificacion.and((raiz, consulta, cb) -> cb.equal(
					raiz.get("desarrollador").get("id"), criterios.desarrolladorId()));
		}
		return especificacion;
	}

}

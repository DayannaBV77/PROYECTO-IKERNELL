package com.PROYECTO.IKERNELL.backend.proyectos;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.CriteriosBusquedaProyecto;

/**
 * Construye la consulta de RF-013 con los tres criterios de HU-09 C01:
 * identificador, nombre y estado. Todos opcionales, combinados con AND.
 */
final class ProyectoSpecifications {

	private ProyectoSpecifications() {
	}

	static Specification<Proyecto> desde(CriteriosBusquedaProyecto criterios) {
		Specification<Proyecto> especificacion = (raiz, consulta, cb) -> cb.conjunction();

		if (criterios.identificador() != null) {
			especificacion = especificacion
					.and((raiz, consulta, cb) -> cb.equal(raiz.get("id"), criterios.identificador()));
		}
		if (StringUtils.hasText(criterios.nombre())) {
			String patron = "%" + criterios.nombre().trim().toLowerCase() + "%";
			especificacion = especificacion
					.and((raiz, consulta, cb) -> cb.like(cb.lower(raiz.get("nombre")), patron));
		}
		if (criterios.estadoHabilitacion() != null) {
			especificacion = especificacion.and((raiz, consulta, cb) -> cb.equal(
					raiz.get("estadoHabilitacion"), criterios.estadoHabilitacion()));
		}
		return especificacion;
	}

}

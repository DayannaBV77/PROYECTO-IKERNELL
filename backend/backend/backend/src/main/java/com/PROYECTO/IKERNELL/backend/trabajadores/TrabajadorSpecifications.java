package com.PROYECTO.IKERNELL.backend.trabajadores;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.CriteriosBusquedaTrabajador;

/**
 * Construye la consulta de RF-004 a partir de los criterios recibidos.
 *
 * <p>Los criterios son opcionales y se combinan con AND: RF-004 habla de "uno o
 * varios criterios". Los campos de texto se comparan sin distinguir mayusculas
 * y por coincidencia parcial, porque HU-05 C01 describe una busqueda por lo que
 * el coordinador "escribe", no una igualdad exacta.
 */
final class TrabajadorSpecifications {

	private TrabajadorSpecifications() {
	}

	static Specification<Trabajador> desde(CriteriosBusquedaTrabajador criterios) {
		Specification<Trabajador> especificacion = (raiz, consulta, cb) -> cb.conjunction();

		especificacion = especificacion
				.and(contiene("identificacion", criterios.identificacion()))
				.and(contiene("nombre", criterios.nombre()))
				.and(contiene("apellido", criterios.apellido()))
				.and(contiene("profesion", criterios.profesion()))
				.and(contiene("especialidadDesarrollo", criterios.especialidadDesarrollo()));

		if (criterios.tipoTrabajador() != null) {
			especificacion = especificacion
					.and((raiz, consulta, cb) -> cb.equal(raiz.get("tipoTrabajador"), criterios.tipoTrabajador()));
		}
		if (criterios.estado() != null) {
			especificacion = especificacion
					.and((raiz, consulta, cb) -> cb.equal(raiz.get("estado"), criterios.estado()));
		}
		return especificacion;
	}

	/** Devuelve una especificacion neutra cuando el criterio no viene informado. */
	private static Specification<Trabajador> contiene(String campo, String valor) {
		if (!StringUtils.hasText(valor)) {
			return (raiz, consulta, cb) -> cb.conjunction();
		}
		String patron = "%" + valor.trim().toLowerCase() + "%";
		return (raiz, consulta, cb) -> cb.like(cb.lower(raiz.get(campo)), patron);
	}

}

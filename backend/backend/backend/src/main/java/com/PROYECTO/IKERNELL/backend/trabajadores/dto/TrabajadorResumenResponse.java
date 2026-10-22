package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Fila de la lista de resultados de busqueda (RF-004).
 *
 * <p>Deliberadamente mas corta que el perfil completo: RNF-005 pide que las
 * consultas recuperen unicamente la informacion necesaria para la operacion.
 * El detalle se obtiene abriendo el perfil, como describe HU-05 C01.
 */
public record TrabajadorResumenResponse(
		Long id,
		String identificacion,
		String nombreCompleto,
		String profesion,
		String especialidadDesarrollo,
		TipoTrabajador tipoTrabajador,
		EstadoHabilitacion estado) {

	public static TrabajadorResumenResponse de(Trabajador trabajador) {
		return new TrabajadorResumenResponse(
				trabajador.getId(),
				trabajador.getIdentificacion(),
				trabajador.nombreCompleto(),
				trabajador.getProfesion(),
				trabajador.getEspecialidadDesarrollo(),
				trabajador.getTipoTrabajador(),
				trabajador.getEstado());
	}

}

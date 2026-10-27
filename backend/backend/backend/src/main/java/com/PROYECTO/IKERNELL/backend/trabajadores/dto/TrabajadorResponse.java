package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import java.time.LocalDate;
import java.util.List;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Perfil completo del trabajador, para la vista de detalle (RF-004, HU-05 C01). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TrabajadorResponse(
		Long id,
		String identificacion,
		String nombre,
		String apellido,
		LocalDate fechaNacimiento,
		String direccion,
		String profesion,
		String especialidadDesarrollo,
		TipoTrabajador tipoTrabajador,
		EstadoHabilitacion estado,
		boolean tieneFotografia,
		List<HabilidadTrabajadorResponse> habilidades) {

	public static TrabajadorResponse de(Trabajador trabajador, List<HabilidadTrabajadorResponse> habilidades) {
		return new TrabajadorResponse(
				trabajador.getId(),
				trabajador.getIdentificacion(),
				trabajador.getNombre(),
				trabajador.getApellido(),
				trabajador.getFechaNacimiento(),
				trabajador.getDireccion(),
				trabajador.getProfesion(),
				trabajador.getEspecialidadDesarrollo(),
				trabajador.getTipoTrabajador(),
				trabajador.getEstado(),
				trabajador.getFotoRuta() != null,
				habilidades);
	}

}

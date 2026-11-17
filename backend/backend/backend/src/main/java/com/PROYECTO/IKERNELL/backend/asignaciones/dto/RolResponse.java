package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Rol;

public record RolResponse(Long id, String nombreRol) {

	public static RolResponse de(Rol rol) {
		return new RolResponse(rol.getId(), rol.getNombreRol());
	}
}

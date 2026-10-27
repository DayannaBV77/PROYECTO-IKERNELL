package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.CategoriaHabilidad;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.HabilidadTrabajador;

public record HabilidadTrabajadorResponse(CategoriaHabilidad categoria, String nombre) {

	public static HabilidadTrabajadorResponse de(HabilidadTrabajador habilidad) {
		return new HabilidadTrabajadorResponse(habilidad.getCategoria(), habilidad.getNombre());
	}
}

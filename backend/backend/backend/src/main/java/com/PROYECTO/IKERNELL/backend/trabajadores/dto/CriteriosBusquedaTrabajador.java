package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Criterios de busqueda de trabajadores (RF-004, HU-05 C01).
 *
 * <p>Los seis primeros son los que enumeran el requerimiento y el criterio de
 * aceptacion: identificacion, nombre, apellido, profesion, especialidad y tipo.
 * Todos son opcionales y se combinan con AND; "uno o varios criterios" segun
 * RF-004.
 *
 * <p>{@code estado} no lo pide RF-004; se agrega porque al inhabilitar un
 * trabajador el historial se conserva (RN-02) y sin este filtro la lista
 * mezclaria habilitados e inhabilitados sin posibilidad de separarlos.
 */
public record CriteriosBusquedaTrabajador(
		String identificacion,
		String nombre,
		String apellido,
		String profesion,
		String especialidadDesarrollo,
		TipoTrabajador tipoTrabajador,
		EstadoHabilitacion estado) {
}

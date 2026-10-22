package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.List;

/**
 * Resultado de asignar varios desarrolladores de una vez (RF-009, HU-10).
 *
 * <p>Se informa por desarrollador en lugar de aceptar o rechazar el lote
 * completo, porque HU-10 C03 dice que el sistema "no asigna a ESE desarrollador
 * y me avisa que esta inhabilitado": habla de uno, no del lote.
 *
 * <p>PROPUESTA: esa lectura implica exito parcial. Si la empresa prefiere todo o
 * nada, el cambio esta localizado en el servicio.
 *
 * @param asignados  los que quedaron asignados
 * @param rechazados los que no, con el motivo para mostrar al lider
 */
public record ResultadoAsignacionEquipoResponse(
		List<AsignacionResponse> asignados,
		List<DesarrolladorRechazado> rechazados) {

	public record DesarrolladorRechazado(Long desarrolladorId, String motivo) {
	}

}

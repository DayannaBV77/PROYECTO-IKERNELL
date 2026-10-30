package com.PROYECTO.IKERNELL.backend.midia.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Nuevo estado de un elemento del checklist (RF-038).
 *
 * <p>Se usa tanto para las tareas personales como para las actividades del
 * sistema. {@code completada} es obligatorio y explicito: no se interpreta la
 * ausencia del campo como un cambio, porque un cuerpo vacio no dice si la
 * persona quiere marcar o desmarcar.
 */
public record CambioEstadoTareaRequest(

		@NotNull(message = "Debe indicar si la tarea queda completada.")
		Boolean completada) {
}

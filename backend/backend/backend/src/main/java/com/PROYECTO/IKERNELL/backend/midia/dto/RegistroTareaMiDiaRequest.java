package com.PROYECTO.IKERNELL.backend.midia.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos con los que el trabajador agrega una tarea personal a su dia (RF-038).
 *
 * <p>{@code descripcion} es lo unico obligatorio. {@code fecha} es opcional y,
 * si no llega, el servidor usa el dia de hoy: el formulario rapido del panel no
 * pide fecha porque su proposito es anotar algo para ahora mismo.
 *
 * <p>El trabajador no viaja en la peticion: sale de la sesion. Asi no hay forma
 * de crear una tarea a nombre de otra persona.
 */
public record RegistroTareaMiDiaRequest(

		@NotBlank(message = "La tarea debe tener una descripcion.")
		@Size(max = 500, message = "La tarea admite hasta 500 caracteres.")
		String descripcion,

		LocalDate fecha) {
}

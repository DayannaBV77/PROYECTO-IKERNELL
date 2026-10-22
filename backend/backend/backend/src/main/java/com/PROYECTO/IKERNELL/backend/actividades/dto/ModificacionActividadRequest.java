package com.PROYECTO.IKERNELL.backend.actividades.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Campos modificables de una actividad ante una eventualidad (RF-021, HU-13 C05).
 *
 * <p>El desarrollador NO esta aqui: RF-021 ordena "conservar la asociacion con
 * el proyecto y el desarrollador, salvo que una regla de negocio permita
 * cambiarla", y esa regla no existe todavia.
 *
 * <p>La etapa si se admite, y es una PROPUESTA: HU-13 C05 solo garantiza que la
 * actividad siga asociada al mismo proyecto y al mismo desarrollador, sin
 * mencionar la etapa, y replanificar ante una eventualidad es justamente el
 * motivo de RF-021. El servicio exige que la nueva etapa sea del mismo proyecto,
 * con lo que la garantia del criterio se mantiene.
 *
 * <p>PENDIENTE: HU-13 T1 deja abierto "si se pedira el motivo al modificarla".
 * No se incluye campo de motivo porque no habria donde conservarlo.
 */
public record ModificacionActividadRequest(

		@NotNull(message = "Debe indicar la etapa del proyecto.")
		Long etapaId,

		@NotBlank(message = "Debe indicar la descripcion de la actividad.")
		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion) {
}

package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Campos modificables del perfil (RF-005).
 *
 * <p>Son exactamente los tres que RF-005 autoriza: "la direccion, especialidad
 * de desarrollo, tipo de trabajador". La identificacion NO es editable (decision
 * sobre la contradiccion C-03), y por eso no aparece aqui: no basta con
 * ignorarla, es que el cliente no tiene forma de enviarla.
 *
 * <p>Consecuencia documental: la parte de HU-05 C04 que describe "escribi una
 * identificacion que ya pertenece a otro trabajador" deja de ser alcanzable.
 * La otra mitad del criterio -dato obligatorio vacio- sigue vigente.
 */
public record ModificacionTrabajadorRequest(

		@NotBlank(message = "Debe indicar la direccion.")
		@Size(max = 200, message = "La direccion admite hasta 200 caracteres.")
		String direccion,

		@NotBlank(message = "Debe indicar la especialidad de desarrollo.")
		@Size(max = 100, message = "La especialidad admite hasta 100 caracteres.")
		String especialidadDesarrollo,

		@NotNull(message = "Debe indicar el tipo de trabajador.")
		TipoTrabajador tipoTrabajador) {
}

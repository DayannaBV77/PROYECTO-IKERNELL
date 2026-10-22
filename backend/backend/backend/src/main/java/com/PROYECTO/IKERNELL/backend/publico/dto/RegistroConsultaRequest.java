package com.PROYECTO.IKERNELL.backend.publico.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Consulta enviada desde el formulario publico (RF-035, HU-02).
 *
 * <p>La pregunta es obligatoria (HU-02 C03 la pone como ejemplo de campo
 * obligatorio). Los datos de contacto son opcionales porque HU-02 T1 deja
 * abierto cuales pedira la empresa; lo que si se valida es el FORMATO del correo
 * cuando llega, que es exactamente el caso de HU-02 C04.
 */
public record RegistroConsultaRequest(

		@NotBlank(message = "Debe escribir su pregunta.")
		@Size(max = 4000, message = "La pregunta admite hasta 4000 caracteres.")
		String pregunta,

		@Size(max = 150, message = "El nombre admite hasta 150 caracteres.")
		String nombreContacto,

		@Email(message = "El correo electronico no tiene un formato valido.")
		@Size(max = 150, message = "El correo admite hasta 150 caracteres.")
		String correoContacto,

		@Size(max = 50, message = "El telefono admite hasta 50 caracteres.")
		String telefonoContacto) {
}

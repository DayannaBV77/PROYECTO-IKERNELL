package com.PROYECTO.IKERNELL.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Mensaje que se envia a un hilo (RF-037, HU-22 C02).
 *
 * <p>HU-22 C02 habla de un "mensaje valido": el minimo es que tenga contenido.
 * El autor y la fecha NO viajan aqui -los pone el servidor a partir de la sesion
 * y del momento en que acepta el mensaje-, de modo que no hay forma de escribir
 * en nombre de otra persona ni de falsear la fecha desde el cliente.
 */
public record RegistroMensajeRequest(

		@NotBlank(message = "Debe escribir el mensaje antes de enviarlo.")
		@Size(max = 4000, message = "El mensaje admite hasta 4000 caracteres.")
		String cuerpo) {
}

package com.PROYECTO.IKERNELL.backend.trabajadores.dto;

import java.time.LocalDate;
import java.util.List;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.validacion.DireccionColombiana;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

/**
 * Datos para registrar el perfil de un trabajador (RF-001, HU-04 C01).
 *
 * <p>Los ocho campos son obligatorios: el Caso de Estudio p.2 y HU-04 C01 los
 * enumeran como los datos que el coordinador llena. El mensaje de cada
 * restriccion es el texto que el cliente muestra junto al campo, de modo que
 * HU-04 C02 pueda indicar que falta sin descartar lo ya escrito (RN-13).
 */
public record RegistroTrabajadorRequest(

		@NotBlank(message = "Debe indicar la identificacion.")
		@Pattern(regexp = "[0-9]{10}", message = "La identificacion debe tener exactamente 10 digitos.")
		@Size(max = 10, message = "La identificacion admite maximo 10 digitos.")
		String identificacion,

		@NotBlank(message = "Debe indicar el nombre.")
		@Size(max = 100, message = "El nombre admite hasta 100 caracteres.")
		String nombre,

		@NotBlank(message = "Debe indicar el apellido.")
		@Size(max = 100, message = "El apellido admite hasta 100 caracteres.")
		String apellido,

		@NotNull(message = "Debe indicar la fecha de nacimiento.")
		@Past(message = "La fecha de nacimiento debe ser anterior a hoy.")
		LocalDate fechaNacimiento,

		@NotBlank(message = "Debe indicar la direccion.")
		@Size(max = 200, message = "La direccion admite hasta 200 caracteres.")
		@DireccionColombiana
		String direccion,

		@NotBlank(message = "Debe indicar la profesion.")
		@Size(max = 100, message = "La profesion admite hasta 100 caracteres.")
		String profesion,

		@NotBlank(message = "Debe indicar la especialidad de desarrollo.")
		@Size(max = 100, message = "La especialidad admite hasta 100 caracteres.")
		String especialidadDesarrollo,

		@NotNull(message = "Debe indicar el tipo de trabajador.")
		TipoTrabajador tipoTrabajador,

		@Size(max = 23, message = "Se admiten hasta 23 habilidades.")
		List<@NotNull @Valid HabilidadTrabajadorRequest> habilidades) {
}

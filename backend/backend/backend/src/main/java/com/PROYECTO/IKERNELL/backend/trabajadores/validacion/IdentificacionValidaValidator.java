package com.PROYECTO.IKERNELL.backend.trabajadores.validacion;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoIdentificacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.RegistroTrabajadorRequest;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IdentificacionValidaValidator
		implements ConstraintValidator<IdentificacionValida, RegistroTrabajadorRequest> {

	@Override
	public boolean isValid(RegistroTrabajadorRequest request, ConstraintValidatorContext context) {
		if (request == null) {
			return true;
		}

		String identificacion = request.identificacion();
		if (identificacion == null || identificacion.isBlank()) {
			return true; // Se valida con @NotBlank en el campo correspondiente
		}

		String texto = identificacion.trim();
		TipoIdentificacion tipo = request.tipoIdentificacionResuelto();

		String mensajeError = validarSegunTipo(tipo, texto);
		if (mensajeError != null) {
			context.disableDefaultConstraintViolation();
			context.buildConstraintViolationWithTemplate(mensajeError)
					.addPropertyNode("identificacion")
					.addConstraintViolation();
			return false;
		}

		return true;
	}

	public static String validarSegunTipo(TipoIdentificacion tipo, String texto) {
		return switch (tipo) {
			case CEDULA_CIUDADANIA -> {
				if (!texto.matches("\\d+")) {
					yield "La cédula de ciudadanía solo puede contener números.";
				}
				if (texto.length() < 7 || texto.length() > 10) {
					yield "La cédula de ciudadanía debe contener entre 7 y 10 dígitos numéricos.";
				}
				yield null;
			}
			case TARJETA_IDENTIDAD -> {
				if (!texto.matches("\\d+")) {
					yield "La tarjeta de identidad solo puede contener números.";
				}
				if (texto.length() < 10 || texto.length() > 11) {
					yield "La tarjeta de identidad debe contener 10 u 11 dígitos numéricos.";
				}
				yield null;
			}
			case CEDULA_EXTRANJERIA -> {
				if (!texto.matches("[A-Za-z0-9]+")) {
					yield "La cédula de extranjería solo admite caracteres alfanuméricos sin espacios ni símbolos.";
				}
				if (texto.length() < 6 || texto.length() > 12) {
					yield "La cédula de extranjería debe contener entre 6 y 12 caracteres.";
				}
				yield null;
			}
			case PASAPORTE -> {
				if (!texto.matches("[A-Za-z0-9]+")) {
					yield "El pasaporte solo admite letras y números sin espacios ni símbolos.";
				}
				if (texto.length() < 6 || texto.length() > 16) {
					yield "El pasaporte debe contener entre 6 y 16 caracteres alfanuméricos.";
				}
				yield null;
			}
			case PPT -> {
				if (!texto.matches("[A-Za-z0-9]+")) {
					yield "El permiso por protección temporal solo admite caracteres alfanuméricos.";
				}
				if (texto.length() < 7 || texto.length() > 10) {
					yield "El permiso por protección temporal (PPT) debe contener entre 7 y 10 caracteres.";
				}
				yield null;
			}
		};
	}

}

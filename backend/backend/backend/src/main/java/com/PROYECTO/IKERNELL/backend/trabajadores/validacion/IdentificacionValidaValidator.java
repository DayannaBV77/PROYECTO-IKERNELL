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

		if (!texto.matches("\\d+")) {
			context.disableDefaultConstraintViolation();
			context.buildConstraintViolationWithTemplate("La identificación solo puede contener números.")
					.addPropertyNode("identificacion")
					.addConstraintViolation();
			return false;
		}

		TipoIdentificacion tipo = request.tipoIdentificacionResuelto();
		if (tipo == TipoIdentificacion.CEDULA_EXTRANJERIA) {
			if (texto.length() < 4 || texto.length() > 7) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate("La cédula de extranjería debe tener entre 4 y 7 dígitos.")
						.addPropertyNode("identificacion")
						.addConstraintViolation();
				return false;
			}
		} else {
			if (texto.length() < 8 || texto.length() > 10) {
				context.disableDefaultConstraintViolation();
				context.buildConstraintViolationWithTemplate("La cédula de ciudadanía debe tener entre 8 y 10 dígitos.")
						.addPropertyNode("identificacion")
						.addConstraintViolation();
				return false;
			}
		}

		return true;
	}

}

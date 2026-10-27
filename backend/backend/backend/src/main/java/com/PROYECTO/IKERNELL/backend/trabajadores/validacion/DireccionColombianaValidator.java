package com.PROYECTO.IKERNELL.backend.trabajadores.validacion;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DireccionColombianaValidator implements ConstraintValidator<DireccionColombiana, String> {

	private static final Pattern CARACTERES_PERMITIDOS = Pattern
			.compile("[\\p{L}\\p{M}\\d\\s#.,/()º°'\\-]+");

	private static final Pattern NOMENCLATURA_URBANA = Pattern.compile(
			"\\b(?:calle|cl\\.?|carrera|cra\\.?|carr\\.?|avenida|av\\.?|diagonal|diag\\.?|dg\\.?|transversal|transv\\.?|tv\\.?|circular|circ\\.?|autopista|v[ií]a)\\s+\\d+[a-z]?(?:\\s*(?:bis|sur|norte|este|oeste))?\\s*(?:#|n(?:o|°|º|umero)?\\.?)\\s*\\d+[a-z]?\\s*[-–]\\s*\\d+[a-z]?\\b",
			Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

	private static final Pattern REFERENCIA_RURAL = Pattern.compile(
			"\\b(?:vereda|corregimiento|finca|hacienda|caser[ií]o|inspecci[oó]n|resguardo|km|kil[oó]metro)\\s+[\\p{L}\\p{M}\\d]",
			Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

	@Override
	public boolean isValid(String direccion, ConstraintValidatorContext context) {
		if (direccion == null || direccion.isBlank() || direccion.length() > 200) {
			return true;
		}

		String candidata = direccion.strip();
		if (!CARACTERES_PERMITIDOS.matcher(candidata).matches()) {
			return false;
		}

		return NOMENCLATURA_URBANA.matcher(candidata).find()
				|| REFERENCIA_RURAL.matcher(candidata).find();
	}
}

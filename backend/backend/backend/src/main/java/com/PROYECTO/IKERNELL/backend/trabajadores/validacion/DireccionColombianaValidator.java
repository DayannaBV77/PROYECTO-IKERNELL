package com.PROYECTO.IKERNELL.backend.trabajadores.validacion;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DireccionColombianaValidator implements ConstraintValidator<DireccionColombiana, String> {

	private static final Pattern CARACTERES_PERMITIDOS = Pattern
			.compile("[\\p{L}\\p{M}\\d\\s#.,/()º°'\\-]+");

	private static final Pattern NOMENCLATURA_URBANA = Pattern.compile(
			"\\b(?:avenida\\s+calle|avenida\\s+carrera|av\\.?\\s+calle|av\\.?\\s+carrera|calle|cll?\\.?|carrera|cra\\.?|carr\\.?|diagonal|diag\\.?|dg\\.?|transversal|transv\\.?|tv\\.?|circular|circ\\.?|autopista|autop\\.?|avenida|av\\.?|ac\\.?|ak\\.?|v[ií]a)\\s+\\d+[a-z]{0,2}(?:\\s+(?:bis|[a-z]|sur|norte|este|oeste)){0,3}\\s*(?:#|n(?:o|°|º|umero)?\\.?)\\s*\\d+[a-z]{0,2}(?:\\s+(?:bis|[a-z]|sur|norte|este|oeste)){0,2}(?:\\s*[-–]\\s*|\\s+)\\d+[a-z]?(?:\\s*(?:sur|norte|este|oeste))?\\b",
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

package com.PROYECTO.IKERNELL.backend.publico;

import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Validador para detectar términos ofensivos y groserías en textos enviados por usuarios.
 */
public final class ValidadorLenguaje {

	private static final List<String> PALABRAS_OFENSIVAS = List.of(
			"gonorrea",
			"malparido",
			"malparida",
			"hijueputa",
			"hdp",
			"hp",
			"puta",
			"puto",
			"mierda",
			"carechimba",
			"pirobo",
			"piroba",
			"careverga",
			"verga",
			"marica",
			"maricon",
			"estupido",
			"estupida",
			"imbecil",
			"pendejo",
			"pendeja",
			"culiao",
			"culiado",
			"cabron",
			"cabrona",
			"perra",
			"coño",
			"carajo",
			"tarado",
			"tarada",
			"idiota",
			"huevon",
			"weon",
			"weona",
			"chucha",
			"caremonda",
			"zorra"
	);

	private ValidadorLenguaje() {
	}

	public static boolean contieneGroserias(String texto) {
		if (texto == null || texto.isBlank()) {
			return false;
		}

		String normalizado = normalizar(texto);
		for (String palabra : PALABRAS_OFENSIVAS) {
			Pattern patron = Pattern.compile("(^|[^a-z0-9])" + Pattern.quote(palabra) + "([^a-z0-9]|$)", Pattern.CASE_INSENSITIVE);
			if (patron.matcher(normalizado).find()) {
				return true;
			}
		}
		return false;
	}

	private static String normalizar(String texto) {
		return Normalizer.normalize(texto, Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "")
				.toLowerCase();
	}
}


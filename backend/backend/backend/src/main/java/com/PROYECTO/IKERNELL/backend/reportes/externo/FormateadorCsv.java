package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

/**
 * CSV con comillas y escape segun RFC 4180 (RF-025, HU-19 C02).
 *
 * <p>A diferencia del delimitado, aqui si existe una regla de escape: un valor
 * que contenga el separador, comillas o saltos de linea se encierra entre
 * comillas y las comillas internas se duplican. Es lo que permite exportar un
 * nombre de proyecto con coma sin romper las columnas.
 *
 * <p>El separador tambien es configurable. El valor por defecto del reporte es
 * {@code |}, pensado para el formato delimitado; si la empresa pide CSV con
 * coma, basta con fijar {@code ikernell.reporte-externo.separador=,}.
 */
@Component
public class FormateadorCsv implements FormateadorReporteExterno {

	@Override
	public FormatoReporteExterno formato() {
		return FormatoReporteExterno.CSV;
	}

	@Override
	public String extension() {
		return ".csv";
	}

	@Override
	public String formatear(List<String> cabecera, List<List<String>> filas,
			ConfiguracionReporteExterno config) {
		String separador = config.getSeparador();
		String fin = config.getFinDeLinea();
		StringBuilder contenido = new StringBuilder();

		if (config.isIncluirCabecera()) {
			contenido.append(fila(cabecera, separador)).append(fin);
		}
		for (List<String> valores : filas) {
			contenido.append(fila(valores, separador)).append(fin);
		}
		return contenido.toString();
	}

	private String fila(List<String> valores, String separador) {
		return valores.stream()
				.map(valor -> escapar(valor, separador))
				.collect(Collectors.joining(separador));
	}

	private String escapar(String valor, String separador) {
		String limpio = TextoReporte.limpiar(valor);
		boolean necesitaComillas = limpio.contains(separador)
				|| limpio.contains("\"")
				|| limpio.contains("\n")
				|| limpio.contains("\r");
		if (!necesitaComillas) {
			return limpio;
		}
		return '"' + limpio.replace("\"", "\"\"") + '"';
	}

}

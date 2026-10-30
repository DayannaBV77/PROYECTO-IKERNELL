package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Formato de ancho fijo (RF-025, HU-19 C02).
 *
 * <p>Cada campo ocupa siempre el mismo numero de caracteres, de modo que el
 * receptor pueda cortar por posicion sin depender de un separador. El ancho se
 * configura por campo en {@code ikernell.reporte-externo.anchos.*}; si un campo
 * no declara el suyo se usa un ancho por defecto.
 *
 * <p>Los valores que exceden su ancho se recortan. Es preferible a correr las
 * columnas de todas las filas siguientes, que es el fallo tipico de este
 * formato cuando un nombre es mas largo de lo previsto.
 */
@Component
public class FormateadorAnchoFijo implements FormateadorReporteExterno {

	/** Ancho usado cuando la configuracion no declara uno para el campo. */
	static final int ANCHO_POR_DEFECTO = 24;

	@Override
	public FormatoReporteExterno formato() {
		return FormatoReporteExterno.ANCHO_FIJO;
	}

	@Override
	public String extension() {
		return ".txt";
	}

	@Override
	public String formatear(List<String> cabecera, List<List<String>> filas,
			ConfiguracionReporteExterno config) {
		String fin = config.getFinDeLinea();
		StringBuilder contenido = new StringBuilder();

		if (config.isIncluirCabecera()) {
			contenido.append(fila(cabecera, cabecera, config)).append(fin);
		}
		for (List<String> valores : filas) {
			contenido.append(fila(valores, cabecera, config)).append(fin);
		}
		return contenido.toString();
	}

	private String fila(List<String> valores, List<String> cabecera,
			ConfiguracionReporteExterno config) {
		StringBuilder linea = new StringBuilder();
		for (int i = 0; i < valores.size(); i++) {
			String campo = i < cabecera.size() ? cabecera.get(i) : "";
			int ancho = config.getAnchos().getOrDefault(campo, ANCHO_POR_DEFECTO);
			linea.append(TextoReporte.ajustar(valores.get(i), ancho));
		}
		return linea.toString();
	}

}

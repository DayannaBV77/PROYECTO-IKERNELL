package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

/**
 * Formato delimitado simple: un registro por linea y campos unidos por el
 * separador configurado (RF-025, HU-19 C02).
 *
 * <p>Es el formato por defecto mientras la empresa brasileña no defina el
 * suyo. No entrecomilla porque un archivo plano no define escape; el separador
 * y los saltos de linea se sustituyen por espacios para que ningun valor pueda
 * partir la fila.
 */
@Component
public class FormateadorDelimitado implements FormateadorReporteExterno {

	@Override
	public FormatoReporteExterno formato() {
		return FormatoReporteExterno.DELIMITADO;
	}

	@Override
	public String extension() {
		return ".txt";
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
				.map(valor -> TextoReporte.limpiar(valor, separador))
				.collect(Collectors.joining(separador));
	}

}

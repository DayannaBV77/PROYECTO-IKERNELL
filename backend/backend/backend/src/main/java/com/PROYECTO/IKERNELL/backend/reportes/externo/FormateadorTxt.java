package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Formato de texto legible (RF-025, HU-19 C02).
 *
 * <p>Un bloque de {@code campo: valor} por proyecto, separados por una linea en
 * blanco. No esta pensado para que lo parsee un programa -para eso estan el
 * delimitado, el CSV y el ancho fijo-, sino para revisar el contenido a ojo
 * antes de enviarlo. Aun asi conserva exactamente los mismos campos y excluye
 * los mismos datos personales que los demas formatos.
 */
@Component
public class FormateadorTxt implements FormateadorReporteExterno {

	@Override
	public FormatoReporteExterno formato() {
		return FormatoReporteExterno.TXT;
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
			contenido.append("# ").append(config.getNombreBase()).append(fin).append(fin);
		}
		for (List<String> valores : filas) {
			for (int i = 0; i < valores.size(); i++) {
				String campo = i < cabecera.size() ? cabecera.get(i) : "";
				contenido.append(campo).append(": ")
						.append(TextoReporte.limpiar(valores.get(i)))
						.append(fin);
			}
			contenido.append(fin);
		}
		return contenido.toString();
	}

}

package com.PROYECTO.IKERNELL.backend.reportes.externo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Formateadores del reporte externo (RF-025, HU-19 C02).
 *
 * <p>La estructura definitiva del archivo sigue pendiente de acuerdo con la
 * empresa brasileña (HU-19 T1), asi que lo que se comprueba aqui no es un
 * formato concreto sino que cada formateador respete la configuracion: el
 * separador, el fin de linea, la cabecera, el ancho de cada campo y, sobre
 * todo, que un valor con caracteres especiales no rompa la estructura.
 */
class FormateadoresReporteExternoTest {

	private static final List<String> CABECERA = List.of("proyecto_id", "proyecto_nombre",
			"ejecuciones_registradas");

	@Test
	@DisplayName("DELIMITADO: une los campos con el separador configurado")
	void delimitadoUneLosCamposConElSeparador() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.DELIMITADO, "|");

		String contenido = new FormateadorDelimitado().formatear(CABECERA,
				List.of(List.of("1", "Portal", "3")), config);

		assertThat(contenido).isEqualTo(
				"proyecto_id|proyecto_nombre|ejecuciones_registradas\n1|Portal|3\n");
	}

	@Test
	@DisplayName("DELIMITADO: respeta el fin de linea y la ausencia de cabecera")
	void delimitadoRespetaFinDeLineaYSinCabecera() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.DELIMITADO, ";");
		config.setFinDeLinea("\r\n");
		config.setIncluirCabecera(false);

		String contenido = new FormateadorDelimitado().formatear(CABECERA,
				List.of(List.of("1", "Portal", "3")), config);

		assertThat(contenido).isEqualTo("1;Portal;3\r\n");
	}

	@Test
	@DisplayName("DELIMITADO: un valor con el separador o un salto no parte la fila")
	void delimitadoNeutralizaElSeparadorYLosSaltos() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.DELIMITADO, "|");

		String contenido = new FormateadorDelimitado().formatear(CABECERA,
				List.of(List.of("1", "Portal | de\n documentos", "3")), config);

		List<String> lineas = contenido.strip().lines().toList();
		assertThat(lineas).hasSize(2);
		assertThat(lineas.get(1).split("\\|", -1)).hasSize(3);
		assertThat(lineas.get(1)).contains("Portal de documentos");
	}

	@Test
	@DisplayName("CSV: entrecomilla los valores con separador, comillas o saltos")
	void csvEntrecomillaCuandoHaceFalta() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.CSV, ",");

		String contenido = new FormateadorCsv().formatear(CABECERA,
				List.of(List.of("1", "Portal, \"interno\"", "3")), config);

		assertThat(contenido).contains("\"Portal, \"\"interno\"\"\"");
	}

	@Test
	@DisplayName("CSV: no entrecomilla los valores que no lo necesitan")
	void csvNoEntrecomillaValoresSimples() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.CSV, ",");

		String contenido = new FormateadorCsv().formatear(CABECERA,
				List.of(List.of("1", "Portal", "3")), config);

		assertThat(contenido).isEqualTo("proyecto_id,proyecto_nombre,ejecuciones_registradas\n"
				+ "1,Portal,3\n");
	}

	@Test
	@DisplayName("CSV: respeta un separador distinto de la coma")
	void csvRespetaElSeparadorConfigurado() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.CSV, "|");

		String contenido = new FormateadorCsv().formatear(CABECERA,
				List.of(List.of("1", "Portal | interno", "3")), config);

		assertThat(contenido.strip().lines().toList().get(1))
				.isEqualTo("1|\"Portal | interno\"|3");
	}

	@Test
	@DisplayName("ANCHO_FIJO: cada campo ocupa exactamente su ancho configurado")
	void anchoFijoRespetaLosAnchos() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.ANCHO_FIJO, "|");
		config.setAnchos(java.util.Map.of(
				"proyecto_id", 5,
				"proyecto_nombre", 10,
				"ejecuciones_registradas", 4));

		String contenido = new FormateadorAnchoFijo().formatear(CABECERA,
				List.of(List.of("1", "Portal", "3")), config);

		List<String> lineas = contenido.lines().toList();
		assertThat(lineas).hasSize(2);
		assertThat(lineas.get(1)).isEqualTo("1    Portal    3   ");
	}

	@Test
	@DisplayName("ANCHO_FIJO: recorta el valor que excede su ancho")
	void anchoFijoRecortaElValorLargo() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.ANCHO_FIJO, "|");
		config.setAnchos(java.util.Map.of(
				"proyecto_id", 3,
				"proyecto_nombre", 4,
				"ejecuciones_registradas", 2));
		config.setIncluirCabecera(false);

		String contenido = new FormateadorAnchoFijo().formatear(CABECERA,
				List.of(List.of("12345", "Portal documental", "999")), config);

		assertThat(contenido).isEqualTo("123Port99\n");
	}

	@Test
	@DisplayName("ANCHO_FIJO: los campos sin ancho declarado usan el ancho por defecto")
	void anchoFijoUsaElAnchoPorDefecto() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.ANCHO_FIJO, "|");
		config.setAnchos(java.util.Map.of());
		config.setIncluirCabecera(false);

		String contenido = new FormateadorAnchoFijo().formatear(CABECERA,
				List.of(List.of("1", "Portal", "3")), config);

		int ancho = FormateadorAnchoFijo.ANCHO_POR_DEFECTO;
		assertThat(contenido.lines().findFirst().orElseThrow().length())
				.isEqualTo(ancho * 3);
	}

	@Test
	@DisplayName("TXT: escribe un bloque legible por proyecto")
	void txtEscribeBloquesLegibles() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.TXT, "|");

		String contenido = new FormateadorTxt().formatear(CABECERA,
				List.of(List.of("1", "Portal", "3")), config);

		assertThat(contenido).contains("proyecto_id: 1");
		assertThat(contenido).contains("proyecto_nombre: Portal");
		assertThat(contenido).contains("ejecuciones_registradas: 3");
		assertThat(contenido).contains("# ikernell-reporte-externo");
	}

	@Test
	@DisplayName("TXT: separa los proyectos con una linea en blanco")
	void txtSeparaLosProyectos() {
		ConfiguracionReporteExterno config = configuracion(FormatoReporteExterno.TXT, "|");
		config.setIncluirCabecera(false);

		String contenido = new FormateadorTxt().formatear(CABECERA,
				List.of(List.of("1", "Uno", "1"), List.of("2", "Dos", "2")), config);

		assertThat(contenido).contains("proyecto_nombre: Uno\nejecuciones_registradas: 1\n\n"
				+ "proyecto_id: 2");
	}

	private ConfiguracionReporteExterno configuracion(FormatoReporteExterno formato,
			String separador) {
		ConfiguracionReporteExterno config = new ConfiguracionReporteExterno();
		config.setFormato(formato);
		config.setSeparador(separador);
		config.setCodificacion("UTF-8");
		config.setIncluirCabecera(true);
		config.setNombreBase("ikernell-reporte-externo");
		config.setFinDeLinea("\n");
		config.setCampos(CABECERA);
		config.validar();
		return config;
	}

}

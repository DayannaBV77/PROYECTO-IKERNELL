package com.PROYECTO.IKERNELL.backend.reportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Archivo plano para la empresa brasileña (RF-025, HU-19).
 *
 * <p>Se comprueba lo que la historia determina: quien puede generarlo (C05),
 * que ocurre sin informacion (C03) y que el archivo salga completo y con la
 * estructura configurada (C01).
 *
 * <p>C02 -"el archivo cumple la estructura acordada"- no se puede comprobar
 * todavia: esa estructura es justamente lo que HU-19 T1 deja pendiente de
 * acordar con la empresa brasileña (D-28). Lo que si se comprueba es que el
 * archivo respete el separador y la codificacion CONFIGURADOS, de modo que
 * cuando el acuerdo llegue baste ajustar la configuracion.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ArchivoPlanoControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private ProyectoRepository proyectos;

	private MockMvc mockMvc;
	private Authentication lider;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000001", "lider.plano@ikernell.com", TipoTrabajador.LIDER);
	}

	@Test
	@DisplayName("HU-19 C01: el archivo se genera con una fila por proyecto y su cabecera")
	void generaElArchivoConLosProyectos() throws Exception {
		Proyecto uno = proyectos.saveAndFlush(new Proyecto("Portal documental", "d", null));
		Proyecto dos = proyectos.saveAndFlush(new Proyecto("App de inventario", "d", null));

		MvcResult resultado = mockMvc.perform(
				get("/api/reportes/archivo-plano").with(authentication(lider)))
				.andExpect(status().isOk())
				// Se entrega como descarga, no como JSON: lo que espera la
				// empresa aliada es un archivo.
				.andExpect(header -> assertThat(
						header.getResponse().getHeader("Content-Disposition"))
						.contains("attachment").contains(".txt"))
				.andReturn();

		String contenido = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
		String[] lineas = contenido.strip().split("\n");

		assertThat(lineas).hasSize(3);
		assertThat(lineas[0]).isEqualTo(
				"proyecto_id;nombre;estado_habilitacion;estado_operativo;"
						+ "etapas_registradas;actividades_registradas;"
						+ "errores_registrados;interrupciones_registradas");
		assertThat(contenido).contains(uno.getId() + ";Portal documental;HABILITADO;");
		assertThat(contenido).contains(dos.getId() + ";App de inventario;HABILITADO;");
	}

	@Test
	@DisplayName("HU-19 C01: se pueden elegir los proyectos a incluir")
	void incluyeSoloLosProyectosElegidos() throws Exception {
		Proyecto incluido = proyectos.saveAndFlush(new Proyecto("Proyecto incluido", "d", null));
		Proyecto excluido = proyectos.saveAndFlush(new Proyecto("Proyecto excluido", "d", null));

		MvcResult resultado = mockMvc.perform(get("/api/reportes/archivo-plano")
				.param("proyectoIds", String.valueOf(incluido.getId()))
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andReturn();

		String contenido = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
		assertThat(contenido).contains("Proyecto incluido");
		assertThat(contenido).doesNotContain("Proyecto excluido");
		assertThat(contenido.strip().split("\n")).hasSize(2);
	}

	@Test
	@DisplayName("HU-19 C03: sin proyectos se avisa, en lugar de entregar un archivo vacio")
	void avisaCuandoNoHayInformacion() throws Exception {
		proyectos.deleteAll();

		mockMvc.perform(get("/api/reportes/archivo-plano").with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje")
						.value("No hay informacion de proyectos para generar el archivo."));
	}

	@Test
	@DisplayName("RF-025: un nombre con el separador no parte la fila en dos")
	void unNombreConElSeparadorNoRompeLaEstructura() throws Exception {
		proyectos.saveAndFlush(new Proyecto("Portal; de documentos", "d", null));

		MvcResult resultado = mockMvc.perform(
				get("/api/reportes/archivo-plano").with(authentication(lider)))
				.andExpect(status().isOk())
				.andReturn();

		String contenido = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
		String fila = contenido.strip().split("\n")[1];

		// Ocho campos: si el separador del nombre sobreviviera, serian nueve y el
		// receptor leeria las columnas corridas.
		assertThat(fila.split(";")).hasSize(8);
		assertThat(fila).contains("Portal de documentos");
	}

	@Test
	@DisplayName("HU-19 C05: un desarrollador no puede generar el archivo")
	void unDesarrolladorNoGeneraElArchivo() throws Exception {
		Authentication desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000002", "dev.plano@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/reportes/archivo-plano").with(authentication(desarrollador)))
				.andExpect(status().isForbidden());
	}

}

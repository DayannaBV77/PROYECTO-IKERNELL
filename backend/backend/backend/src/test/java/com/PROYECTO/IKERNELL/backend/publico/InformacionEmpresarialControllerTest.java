package com.PROYECTO.IKERNELL.backend.publico;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.publico.domain.ContenidoPublico;
import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;

/**
 * Pagina informativa publica: una prueba por condicion de aceptacion de HU-01
 * (consulta de la informacion publica) y HU-02 (formulario de consultas).
 *
 * <p>Ninguna prueba autentica a nadie, a proposito: todo esto debe funcionar
 * para un interesado anonimo.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class InformacionEmpresarialControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private ContenidoPublicoRepository contenidos;

	@Autowired
	private ConsultaPublicaRepository consultas;

	private MockMvc mockMvc;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	private ContenidoPublico publicar(TipoContenido tipo, String titulo, String cuerpo, String enlace) {
		ContenidoPublico contenido = new ContenidoPublico(tipo, titulo, cuerpo, enlace, null, 1);
		contenido.cambiarPublicacion(true);
		return contenidos.saveAndFlush(contenido);
	}

	private ContenidoPublico borrador(TipoContenido tipo, String titulo) {
		return contenidos.saveAndFlush(new ContenidoPublico(tipo, titulo, "cuerpo", null, null, 1));
	}

	// ----------------------------------------------------------------- HU-01

	@Test
	@DisplayName("HU-01 C01: sin sesion se accede a la pagina y se ven las seis secciones")
	void elAnonimoVeLasSeisSecciones() throws Exception {
		mockMvc.perform(get("/api/publico/informacion-empresarial"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.LINEAMIENTO").exists())
				.andExpect(jsonPath("$.PORTAFOLIO_SERVICIO").exists())
				.andExpect(jsonPath("$.NOTICIA").exists())
				.andExpect(jsonPath("$.PREGUNTA_FRECUENTE").exists())
				.andExpect(jsonPath("$.ENLACE_INTERES").exists())
				.andExpect(jsonPath("$.INFORMACION_CONTACTO").exists());
	}

	@Test
	@DisplayName("HU-01 C02: cada seccion muestra lo publicado por la empresa")
	void muestraElContenidoPublicado() throws Exception {
		publicar(TipoContenido.LINEAMIENTO, "Nuestros lineamientos", "Texto de los lineamientos", null);
		publicar(TipoContenido.NOTICIA, "Nueva version del framework", "Detalle de la noticia", null);

		mockMvc.perform(get("/api/publico/secciones/LINEAMIENTO"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Nuestros lineamientos"))
				.andExpect(jsonPath("$.contenido[0].cuerpo").value("Texto de los lineamientos"))
				.andExpect(jsonPath("$.mensaje").doesNotExist());

		mockMvc.perform(get("/api/publico/secciones/NOTICIA"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));
	}

	@Test
	@DisplayName("HU-01 C02: una seccion sin contenido publicado muestra un aviso, no una pantalla vacia")
	void avisaCuandoLaSeccionEstaVacia() throws Exception {
		mockMvc.perform(get("/api/publico/secciones/PORTAFOLIO_SERVICIO"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("La empresa aun no ha publicado su portafolio de servicios."));
	}

	@Test
	@DisplayName("HU-01 C02: los borradores sin publicar no se ven en la pagina publica")
	void noMuestraBorradores() throws Exception {
		borrador(TipoContenido.NOTICIA, "Noticia en borrador");

		mockMvc.perform(get("/api/publico/secciones/NOTICIA"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(content().string(org.hamcrest.Matchers.not(
						org.hamcrest.Matchers.containsString("Noticia en borrador"))));
	}

	@Test
	@DisplayName("HU-01 C03: cada pregunta frecuente se ve junto con su respuesta")
	void muestraPreguntasConSuRespuesta() throws Exception {
		publicar(TipoContenido.PREGUNTA_FRECUENTE, "Cuanto tarda un desarrollo",
				"Depende del alcance acordado.", null);

		mockMvc.perform(get("/api/publico/secciones/PREGUNTA_FRECUENTE"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[0].titulo").value("Cuanto tarda un desarrollo"))
				.andExpect(jsonPath("$.contenido[0].cuerpo").value("Depende del alcance acordado."));
	}

	@Test
	@DisplayName("RF-034: las preguntas frecuentes se pueden filtrar por un termino de busqueda")
	void buscaEnLasPreguntasFrecuentes() throws Exception {
		publicar(TipoContenido.PREGUNTA_FRECUENTE, "Cuanto cuesta un proyecto", "Respuesta", null);
		publicar(TipoContenido.PREGUNTA_FRECUENTE, "Donde estan ubicados", "Respuesta", null);

		mockMvc.perform(get("/api/publico/secciones/PREGUNTA_FRECUENTE").param("busqueda", "cuesta"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Cuanto cuesta un proyecto"));

		mockMvc.perform(get("/api/publico/secciones/PREGUNTA_FRECUENTE").param("busqueda", "inexistente"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("No hay resultados para la busqueda indicada."));
	}

	@Test
	@DisplayName("HU-01 C04: los enlaces de interes traen el destino y el contacto sus datos")
	void muestraEnlacesYContacto() throws Exception {
		publicar(TipoContenido.ENLACE_INTERES, "Sitio aliado", null, "https://ejemplo.com");
		publicar(TipoContenido.INFORMACION_CONTACTO, "Telefono", "601 000 0000", null);

		mockMvc.perform(get("/api/publico/secciones/ENLACE_INTERES"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[0].enlace").value("https://ejemplo.com"));

		mockMvc.perform(get("/api/publico/secciones/INFORMACION_CONTACTO"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[0].titulo").value("Telefono"))
				.andExpect(jsonPath("$.contenido[0].cuerpo").value("601 000 0000"));
	}

	@Test
	@DisplayName("HU-01 C05: el anonimo no entra a los servicios internos ni a la administracion")
	void elAnonimoNoEntraALoInterno() throws Exception {
		mockMvc.perform(get("/api/trabajadores")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/proyectos")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/mis-actividades")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/admin/contenido").param("tipo", "NOTICIA"))
				.andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/admin/consultas")).andExpect(status().isUnauthorized());
	}

	// ----------------------------------------------------------------- HU-02

	@Test
	@DisplayName("HU-02 C02: con los datos correctos la consulta se recibe y se confirma")
	void enviaLaConsulta() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"pregunta":"Desarrollan aplicaciones moviles?","nombreContacto":"Ana",
						 "correoContacto":"ana@ejemplo.com","telefonoContacto":"3000000000"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.mensaje").value("Su consulta fue enviada correctamente."));

		assertThat(consultas.findAllByOrderByRecibidaEnDesc()).hasSize(1);
	}

	@Test
	@DisplayName("HU-02 C03: sin la pregunta no se envia y se indica el campo faltante")
	void rechazaConsultaSinPregunta() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"pregunta\":\"\",\"nombreContacto\":\"Ana\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.pregunta").exists());

		assertThat(consultas.findAllByOrderByRecibidaEnDesc()).isEmpty();
	}

	@Test
	@DisplayName("HU-02 C04: un correo mal escrito se rechaza explicando que corregir")
	void rechazaCorreoConFormatoInvalido() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"pregunta":"Una pregunta valida","correoContacto":"correo-mal-escrito"}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.correoContacto")
						.value("El correo electronico no tiene un formato valido."));
	}

	@Test
	@DisplayName("HU-02 C05: la consulta enviada no aparece en ninguna parte visible para otros visitantes")
	void laConsultaNoEsVisibleParaOtrosVisitantes() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"pregunta\":\"Dato confidencial de mi consulta\"}"))
				.andExpect(status().isCreated());

		// Ni en la informacion empresarial completa...
		mockMvc.perform(get("/api/publico/informacion-empresarial"))
				.andExpect(content().string(org.hamcrest.Matchers.not(
						org.hamcrest.Matchers.containsString("Dato confidencial"))));

		// ...ni en la seccion de preguntas frecuentes.
		mockMvc.perform(get("/api/publico/secciones/PREGUNTA_FRECUENTE"))
				.andExpect(content().string(org.hamcrest.Matchers.not(
						org.hamcrest.Matchers.containsString("Dato confidencial"))));

		// Y la lectura de consultas no esta abierta al anonimo.
		mockMvc.perform(get("/api/admin/consultas")).andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("HU-02: los datos de contacto son opcionales mientras la empresa no los exija")
	void aceptaConsultaSoloConLaPregunta() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"pregunta\":\"Solo la pregunta, sin datos de contacto\"}"))
				.andExpect(status().isCreated());
	}

}

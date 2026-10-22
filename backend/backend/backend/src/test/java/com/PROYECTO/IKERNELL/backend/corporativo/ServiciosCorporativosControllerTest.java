package com.PROYECTO.IKERNELL.backend.corporativo;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.RecursoInterno;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Biblioteca de programas, tutoriales y acceso al correo: una prueba por
 * condicion de aceptacion de HU-21, mas las de HU-20 que corresponden al correo
 * (RF-029, RF-030, RF-031).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ServiciosCorporativosControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private RecursoInternoRepository recursos;

	private MockMvc mockMvc;
	private Authentication desarrollador;
	private Authentication coordinador;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9500000001", "dev.corp@ikernell.com", TipoTrabajador.DESARROLLADOR);
		this.coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9500000002", "coord.corp@ikernell.com", TipoTrabajador.COORDINADOR);
	}

	private RecursoInterno publicar(TipoRecurso tipo, String titulo, String categoria,
			String contenido, String enlace) {
		RecursoInterno recurso = new RecursoInterno(tipo, titulo, "Descripcion", categoria,
				tipo == TipoRecurso.PROGRAMA ? "1.0" : null, contenido, enlace, 1);
		recurso.cambiarPublicacion(true);
		return recursos.saveAndFlush(recurso);
	}

	// ----------------------------------------------------------------- HU-21

	@Test
	@DisplayName("HU-21 C01: el trabajador ve la lista de programas publicados para uso interno")
	void muestraLaBibliotecaDeProgramas() throws Exception {
		publicar(TipoRecurso.PROGRAMA, "Entorno de desarrollo", "HERRAMIENTAS", null,
				"https://interno.ikernell.com/ide");

		mockMvc.perform(get("/api/corporativo/programas").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Entorno de desarrollo"))
				.andExpect(jsonPath("$.contenido[0].version").value("1.0"))
				// El listado no arrastra el enlace; eso es del detalle (RNF-005).
				.andExpect(jsonPath("$.contenido[0].enlace").doesNotExist());
	}

	@Test
	@DisplayName("HU-21 C02: el detalle del programa trae su informacion y el enlace autorizado")
	void muestraElDetalleDelPrograma() throws Exception {
		RecursoInterno programa = publicar(TipoRecurso.PROGRAMA, "Gestor de versiones", "HERRAMIENTAS",
				null, "https://interno.ikernell.com/git");

		mockMvc.perform(get("/api/corporativo/programas/" + programa.getId())
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.titulo").value("Gestor de versiones"))
				.andExpect(jsonPath("$.enlace").value("https://interno.ikernell.com/git"));
	}

	@Test
	@DisplayName("HU-21 C03: la lista de tutoriales permite abrir cualquiera y ver su contenido")
	void muestraLosTutorialesYSuContenido() throws Exception {
		RecursoInterno tutorial = publicar(TipoRecurso.TUTORIAL, "Introduccion a Spring",
				"BACKEND", "Contenido completo del tutorial", null);

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));

		mockMvc.perform(get("/api/corporativo/tutoriales/" + tutorial.getId())
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido").value("Contenido completo del tutorial"));
	}

	@Test
	@DisplayName("HU-21 C04: sin contenido publicado muestra un aviso, no una pantalla vacia")
	void avisaCuandoNoHayContenidoPublicado() throws Exception {
		mockMvc.perform(get("/api/corporativo/programas").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("La biblioteca de programas aun no tiene contenido publicado."));

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.mensaje")
						.value("Aun no hay tutoriales de programacion publicados."));
	}

	@Test
	@DisplayName("HU-21 C05: la busqueda deja solo los recursos que coinciden")
	void buscaEnLosRecursos() throws Exception {
		publicar(TipoRecurso.TUTORIAL, "Introduccion a Spring Boot", "BACKEND", "Texto", null);
		publicar(TipoRecurso.TUTORIAL, "Fundamentos de SQL", "BASES_DE_DATOS", "Texto", null);

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador))
				.param("busqueda", "spring"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Introduccion a Spring Boot"));

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador))
				.param("busqueda", "inexistente"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("No hay resultados para la busqueda indicada."));
	}

	@Test
	@DisplayName("HU-21: los tres tipos de trabajador acceden a estos servicios")
	void losTresTiposDeTrabajadorAcceden() throws Exception {
		publicar(TipoRecurso.PROGRAMA, "Programa comun", null, null, "https://interno/x");
		Authentication lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9500000003", "lider.corp@ikernell.com", TipoTrabajador.LIDER);

		mockMvc.perform(get("/api/corporativo/programas").with(authentication(desarrollador)))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/corporativo/programas").with(authentication(lider)))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/corporativo/programas").with(authentication(coordinador)))
				.andExpect(status().isOk());
	}

	@Test
	@DisplayName("HU-01 C05: el interesado anonimo no entra a la biblioteca ni a los tutoriales")
	void elAnonimoNoEntraALosServiciosInternos() throws Exception {
		mockMvc.perform(get("/api/corporativo/programas")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/corporativo/tutoriales")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/corporativo/correo")).andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("Un borrador sin publicar no es visible ni descubrible por su identificador")
	void losBorradoresNoSonDescubribles() throws Exception {
		RecursoInterno borrador = recursos.saveAndFlush(new RecursoInterno(TipoRecurso.TUTORIAL,
				"Tutorial en borrador", "d", null, null, "Texto", null, 1));

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador)))
				.andExpect(jsonPath("$.total").value(0));

		mockMvc.perform(get("/api/corporativo/tutoriales/" + borrador.getId())
				.with(authentication(desarrollador)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.mensaje").value("El recurso solicitado no esta disponible."));
	}

	@Test
	@DisplayName("Un tutorial no se puede consultar como si fuera un programa")
	void noConfundeLosTiposDeRecurso() throws Exception {
		RecursoInterno tutorial = publicar(TipoRecurso.TUTORIAL, "Tutorial", null, "Texto", null);

		mockMvc.perform(get("/api/corporativo/programas/" + tutorial.getId())
				.with(authentication(desarrollador)))
				.andExpect(status().isNotFound());
	}

	// ----------------------------------------------- HU-20 (correo, RF-031)

	@Test
	@DisplayName("HU-20 C05: sin enlace configurado el correo avisa que no esta disponible")
	void elCorreoAvisaCuandoNoEstaConfigurado() throws Exception {
		mockMvc.perform(get("/api/corporativo/correo").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.disponible").value(false))
				.andExpect(jsonPath("$.mensaje")
						.value("No se puede acceder al correo corporativo por ahora."))
				.andExpect(jsonPath("$.url").doesNotExist());
	}

	// ------------------------------------------------- Administracion propuesta

	@Test
	@DisplayName("RF-029: un programa sin enlace al recurso se rechaza")
	void rechazaProgramaSinEnlace() throws Exception {
		mockMvc.perform(post("/api/admin/recursos").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"PROGRAMA\",\"titulo\":\"Programa sin enlace\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje")
						.value("Un programa de la biblioteca necesita el enlace al recurso autorizado."));
	}

	@Test
	@DisplayName("RF-030: un tutorial sin contenido ni enlace se rechaza")
	void rechazaTutorialVacio() throws Exception {
		mockMvc.perform(post("/api/admin/recursos").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"TUTORIAL\",\"titulo\":\"Tutorial vacio\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje")
						.value("Un tutorial necesita su contenido o un enlace donde consultarlo."));
	}

	@Test
	@DisplayName("El recurso nace sin publicar y aparece al publicarlo")
	void elRecursoNaceSinPublicar() throws Exception {
		String respuesta = mockMvc.perform(post("/api/admin/recursos")
				.with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipo":"TUTORIAL","titulo":"Guia de pruebas","contenido":"Texto","orden":1}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.publicada").value(false))
				.andReturn().getResponse().getContentAsString();
		Long id = Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador)))
				.andExpect(jsonPath("$.total").value(0));

		mockMvc.perform(post("/api/admin/recursos/" + id + "/publicacion")
				.with(csrf()).with(authentication(coordinador)).param("publicada", "true"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.publicada").value(true));

		mockMvc.perform(get("/api/corporativo/tutoriales").with(authentication(desarrollador)))
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Guia de pruebas"));
	}

	@Test
	@DisplayName("Despublicar retira el recurso sin borrarlo (RN-02)")
	void despublicarRetiraSinBorrar() throws Exception {
		RecursoInterno recurso = publicar(TipoRecurso.PROGRAMA, "Programa temporal", null, null,
				"https://interno/x");

		mockMvc.perform(post("/api/admin/recursos/" + recurso.getId() + "/publicacion")
				.with(csrf()).with(authentication(coordinador)).param("publicada", "false"))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/corporativo/programas").with(authentication(desarrollador)))
				.andExpect(jsonPath("$.total").value(0));
		mockMvc.perform(get("/api/admin/recursos").with(authentication(coordinador))
				.param("tipo", "PROGRAMA"))
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Programa temporal"));
	}

	@Test
	@DisplayName("El tipo del recurso no se puede cambiar al editar")
	void noPermiteCambiarElTipo() throws Exception {
		RecursoInterno recurso = publicar(TipoRecurso.TUTORIAL, "Tutorial", null, "Texto", null);

		mockMvc.perform(put("/api/admin/recursos/" + recurso.getId())
				.with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipo":"PROGRAMA","titulo":"Tutorial","enlace":"https://interno/x"}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("El tipo del recurso no se puede modificar."));
	}

	@Test
	@DisplayName("D-26: un desarrollador no administra la biblioteca ni los tutoriales")
	void soloElCoordinadorAdministra() throws Exception {
		mockMvc.perform(post("/api/admin/recursos").with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"TUTORIAL\",\"titulo\":\"No permitido\",\"contenido\":\"x\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/admin/recursos").with(authentication(desarrollador))
				.param("tipo", "TUTORIAL"))
				.andExpect(status().isForbidden());
	}

}

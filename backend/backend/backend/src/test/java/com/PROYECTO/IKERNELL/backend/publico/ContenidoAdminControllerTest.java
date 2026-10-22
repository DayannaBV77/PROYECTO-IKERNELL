package com.PROYECTO.IKERNELL.backend.publico;

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
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Administracion del contenido publico y de las consultas recibidas.
 *
 * <p>Todo lo que se verifica aqui corresponde a endpoints PROPUESTOS: ningun RF
 * los describe. Se prueban igual porque, sin ellos, el contenido de la pagina no
 * tendria forma de entrar al sistema y las consultas recibidas no serian
 * legibles.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ContenidoAdminControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	private MockMvc mockMvc;
	private Authentication coordinador;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000001", "coord.pub@ikernell.com", TipoTrabajador.COORDINADOR);
	}

	private Long crear(String cuerpoJson) throws Exception {
		String respuesta = mockMvc.perform(post("/api/admin/contenido")
				.with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoJson))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	@Test
	@DisplayName("El contenido nace sin publicar, para que nada aparezca por descuido")
	void elContenidoNaceSinPublicar() throws Exception {
		mockMvc.perform(post("/api/admin/contenido").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipo":"NOTICIA","titulo":"Primera noticia","cuerpo":"Contenido","orden":1}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.publicada").value(false));

		// Y por tanto no se ve en la pagina publica.
		mockMvc.perform(get("/api/publico/secciones/NOTICIA"))
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	@DisplayName("Al publicarlo, el contenido aparece en la pagina publica")
	void alPublicarloApareceEnLaPaginaPublica() throws Exception {
		Long id = crear("""
				{"tipo":"LINEAMIENTO","titulo":"Lineamientos 2026","cuerpo":"Texto","orden":1}
				""");

		mockMvc.perform(post("/api/admin/contenido/" + id + "/publicacion")
				.with(csrf()).with(authentication(coordinador)).param("publicada", "true"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.publicada").value(true));

		mockMvc.perform(get("/api/publico/secciones/LINEAMIENTO"))
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Lineamientos 2026"));
	}

	@Test
	@DisplayName("Despublicar retira el contenido de la pagina sin borrarlo (RN-02)")
	void despublicarRetiraSinBorrar() throws Exception {
		Long id = crear("""
				{"tipo":"NOTICIA","titulo":"Noticia temporal","cuerpo":"Texto","orden":1}
				""");
		mockMvc.perform(post("/api/admin/contenido/" + id + "/publicacion")
				.with(csrf()).with(authentication(coordinador)).param("publicada", "true"))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/admin/contenido/" + id + "/publicacion")
				.with(csrf()).with(authentication(coordinador)).param("publicada", "false"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.publicada").value(false));

		// Ya no se ve en publico...
		mockMvc.perform(get("/api/publico/secciones/NOTICIA"))
				.andExpect(jsonPath("$.total").value(0));
		// ...pero el registro se conserva.
		mockMvc.perform(get("/api/admin/contenido").with(authentication(coordinador))
				.param("tipo", "NOTICIA"))
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Noticia temporal"));
	}

	@Test
	@DisplayName("La vista de administracion si muestra los borradores")
	void laVistaDeAdministracionMuestraBorradores() throws Exception {
		crear("""
				{"tipo":"NOTICIA","titulo":"Borrador","cuerpo":"Texto","orden":1}
				""");

		mockMvc.perform(get("/api/admin/contenido").with(authentication(coordinador))
				.param("tipo", "NOTICIA"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].publicada").value(false));
	}

	@Test
	@DisplayName("Editar actualiza el contenido que ve el visitante")
	void editarActualizaLoQueSeVe() throws Exception {
		Long id = crear("""
				{"tipo":"INFORMACION_CONTACTO","titulo":"Telefono","cuerpo":"601 000 0000","orden":1}
				""");
		mockMvc.perform(post("/api/admin/contenido/" + id + "/publicacion")
				.with(csrf()).with(authentication(coordinador)).param("publicada", "true"))
				.andExpect(status().isOk());

		mockMvc.perform(put("/api/admin/contenido/" + id).with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipo":"INFORMACION_CONTACTO","titulo":"Telefono","cuerpo":"601 111 1111","orden":1}
						"""))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/publico/secciones/INFORMACION_CONTACTO"))
				.andExpect(jsonPath("$.contenido[0].cuerpo").value("601 111 1111"));
	}

	@Test
	@DisplayName("RF-036: un enlace de interes sin destino se rechaza")
	void rechazaEnlaceSinDestino() throws Exception {
		mockMvc.perform(post("/api/admin/contenido").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"ENLACE_INTERES\",\"titulo\":\"Sitio aliado\",\"orden\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje")
						.value("Un enlace de interes necesita la direccion del sitio al que dirige."));
	}

	@Test
	@DisplayName("RF-034: una pregunta frecuente sin respuesta se rechaza")
	void rechazaPreguntaSinRespuesta() throws Exception {
		mockMvc.perform(post("/api/admin/contenido").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"PREGUNTA_FRECUENTE\",\"titulo\":\"Una pregunta\",\"orden\":1}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("Una pregunta frecuente necesita su respuesta."));
	}

	@Test
	@DisplayName("El tipo de contenido no se puede cambiar al editar")
	void noPermiteCambiarElTipo() throws Exception {
		Long id = crear("""
				{"tipo":"NOTICIA","titulo":"Noticia","cuerpo":"Texto","orden":1}
				""");

		mockMvc.perform(put("/api/admin/contenido/" + id).with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipo":"LINEAMIENTO","titulo":"Noticia","cuerpo":"Texto","orden":1}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("El tipo de contenido no se puede modificar."));
	}

	@Test
	@DisplayName("HU-02 T2: las consultas recibidas se pueden leer y marcar como atendidas")
	void lasConsultasSeLeenYSeAtienden() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"pregunta\":\"Una consulta de un interesado\"}"))
				.andExpect(status().isCreated());

		String respuesta = mockMvc.perform(get("/api/admin/consultas").with(authentication(coordinador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].atendida").value(false))
				.andReturn().getResponse().getContentAsString();
		Long consultaId = Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));

		mockMvc.perform(post("/api/admin/consultas/" + consultaId + "/atencion")
				.with(csrf()).with(authentication(coordinador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.atendida").value(true))
				.andExpect(jsonPath("$.atendidaPorId").exists());

		// El filtro por pendientes ya no la incluye.
		mockMvc.perform(get("/api/admin/consultas").with(authentication(coordinador))
				.param("atendida", "false"))
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("No hay consultas recibidas."));
	}

	@Test
	@DisplayName("Una consulta ya atendida no se marca dos veces")
	void noMarcaDosVeces() throws Exception {
		mockMvc.perform(post("/api/publico/consultas").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"pregunta\":\"Otra consulta\"}"))
				.andExpect(status().isCreated());

		String respuesta = mockMvc.perform(get("/api/admin/consultas").with(authentication(coordinador)))
				.andReturn().getResponse().getContentAsString();
		Long consultaId = Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));

		mockMvc.perform(post("/api/admin/consultas/" + consultaId + "/atencion")
				.with(csrf()).with(authentication(coordinador)))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/admin/consultas/" + consultaId + "/atencion")
				.with(csrf()).with(authentication(coordinador)))
				.andExpect(status().isConflict());
	}

	@Test
	@DisplayName("D-26: un lider y un desarrollador no administran el contenido publico")
	void soloElCoordinadorAdministra() throws Exception {
		Authentication lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000002", "lider.pub@ikernell.com", TipoTrabajador.LIDER);
		Authentication dev = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000003", "dev.pub@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/admin/contenido").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"NOTICIA\",\"titulo\":\"No permitido\",\"cuerpo\":\"x\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/admin/consultas").with(authentication(dev)))
				.andExpect(status().isForbidden());
	}

}

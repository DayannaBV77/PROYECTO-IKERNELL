package com.PROYECTO.IKERNELL.backend.trabajadores;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Gestion de trabajadores: un metodo por condicion de aceptacion de HU-04
 * (registro con fotografia) y HU-05 (busqueda, modificacion e inhabilitacion).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TrabajadorControllerTest {

	private static final byte[] JPEG_VALIDO = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10 };

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	private MockMvc mockMvc;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	private String perfilCompleto(String identificacion, String tipo) {
		return """
				{
				  "identificacion": "%s",
				  "nombre": "Laura",
				  "apellido": "Moreno",
				  "fechaNacimiento": "1994-07-12",
				  "direccion": "Calle 45 # 12-30",
				  "profesion": "Ingenieria de sistemas",
				  "especialidadDesarrollo": "Backend",
				  "tipoTrabajador": "%s"
				}
				""".formatted(identificacion, tipo);
	}

	private Trabajador registrarDirecto(String identificacion, String nombre, String apellido,
			String profesion, TipoTrabajador tipo) {
		return trabajadores.saveAndFlush(new Trabajador(identificacion, nombre, apellido,
				LocalDate.of(1990, 1, 1), "Calle 1", profesion, "Backend", tipo));
	}

	// ----------------------------------------------------------------- HU-04

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-04 C01: con todos los datos obligatorios el perfil se guarda y se confirma")
	void registraElPerfilConDatosCompletos() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4000000001", "DESARROLLADOR")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.identificacion").value("4000000001"))
				.andExpect(jsonPath("$.estado").value("HABILITADO"))
				.andExpect(jsonPath("$.tieneFotografia").value(false));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-04 C02: con datos obligatorios vacios no guarda e indica que falta")
	void rechazaElPerfilConDatosFaltantes() throws Exception {
		String sinNombreNiDireccion = """
				{
				  "identificacion": "4000000002",
				  "nombre": "",
				  "apellido": "Moreno",
				  "fechaNacimiento": "1994-07-12",
				  "direccion": "",
				  "profesion": "Ingenieria de sistemas",
				  "especialidadDesarrollo": "Backend",
				  "tipoTrabajador": "DESARROLLADOR"
				}
				""";

		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(sinNombreNiDireccion))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.nombre").exists())
				.andExpect(jsonPath("$.campos.direccion").exists());

		// No se guardo nada.
		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("4000000002")).isFalse();
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-04 C03: identificacion ya registrada se rechaza con mensaje concreto (RN-01)")
	void rechazaIdentificacionDuplicada() throws Exception {
		registrarDirecto("4000000003", "Ana", "Perez", "Ingenieria", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4000000003", "DESARROLLADOR")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("La identificacion 4000000003 ya esta registrada."));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-04 C04: una fotografia con formato permitido queda vinculada al perfil")
	void adjuntaFotografiaValida() throws Exception {
		Trabajador trabajador = registrarDirecto("4000000004", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);
		MockMultipartFile foto = new MockMultipartFile("fotografia", "perfil.jpg", "image/jpeg", JPEG_VALIDO);

		mockMvc.perform(multipart("/api/trabajadores/" + trabajador.getId() + "/fotografia")
				.file(foto).with(csrf()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tieneFotografia").value(true));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-04 C05: formato no permitido se rechaza con el motivo y el perfil no se pierde")
	void rechazaFotografiaConFormatoNoPermitido() throws Exception {
		Trabajador trabajador = registrarDirecto("4000000005", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);
		MockMultipartFile archivo = new MockMultipartFile("fotografia", "notas.txt", "text/plain",
				"esto no es una imagen".getBytes());

		mockMvc.perform(multipart("/api/trabajadores/" + trabajador.getId() + "/fotografia")
				.file(archivo).with(csrf()))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").exists());

		// El perfil sigue completo y simplemente no tiene fotografia.
		mockMvc.perform(get("/api/trabajadores/" + trabajador.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.identificacion").value("4000000005"))
				.andExpect(jsonPath("$.tieneFotografia").value(false));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("RF-002: un archivo que declara ser imagen pero no lo es tambien se rechaza")
	void rechazaArchivoQueMienteSobreSuTipo() throws Exception {
		Trabajador trabajador = registrarDirecto("4000000006", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);
		MockMultipartFile falsa = new MockMultipartFile("fotografia", "falsa.jpg", "image/jpeg",
				"PK\u0003\u0004 contenido de otro formato".getBytes());

		mockMvc.perform(multipart("/api/trabajadores/" + trabajador.getId() + "/fotografia")
				.file(falsa).with(csrf()))
				.andExpect(status().isBadRequest());
	}

	// ----------------------------------------------------------------- HU-05

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-05 C01: la busqueda por varios criterios devuelve los coincidentes")
	void buscaPorVariosCriterios() throws Exception {
		registrarDirecto("4100000001", "Camila", "Rojas", "Ingenieria de sistemas", TipoTrabajador.DESARROLLADOR);
		registrarDirecto("4100000002", "Camilo", "Rojas", "Ingenieria de sistemas", TipoTrabajador.LIDER);

		mockMvc.perform(get("/api/trabajadores")
				.param("apellido", "rojas")
				.param("tipoTrabajador", "DESARROLLADOR"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(1))
				.andExpect(jsonPath("$.contenido[0].identificacion").value("4100000001"))
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-05 C02: sin coincidencias devuelve un aviso, no una lista vacia a secas")
	void avisaCuandoNoHayResultados() throws Exception {
		mockMvc.perform(get("/api/trabajadores").param("nombre", "nombre-que-no-existe"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("No hay trabajadores que coincidan con los criterios indicados."));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-05 C03: modificar los campos autorizados guarda y confirma")
	void modificaLosCamposAutorizados() throws Exception {
		Trabajador trabajador = registrarDirecto("4100000003", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(put("/api/trabajadores/" + trabajador.getId()).with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direccion":"Avenida 68 # 10-20","especialidadDesarrollo":"Frontend","tipoTrabajador":"LIDER"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.direccion").value("Avenida 68 # 10-20"))
				.andExpect(jsonPath("$.especialidadDesarrollo").value("Frontend"))
				.andExpect(jsonPath("$.tipoTrabajador").value("LIDER"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-05 C04: con un dato obligatorio vacio no guarda y el perfil conserva lo anterior")
	void rechazaModificacionConDatosFaltantes() throws Exception {
		Trabajador trabajador = registrarDirecto("4100000004", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(put("/api/trabajadores/" + trabajador.getId()).with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direccion":"","especialidadDesarrollo":"Frontend","tipoTrabajador":"LIDER"}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.direccion").exists());

		mockMvc.perform(get("/api/trabajadores/" + trabajador.getId()))
				.andExpect(jsonPath("$.direccion").value("Calle 1"))
				.andExpect(jsonPath("$.tipoTrabajador").value("DESARROLLADOR"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("C-03: la identificacion no es editable, la modificacion no la admite")
	void laIdentificacionNoEsEditable() throws Exception {
		Trabajador trabajador = registrarDirecto("4100000005", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);

		// Aunque el cliente la envie, el DTO no la expone y se ignora.
		mockMvc.perform(put("/api/trabajadores/" + trabajador.getId()).with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"identificacion":"9999999999","direccion":"Calle 2",
						 "especialidadDesarrollo":"Backend","tipoTrabajador":"DESARROLLADOR"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.identificacion").value("4100000005"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-05 C05: inhabilitar cambia el estado y conserva el historial (RN-02)")
	void inhabilitaConservandoElHistorial() throws Exception {
		Trabajador trabajador = registrarDirecto("4100000006", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/trabajadores/" + trabajador.getId() + "/inhabilitacion").with(csrf()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("INHABILITADO"))
				// El perfil sigue consultable: no se borro nada.
				.andExpect(jsonPath("$.identificacion").value("4100000006"))
				.andExpect(jsonPath("$.nombre").value("Ana"));
	}

	// ------------------------------------------------------------- RNF-001

	@Test
	@WithMockUser(roles = "DESARROLLADOR")
	@DisplayName("RNF-001: un trabajador que no es coordinador no puede registrar perfiles")
	void unDesarrolladorNoPuedeRegistrarPerfiles() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4200000001", "DESARROLLADOR")))
				.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "LIDER")
	@DisplayName("RNF-001: un lider no puede buscar ni inhabilitar trabajadores")
	void unLiderNoGestionaTrabajadores() throws Exception {
		Trabajador trabajador = registrarDirecto("4200000002", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/trabajadores")).andExpect(status().isForbidden());
		mockMvc.perform(post("/api/trabajadores/" + trabajador.getId() + "/inhabilitacion").with(csrf()))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no se accede a la gestion de trabajadores")
	void sinSesionNoHayGestionDeTrabajadores() throws Exception {
		mockMvc.perform(get("/api/trabajadores"))
				.andExpect(status().isUnauthorized());
	}

}

package com.PROYECTO.IKERNELL.backend.trabajadores;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.CategoriaHabilidad;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.HabilidadTrabajador;

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

	@Autowired
	private HabilidadTrabajadorRepository habilidades;

	private MockMvc mockMvc;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	private String perfilCompleto(String identificacion, String tipo) {
		return perfilCompleto(identificacion, tipo, "Calle 45 # 12-30");
	}

	private String perfilCompleto(String identificacion, String tipo, String direccion) {
		return """
				{
				  "identificacion": "%s",
				  "nombre": "Laura",
				  "apellido": "Moreno",
				  "fechaNacimiento": "1994-07-12",
				  "direccion": "%s",
				  "profesion": "Ingenieria de sistemas",
				  "especialidadDesarrollo": "Backend",
				  "tipoTrabajador": "%s"
				}
				""".formatted(identificacion, direccion, tipo);
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
	@DisplayName("Valida la identificacion duplicada antes de guardar")
	void validaDisponibilidadIdentificacionDuplicada() throws Exception {
		registrarDirecto("4000000033", "Ana", "Ramos", "Ingenieria de sistemas", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/trabajadores/validacion/identificacion").param("identificacion", "4000000033"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.disponible").value(false))
				.andExpect(jsonPath("$.mensaje").value("Este número de documento ya existe en el sistema"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Rechaza fechas de nacimiento posteriores al limite autorizado")
	void rechazaFechaNacimientoPosteriorAlLimite() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4000000034", "DESARROLLADOR")
						.replace("\"fechaNacimiento\": \"1994-07-12\"", "\"fechaNacimiento\": \"2008-01-01\"")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Registra y consulta habilidades de categorias independientes")
	void registraYConsultaHabilidades() throws Exception {
		String perfilConHabilidades = perfilCompleto("4000000017", "DESARROLLADOR")
				.replace("\"tipoTrabajador\": \"DESARROLLADOR\"",
						"\"tipoTrabajador\": \"DESARROLLADOR\", \"habilidades\": ["
								+ "{\"categoria\":\"AREA\",\"nombre\":\"Frontend\"},"
								+ "{\"categoria\":\"LENGUAJE\",\"nombre\":\"Java\"},"
								+ "{\"categoria\":\"FRAMEWORK\",\"nombre\":\"Django\"},"
								+ "{\"categoria\":\"BASE_DATOS\",\"nombre\":\"PostgreSQL\"}]");

		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilConHabilidades))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.habilidades.length()").value(4))
				.andExpect(jsonPath("$.especialidadDesarrollo").value("Backend"));

		Trabajador registrado = trabajadores.findByIdentificacion("4000000017").orElseThrow();
		mockMvc.perform(get("/api/trabajadores/" + registrado.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.habilidades[0].categoria").value("AREA"))
				.andExpect(jsonPath("$.habilidades[0].nombre").value("Frontend"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Acepta nomenclatura urbana colombiana con ciudad")
	void aceptaDireccionUrbanaConCiudad() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4000000014", "DESARROLLADOR", "Calle 45 # 12-30, Bogotá")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.direccion").value("Calle 45 # 12-30, Bogotá"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Acepta referencias rurales")
	void aceptaDireccionRural() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4000000015", "DESARROLLADOR", "Vereda San Isidro, Finca El Porvenir")))
				.andExpect(status().isCreated());
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Rechaza direcciones con caracteres y formato no admitidos")
	void rechazaDireccionConFormatoInvalido() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("4000000016", "DESARROLLADOR", "A@#")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.direccion").exists());

		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("4000000016")).isFalse();
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
	@DisplayName("HU-04 C02: la fecha de nacimiento vacia se senala en su campo, no como error inesperado")
	void rechazaLaFechaDeNacimientoVacia() throws Exception {
		// Es lo que manda el formulario cuando el <input type="date"> queda sin
		// llenar: la cadena vacia, no la ausencia del campo.
		String sinFecha = """
				{
				  "identificacion": "4000000012",
				  "nombre": "Laura",
				  "apellido": "Moreno",
				  "fechaNacimiento": "",
				  "direccion": "Calle 45 # 12-30",
				  "profesion": "Ingenieria de sistemas",
				  "especialidadDesarrollo": "Backend",
				  "tipoTrabajador": "DESARROLLADOR"
				}
				""";

		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(sinFecha))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.fechaNacimiento").exists());

		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("4000000012")).isFalse();
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("HU-04 C02: una fecha con formato dd/mm/aaaa se senala en su campo")
	void rechazaLaFechaConFormatoNoIso() throws Exception {
		String fechaInvalida = """
				{
				  "identificacion": "4000000013",
				  "nombre": "Laura",
				  "apellido": "Moreno",
				  "fechaNacimiento": "12/07/1994",
				  "direccion": "Calle 45 # 12-30",
				  "profesion": "Ingenieria de sistemas",
				  "especialidadDesarrollo": "Backend",
				  "tipoTrabajador": "DESARROLLADOR"
				}
				""";

		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(fechaInvalida))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.fechaNacimiento").exists());

		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("4000000013")).isFalse();
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
				.andExpect(jsonPath("$.mensaje").value("Este número de documento ya existe en el sistema"));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Rechaza identificaciones con caracteres que no son digitos")
	void rechazaIdentificacionConLetras() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("AB-123", "DESARROLLADOR")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.identificacion").value("La identificacion debe tener exactamente 10 digitos."));

		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("AB-123")).isFalse();
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Rechaza identificaciones de mas de diez digitos")
	void rechazaIdentificacionDeMasDeDiezDigitos() throws Exception {
		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilCompleto("12345678901", "DESARROLLADOR")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.identificacion").value("La identificacion debe tener exactamente 10 digitos."));

		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("12345678901")).isFalse();
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
	@DisplayName("HU-04 C04: la fotografia adjuntada se puede ver en el perfil")
	void devuelveLaFotografiaDelPerfil() throws Exception {
		Trabajador trabajador = registrarDirecto("4000000010", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);
		MockMultipartFile foto = new MockMultipartFile("fotografia", "perfil.jpg", "image/jpeg", JPEG_VALIDO);
		mockMvc.perform(multipart("/api/trabajadores/" + trabajador.getId() + "/fotografia")
				.file(foto).with(csrf()))
				.andExpect(status().isOk());

		// El criterio no se conforma con adjuntarla: pide que se pueda ver. Se
		// recupera con el tipo con que se valido y con el mismo contenido.
		mockMvc.perform(get("/api/trabajadores/" + trabajador.getId() + "/fotografia"))
				.andExpect(status().isOk())
				.andExpect(content().contentType(MediaType.IMAGE_JPEG))
				.andExpect(content().bytes(JPEG_VALIDO));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("RF-002: un perfil sin fotografia lo informa, en lugar de devolver una imagen vacia")
	void perfilSinFotografiaNoDevuelveImagen() throws Exception {
		Trabajador trabajador = registrarDirecto("4000000011", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/trabajadores/" + trabajador.getId() + "/fotografia"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.mensaje").value("El perfil no tiene una fotografia adjunta."));
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
	@DisplayName("Actualiza y retira selecciones sin modificar la especialidad historica")
	void actualizaYRetiraHabilidades() throws Exception {
		Trabajador trabajador = registrarDirecto("4100000017", "Ana", "Perez", "Ingenieria",
				TipoTrabajador.DESARROLLADOR);
		habilidades.saveAndFlush(new HabilidadTrabajador(
				trabajador, CategoriaHabilidad.AREA, "Backend"));

		mockMvc.perform(put("/api/trabajadores/" + trabajador.getId()).with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direccion":"Calle 2","especialidadDesarrollo":"Backend","tipoTrabajador":"DESARROLLADOR",
						 "habilidades":[{"categoria":"LENGUAJE","nombre":"TypeScript"}]}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.habilidades.length()").value(1))
				.andExpect(jsonPath("$.habilidades[0].nombre").value("TypeScript"))
				.andExpect(jsonPath("$.especialidadDesarrollo").value("Backend"));

		mockMvc.perform(put("/api/trabajadores/" + trabajador.getId()).with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"direccion":"Calle 2","especialidadDesarrollo":"Backend","tipoTrabajador":"DESARROLLADOR",
						 "habilidades":[]}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.habilidades.length()").value(0));
	}

	@Test
	@WithMockUser(roles = "COORDINADOR")
	@DisplayName("Rechaza habilidades que no pertenecen al catalogo autorizado")
	void rechazaHabilidadFueraDelCatalogo() throws Exception {
		String perfilConHabilidadInvalida = perfilCompleto("4000000018", "DESARROLLADOR")
				.replace("\"tipoTrabajador\": \"DESARROLLADOR\"",
						"\"tipoTrabajador\": \"DESARROLLADOR\", \"habilidades\": ["
								+ "{\"categoria\":\"LENGUAJE\",\"nombre\":\"Ruby\"}]");

		mockMvc.perform(post("/api/trabajadores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(perfilConHabilidadInvalida))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("La habilidad seleccionada no pertenece al catalogo disponible."));

		org.assertj.core.api.Assertions.assertThat(trabajadores.existsByIdentificacion("4000000018")).isFalse();
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

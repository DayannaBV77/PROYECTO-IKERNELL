package com.PROYECTO.IKERNELL.backend.proyectos;

import java.time.LocalDate;

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
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Gestion de proyectos: un metodo por condicion de aceptacion de HU-08
 * (registro), HU-09 (busqueda, modificacion, inhabilitacion) y HU-12 (estado).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProyectoControllerTest {

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
				"5000000001", "lider@ikernell.com", TipoTrabajador.LIDER);
	}

	private Long registrarProyecto(String nombre) throws Exception {
		String respuesta = mockMvc.perform(post("/api/proyectos").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"" + nombre + "\",\"descripcion\":\"Descripcion de prueba\"}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	// ----------------------------------------------------------------- HU-08

	@Test
	@DisplayName("HU-08 C01: con los datos obligatorios el proyecto se guarda y recibe identificador")
	void registraElProyectoConIdentificador() throws Exception {
		mockMvc.perform(post("/api/proyectos").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Portal de clientes\",\"descripcion\":\"Portal web\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.nombre").value("Portal de clientes"))
				// HU-08 C04: queda habilitado y disponible
				.andExpect(jsonPath("$.estadoHabilitacion").value("HABILITADO"));
	}

	@Test
	@DisplayName("El lider inicia la ejecucion y no puede volver a iniciarla")
	void registraInicioRealUnaSolaVez() throws Exception {
		Long id = registrarProyecto("Proyecto por iniciar");
		String hoy = LocalDate.now().toString();

		mockMvc.perform(post("/api/proyectos/" + id + "/inicio").with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estadoOperativo").value("EN_EJECUCION"))
				.andExpect(jsonPath("$.fechaInicioReal").value(hoy))
				.andExpect(jsonPath("$.fechaFinReal").doesNotExist());

		mockMvc.perform(post("/api/proyectos/" + id + "/inicio").with(csrf()).with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value(
						"El proyecto ya tiene un estado operativo y no se puede iniciar nuevamente."));
	}

	@Test
	@DisplayName("El lider finaliza un proyecto iniciado y quedan guardadas ambas fechas")
	void registraFinalizacionReal() throws Exception {
		Long id = registrarProyecto("Proyecto por finalizar");
		String hoy = LocalDate.now().toString();

		mockMvc.perform(post("/api/proyectos/" + id + "/inicio").with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/proyectos/" + id + "/finalizacion")
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estadoOperativo").value("FINALIZADO"))
				.andExpect(jsonPath("$.fechaInicioReal").value(hoy))
				.andExpect(jsonPath("$.fechaFinReal").value(hoy))
				.andExpect(jsonPath("$.excedeSeisAnios").value(false));
	}

	@Test
	@DisplayName("Permite finalizar despues de seis anos e informa que se excedio el limite")
	void permiteYAdvierteCuandoSuperaSeisAnios() throws Exception {
		Long id = registrarProyecto("Proyecto de larga duracion");
		Proyecto proyecto = proyectos.findById(id).orElseThrow();
		proyecto.iniciar(LocalDate.now().minusYears(6).minusDays(1));
		proyectos.saveAndFlush(proyecto);

		mockMvc.perform(post("/api/proyectos/" + id + "/finalizacion")
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estadoOperativo").value("FINALIZADO"))
				.andExpect(jsonPath("$.excedeSeisAnios").value(true));
	}

	@Test
	@DisplayName("No se puede finalizar un proyecto que no esta en ejecucion")
	void rechazaFinalizacionAntesDelInicio() throws Exception {
		Long id = registrarProyecto("Proyecto aun no iniciado");

		mockMvc.perform(post("/api/proyectos/" + id + "/finalizacion")
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("Solo se puede finalizar un proyecto en ejecucion."));
	}

	@Test
	@DisplayName("La duracion exacta de seis anos no excede el limite y un dia mas si")
	void calculaExcesoDeSeisAnios() {
		Proyecto enLimite = new Proyecto("En el limite", null, null);
		enLimite.iniciar(LocalDate.of(2020, 3, 1));
		enLimite.finalizar(LocalDate.of(2026, 3, 1));
		org.assertj.core.api.Assertions.assertThat(enLimite.excedeSeisAnios()).isFalse();

		Proyecto sobreLimite = new Proyecto("Sobre el limite", null, null);
		sobreLimite.iniciar(LocalDate.of(2020, 3, 1));
		sobreLimite.finalizar(LocalDate.of(2026, 3, 2));
		org.assertj.core.api.Assertions.assertThat(sobreLimite.excedeSeisAnios()).isTrue();
	}

	@Test
	@DisplayName("HU-08 C02: sin nombre no guarda e indica el dato faltante")
	void rechazaProyectoSinNombre() throws Exception {
		mockMvc.perform(post("/api/proyectos").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"\",\"descripcion\":\"Sin nombre\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.nombre").exists());
	}

	@Test
	@DisplayName("HU-08 C03: cada proyecto recibe su propio identificador y ninguno se repite")
	void losIdentificadoresNoSeRepiten() throws Exception {
		Long primero = registrarProyecto("Proyecto uno");
		Long segundo = registrarProyecto("Proyecto dos");

		org.assertj.core.api.Assertions.assertThat(primero).isNotEqualTo(segundo);
	}

	@Test
	@DisplayName("HU-08: el lider que registra queda guardado como responsable (dato para A-02)")
	void guardaElLiderResponsable() throws Exception {
		Long id = registrarProyecto("Proyecto con lider");

		Proyecto proyecto = proyectos.findById(id).orElseThrow();
		org.assertj.core.api.Assertions.assertThat(proyecto.getLiderResponsable()).isNotNull();
		org.assertj.core.api.Assertions.assertThat(proyecto.getLiderResponsable().getIdentificacion())
				.isEqualTo("5000000001");
	}

	@Test
	@DisplayName("HU-08 C05: un desarrollador no puede registrar proyectos")
	void unDesarrolladorNoRegistraProyectos() throws Exception {
		Authentication desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"5000000002", "dev@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/proyectos").with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"No permitido\",\"descripcion\":\"\"}"))
				.andExpect(status().isForbidden());
	}

	// ----------------------------------------------------------------- HU-09

	@Test
	@DisplayName("HU-09 C01: busca por nombre y abre el detalle del resultado")
	void buscaPorNombreYAbreDetalle() throws Exception {
		Long id = registrarProyecto("Sistema de nomina");

		mockMvc.perform(get("/api/proyectos").with(authentication(lider)).param("nombre", "nomina"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(1))
				.andExpect(jsonPath("$.contenido[0].id").value(id));

		mockMvc.perform(get("/api/proyectos/" + id).with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nombre").value("Sistema de nomina"));
	}

	@Test
	@DisplayName("HU-09 C01: tambien busca por identificador y por estado")
	void buscaPorIdentificadorYEstado() throws Exception {
		Long id = registrarProyecto("Proyecto buscable");

		mockMvc.perform(get("/api/proyectos").with(authentication(lider))
				.param("identificador", String.valueOf(id))
				.param("estado", "HABILITADO"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(1));
	}

	@Test
	@DisplayName("HU-09 C02: sin coincidencias devuelve aviso, no una lista vacia")
	void avisaCuandoNoHayProyectos() throws Exception {
		mockMvc.perform(get("/api/proyectos").with(authentication(lider)).param("nombre", "no-existe"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("No hay proyectos que coincidan con los criterios indicados."));
	}

	@Test
	@DisplayName("HU-09 C03: modificar guarda los cambios y conserva las etapas asociadas")
	void modificaConservandoLasEtapas() throws Exception {
		Long id = registrarProyecto("Proyecto original");
		mockMvc.perform(post("/api/proyectos/" + id + "/etapas").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Analisis\",\"descripcion\":\"Levantamiento\",\"orden\":1}"))
				.andExpect(status().isCreated());

		mockMvc.perform(put("/api/proyectos/" + id).with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Proyecto renombrado\",\"descripcion\":\"Nueva descripcion\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nombre").value("Proyecto renombrado"));

		// La etapa sigue asociada al proyecto.
		mockMvc.perform(get("/api/proyectos/" + id + "/etapas").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].nombre").value("Analisis"));
	}

	@Test
	@DisplayName("HU-09 C04: sin nombre no guarda y el proyecto conserva lo anterior")
	void rechazaModificacionSinNombre() throws Exception {
		Long id = registrarProyecto("Proyecto intacto");

		mockMvc.perform(put("/api/proyectos/" + id).with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"\",\"descripcion\":\"x\"}"))
				.andExpect(status().isBadRequest());

		mockMvc.perform(get("/api/proyectos/" + id).with(authentication(lider)))
				.andExpect(jsonPath("$.nombre").value("Proyecto intacto"));
	}

	@Test
	@DisplayName("HU-09 C05: inhabilitar conserva los registros historicos")
	void inhabilitaConservandoRegistros() throws Exception {
		Long id = registrarProyecto("Proyecto a cerrar");

		mockMvc.perform(post("/api/proyectos/" + id + "/inhabilitacion").with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estadoHabilitacion").value("INHABILITADO"))
				.andExpect(jsonPath("$.nombre").value("Proyecto a cerrar"));
	}

	@Test
	@DisplayName("HU-09 C05: hoy no hay reglas de advertencia definidas, la lista llega vacia")
	void sinReglasDeAdvertenciaLaListaEstaVacia() throws Exception {
		Long id = registrarProyecto("Proyecto sin advertencias");

		mockMvc.perform(get("/api/proyectos/" + id + "/inhabilitacion/advertencias").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	@DisplayName("RF-015: inhabilitar dos veces se rechaza con un mensaje claro")
	void noSeInhabilitaDosVeces() throws Exception {
		Long id = registrarProyecto("Proyecto ya cerrado");
		mockMvc.perform(post("/api/proyectos/" + id + "/inhabilitacion").with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/proyectos/" + id + "/inhabilitacion").with(csrf()).with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("El proyecto ya se encuentra inhabilitado."));
	}

	// ----------------------------------------------------------------- HU-12

	@Test
	@DisplayName("HU-12 C02: sin etapas ni actividades avisa que aun no hay datos de avance")
	void avisaCuandoNoHayDatosDeAvance() throws Exception {
		Long id = registrarProyecto("Proyecto recien creado");

		mockMvc.perform(get("/api/proyectos/" + id + "/estado").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estadoHabilitacion").value("HABILITADO"))
				.andExpect(jsonPath("$.datosDisponibles.etapasRegistradas").value(0))
				.andExpect(jsonPath("$.datosDisponibles.actividadesRegistradas").value(0))
				.andExpect(jsonPath("$.mensajeAvance")
						.value("El proyecto aun no tiene datos de avance registrados."))
				// La respuesta explica por que no hay porcentaje (C-04, D-03).
				.andExpect(jsonPath("$.datosPendientes.length()").value(3));
	}

	@Test
	@DisplayName("HU-12 C04: tras registrar una etapa el estado muestra los datos actualizados")
	void elEstadoRefleJaLosCambios() throws Exception {
		Long id = registrarProyecto("Proyecto en marcha");

		mockMvc.perform(post("/api/proyectos/" + id + "/etapas").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Diseno\",\"descripcion\":\"\",\"orden\":1}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/proyectos/" + id + "/estado").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.datosDisponibles.etapasRegistradas").value(1))
				.andExpect(jsonPath("$.mensajeAvance").doesNotExist());
	}

	@Test
	@DisplayName("HU-12 C03: un proyecto inhabilitado se consulta y conserva su informacion")
	void elProyectoInhabilitadoSeConsultaIgual() throws Exception {
		Long id = registrarProyecto("Proyecto historico");
		mockMvc.perform(post("/api/proyectos/" + id + "/inhabilitacion").with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/proyectos/" + id + "/estado").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estadoHabilitacion").value("INHABILITADO"))
				.andExpect(jsonPath("$.nombre").value("Proyecto historico"));
	}

	@Test
	@DisplayName("HU-12 C05: un desarrollador no puede consultar el estado de un proyecto")
	void unDesarrolladorNoConsultaElEstado() throws Exception {
		Long id = registrarProyecto("Proyecto reservado");
		Authentication desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"5000000003", "dev2@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/proyectos/" + id + "/estado").with(authentication(desarrollador)))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("RF-013: un proyecto inexistente devuelve 404 con mensaje claro")
	void proyectoInexistenteDevuelve404() throws Exception {
		mockMvc.perform(get("/api/proyectos/999999").with(authentication(lider)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.mensaje").value("No existe un proyecto con el id 999999."));
	}

}

package com.PROYECTO.IKERNELL.backend.actividades;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.EtapaRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Registro, busqueda y modificacion de actividades: una prueba por condicion de
 * aceptacion de HU-13 (RF-019, RF-020, RF-021).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ActividadControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private ProyectoRepository proyectos;

	@Autowired
	private EtapaRepository etapas;

	@Autowired
	private ServicioAsignaciones servicioAsignaciones;

	private MockMvc mockMvc;
	private Authentication lider;
	private Trabajador liderTrabajador;
	private Proyecto proyecto;
	private Etapa etapa;
	private Trabajador desarrollador;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9000000001", "lider.act@ikernell.com", TipoTrabajador.LIDER);
		this.liderTrabajador = trabajadores.findByIdentificacion("9000000001").orElseThrow();
		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto con actividades", "d", liderTrabajador));
		this.etapa = etapas.saveAndFlush(new Etapa(proyecto, "Desarrollo", "Codificacion", 1));
		this.desarrollador = nuevoTrabajador("9000000002");
		asignarAlProyecto(desarrollador);
	}

	private Trabajador nuevoTrabajador(String identificacion) {
		return trabajadores.saveAndFlush(new Trabajador(identificacion, "Dev", identificacion,
				LocalDate.of(1992, 6, 6), "Calle 6", "Ingenieria", "Backend", TipoTrabajador.DESARROLLADOR));
	}

	private void asignarAlProyecto(Trabajador trabajador) {
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(trabajador.getId(), proyecto.getId(), RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);
	}

	private String cuerpoRegistro(Long etapaId, Long desarrolladorId, String descripcion) {
		return "{\"etapaId\":%d,\"desarrolladorId\":%d,\"descripcion\":\"%s\"}"
				.formatted(etapaId, desarrolladorId, descripcion);
	}

	private Long registrarActividad(String descripcion) throws Exception {
		String respuesta = mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), desarrollador.getId(), descripcion)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	@Test
	@DisplayName("HU-13 C01: la actividad queda asociada al proyecto y al desarrollador")
	void registraLaActividadAsociada() throws Exception {
		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), desarrollador.getId(), "Implementar el login")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.proyectoId").value(proyecto.getId()))
				.andExpect(jsonPath("$.etapaId").value(etapa.getId()))
				.andExpect(jsonPath("$.desarrolladorId").value(desarrollador.getId()))
				.andExpect(jsonPath("$.descripcion").value("Implementar el login"));
	}

	@Test
	@DisplayName("HU-13 C02: sin descripcion no guarda e indica el dato faltante")
	void rechazaActividadSinDescripcion() throws Exception {
		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), desarrollador.getId(), "")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.descripcion").exists());
	}

	@Test
	@DisplayName("HU-13 C03: busca por proyecto, etapa, desarrollador e identificador")
	void buscaPorLosCuatroCriterios() throws Exception {
		Long id = registrarActividad("Actividad buscable");

		mockMvc.perform(get("/api/actividades").with(authentication(lider))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(1));

		mockMvc.perform(get("/api/actividades").with(authentication(lider))
				.param("etapaId", String.valueOf(etapa.getId()))
				.param("desarrolladorId", String.valueOf(desarrollador.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(1));

		mockMvc.perform(get("/api/actividades").with(authentication(lider))
				.param("identificador", String.valueOf(id)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[0].id").value(id));
	}

	@Test
	@DisplayName("HU-13 C04: sin coincidencias devuelve aviso, no una lista vacia")
	void avisaCuandoNoHayActividades() throws Exception {
		mockMvc.perform(get("/api/actividades").with(authentication(lider))
				.param("identificador", "999999"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElementos").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("No hay actividades que coincidan con los criterios indicados."));
	}

	@Test
	@DisplayName("HU-13 C05: al modificar sigue asociada al mismo proyecto y desarrollador")
	void modificaConservandoProyectoYDesarrollador() throws Exception {
		Long id = registrarActividad("Descripcion original");
		Etapa otraEtapa = etapas.saveAndFlush(new Etapa(proyecto, "Pruebas", "QA", 2));

		mockMvc.perform(put("/api/actividades/" + id).with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"etapaId\":%d,\"descripcion\":\"Descripcion ajustada\"}"
						.formatted(otraEtapa.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.descripcion").value("Descripcion ajustada"))
				.andExpect(jsonPath("$.etapaId").value(otraEtapa.getId()))
				// Lo que el criterio garantiza: proyecto y desarrollador intactos.
				.andExpect(jsonPath("$.proyectoId").value(proyecto.getId()))
				.andExpect(jsonPath("$.desarrolladorId").value(desarrollador.getId()));
	}

	@Test
	@DisplayName("RF-021: no se puede mover la actividad a una etapa de otro proyecto")
	void noMueveLaActividadAOtroProyecto() throws Exception {
		Long id = registrarActividad("Actividad propia");
		Proyecto otroProyecto = proyectos.saveAndFlush(new Proyecto("Otro proyecto", "d", null));
		Etapa etapaAjena = etapas.saveAndFlush(new Etapa(otroProyecto, "Analisis", "d", 1));

		mockMvc.perform(put("/api/actividades/" + id).with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"etapaId\":%d,\"descripcion\":\"x\"}".formatted(etapaAjena.getId())))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("RF-019: la etapa debe pertenecer al proyecto indicado")
	void rechazaEtapaDeOtroProyecto() throws Exception {
		Proyecto otroProyecto = proyectos.saveAndFlush(new Proyecto("Proyecto ajeno", "d", null));
		Etapa etapaAjena = etapas.saveAndFlush(new Etapa(otroProyecto, "Analisis", "d", 1));

		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapaAjena.getId(), desarrollador.getId(), "Actividad")))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("RF-019 y RN-03: no se asigna trabajo a un desarrollador inhabilitado")
	void rechazaDesarrolladorInhabilitado() throws Exception {
		Trabajador inhabilitado = nuevoTrabajador("9000000003");
		asignarAlProyecto(inhabilitado);
		inhabilitado.inhabilitar();
		trabajadores.saveAndFlush(inhabilitado);

		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), inhabilitado.getId(), "Actividad")))
				.andExpect(status().isConflict());
	}

	@Test
	@DisplayName("D-24: si el desarrollador no esta asignado al proyecto, advierte y permite confirmar")
	void advierteSiElDesarrolladorNoEstaAsignado() throws Exception {
		Trabajador ajeno = nuevoTrabajador("9000000004");

		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), ajeno.getId(), "Actividad")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.advertencias.length()").value(1));

		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(lider)).param("confirmado", "true")
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), ajeno.getId(), "Actividad")))
				.andExpect(status().isCreated());
	}

	@Test
	@DisplayName("RN-08 con datos reales: una etapa con actividades ya no se puede eliminar")
	void laEtapaConActividadesNoSeElimina() throws Exception {
		registrarActividad("Actividad que bloquea el borrado");

		mockMvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/etapas/" + etapa.getId())
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value(
						org.hamcrest.Matchers.containsString("1 actividad(es) asociada(s)")));

		// La informacion historica del proyecto se conserva.
		assertThat(etapas.findById(etapa.getId())).isPresent();
	}

	@Test
	@DisplayName("RF-016: las actividades registradas aparecen en la consulta de estado del proyecto")
	void lasActividadesCuentanEnElEstadoDelProyecto() throws Exception {
		registrarActividad("Actividad uno");
		registrarActividad("Actividad dos");

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/estado").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.datosDisponibles.etapasRegistradas").value(1))
				.andExpect(jsonPath("$.datosDisponibles.actividadesRegistradas").value(2))
				.andExpect(jsonPath("$.mensajeAvance").doesNotExist());
	}

	@Test
	@DisplayName("RNF-001: un desarrollador no puede registrar actividades (RN-07)")
	void unDesarrolladorNoRegistraActividades() throws Exception {
		Authentication dev = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9000000005", "dev.act@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/actividades/proyecto/" + proyecto.getId())
				.with(csrf()).with(authentication(dev))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoRegistro(etapa.getId(), desarrollador.getId(), "Actividad")))
				.andExpect(status().isForbidden());
	}

}

package com.PROYECTO.IKERNELL.backend.asignaciones;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.hibernate.Hibernate;

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

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Asignacion;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.EntityManager;

/**
 * Asignacion de desarrolladores por el lider: una prueba por condicion de
 * aceptacion de HU-10 (RF-009).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EquipoProyectoControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private ProyectoRepository proyectos;

	@Autowired
	private ServicioAsignaciones servicioAsignaciones;

	@Autowired
	private EntityManager entityManager;

	private MockMvc mockMvc;
	private Authentication lider;
	private Proyecto proyecto;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"8000000001", "lider.equipo@ikernell.com", TipoTrabajador.LIDER);
		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto con equipo", "d", null));
	}

	private Trabajador nuevoTrabajador(String identificacion, TipoTrabajador tipo) {
		return trabajadores.saveAndFlush(new Trabajador(identificacion, "Dev", identificacion,
				LocalDate.of(1993, 4, 4), "Calle 3", "Ingenieria", "Backend", tipo));
	}

	private String cuerpo(Long... ids) {
		StringBuilder sb = new StringBuilder("{\"desarrolladorIds\":[");
		for (int i = 0; i < ids.length; i++) {
			if (i > 0) {
				sb.append(',');
			}
			sb.append(ids[i]);
		}
		return sb.append("]}").toString();
	}

	@Test
	@DisplayName("HU-10 C01: varios desarrolladores habilitados quedan asignados")
	void asignaVariosDesarrolladores() throws Exception {
		Trabajador uno = nuevoTrabajador("8000000002", TipoTrabajador.DESARROLLADOR);
		Trabajador dos = nuevoTrabajador("8000000003", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId(), dos.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.asignados.length()").value(2))
				.andExpect(jsonPath("$.rechazados.length()").value(0));
	}

	@Test
	@DisplayName("HU-10 C02: proyecto inhabilitado, no registra ninguna asignacion")
	void rechazaTodoElLoteSiElProyectoEstaInhabilitado() throws Exception {
		Trabajador uno = nuevoTrabajador("8000000004", TipoTrabajador.DESARROLLADOR);
		proyecto.inhabilitar();
		proyectos.saveAndFlush(proyecto);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId())))
				.andExpect(status().isConflict());

		assertThat(servicioAsignaciones.equipoDeProyecto(proyecto.getId())).isEmpty();
	}

	@Test
	@DisplayName("HU-10 C03: al desarrollador inhabilitado no se le asigna, los demas si")
	void noAsignaAlInhabilitadoPeroSiAlResto() throws Exception {
		Trabajador habilitado = nuevoTrabajador("8000000005", TipoTrabajador.DESARROLLADOR);
		Trabajador inhabilitado = nuevoTrabajador("8000000006", TipoTrabajador.DESARROLLADOR);
		inhabilitado.inhabilitar();
		trabajadores.saveAndFlush(inhabilitado);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(habilitado.getId(), inhabilitado.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.asignados.length()").value(1))
				.andExpect(jsonPath("$.asignados[0].trabajadorId").value(habilitado.getId()))
				.andExpect(jsonPath("$.rechazados.length()").value(1))
				.andExpect(jsonPath("$.rechazados[0].desarrolladorId").value(inhabilitado.getId()))
				.andExpect(jsonPath("$.rechazados[0].motivo").value(
						"El trabajador esta inhabilitado porque ya no pertenece a la empresa."));
	}

	@Test
	@DisplayName("HU-10 C04 y RN-05: un lider de otro proyecto se asigna como desarrollador y sigue siendo lider")
	void unLiderPuedeSerDesarrolladorEnOtroProyecto() throws Exception {
		// Este trabajador es LIDER por tipo global y lidera su propio proyecto.
		Trabajador otroLider = nuevoTrabajador("8000000007", TipoTrabajador.LIDER);
		Proyecto proyectoPropio = proyectos.saveAndFlush(new Proyecto("Proyecto del otro lider", "d", otroLider));
		servicioAsignaciones.asignarTrabajador(
				new com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest(
						otroLider.getId(), proyectoPropio.getId(), RolEnProyecto.LIDER),
				otroLider, false);

		// Y ahora se le asigna como DESARROLLADOR en este otro proyecto.
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(otroLider.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.asignados.length()").value(1))
				.andExpect(jsonPath("$.asignados[0].rolEnProyecto").value("DESARROLLADOR"));

		// Sigue siendo lider en el proyecto que ya tenia a cargo.
		assertThat(servicioAsignaciones.puedeActuarComo(
				otroLider.getId(), proyectoPropio.getId(), RolEnProyecto.LIDER)).isTrue();
		// Y ademas puede actuar como desarrollador en el nuevo.
		assertThat(servicioAsignaciones.puedeActuarComo(
				otroLider.getId(), proyecto.getId(), RolEnProyecto.DESARROLLADOR)).isTrue();
		// El tipo global no cambio.
		assertThat(trabajadores.findById(otroLider.getId()).orElseThrow().getTipoTrabajador())
				.isEqualTo(TipoTrabajador.LIDER);
	}

	@Test
	@DisplayName("HU-10 C05: el equipo asignado se puede consultar")
	void consultaElEquipoDelProyecto() throws Exception {
		Trabajador uno = nuevoTrabajador("8000000008", TipoTrabajador.DESARROLLADOR);
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId())))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/equipo").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].trabajadorIdentificacion").value("8000000008"));
	}

	@Test
	@DisplayName("RF-009: un desarrollador ya asignado se informa como rechazado, sin duplicar")
	void noDuplicaUnaAsignacionExistente() throws Exception {
		Trabajador uno = nuevoTrabajador("8000000009", TipoTrabajador.DESARROLLADOR);
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId())))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.asignados.length()").value(0))
				.andExpect(jsonPath("$.rechazados[0].motivo").value(
						"Ya tiene una asignacion activa como desarrollador en este proyecto."));

		assertThat(servicioAsignaciones.equipoDeProyecto(proyecto.getId())).hasSize(1);
	}

	@Test
	@DisplayName("RF-009: la lista de desarrolladores no puede venir vacia")
	void rechazaListaVacia() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"desarrolladorIds\":[]}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.desarrolladorIds").exists());
	}

	@Test
	@DisplayName("HU-10 C01: se ofrecen como candidatos los desarrolladores habilitados")
	void ofreceLosDesarrolladoresHabilitadosComoCandidatos() throws Exception {
		Trabajador habilitado = nuevoTrabajador("8000000020", TipoTrabajador.DESARROLLADOR);
		Trabajador inhabilitado = nuevoTrabajador("8000000021", TipoTrabajador.DESARROLLADOR);
		inhabilitado.inhabilitar();
		trabajadores.saveAndFlush(inhabilitado);
		// Un lider no es candidato por su tipo global, aunque RN-05 le permita
		// trabajar como desarrollador si se le asigna expresamente.
		nuevoTrabajador("8000000022", TipoTrabajador.LIDER);

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/equipo/candidatos")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[?(@.id == " + habilitado.getId() + ")]").exists())
				.andExpect(jsonPath("$.contenido[?(@.id == " + inhabilitado.getId() + ")]").doesNotExist())
				.andExpect(jsonPath("$.contenido[?(@.tipoTrabajador == 'LIDER')]").doesNotExist());
	}

	@Test
	@DisplayName("HU-10 C01: el desarrollador ya asignado deja de ofrecerse como candidato")
	void dejaDeOfrecerAlQueYaEstaEnElEquipo() throws Exception {
		Trabajador uno = nuevoTrabajador("8000000023", TipoTrabajador.DESARROLLADOR);
		String candidatos = "/api/proyectos/" + proyecto.getId() + "/equipo/candidatos";

		mockMvc.perform(get(candidatos).with(authentication(lider)))
				.andExpect(jsonPath("$.contenido[?(@.id == " + uno.getId() + ")]").exists());

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId())))
				.andExpect(status().isOk());

		// Asignarlo otra vez seria rechazado, asi que tampoco se ofrece.
		mockMvc.perform(get(candidatos).with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[?(@.id == " + uno.getId() + ")]").doesNotExist());
	}

	@Test
	@DisplayName("RN-14: sin desarrolladores disponibles se avisa, en lugar de una lista vacia")
	void avisaCuandoNoHayCandidatos() throws Exception {
		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/equipo/candidatos")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value(
						"No hay desarrolladores habilitados disponibles para asignar a este proyecto."));
	}

	@Test
	@DisplayName("RNF-001: la lista de candidatos no abre el registro de trabajadores a otros roles")
	void soloElLiderConsultaLosCandidatos() throws Exception {
		Authentication coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"8000000024", "coord.equipo@ikernell.com", TipoTrabajador.COORDINADOR);

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/equipo/candidatos")
				.with(authentication(coordinador)))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("open-in-view=false: el equipo llega con sus relaciones cargadas, no como proxies")
	void elEquipoLlegaConSusRelacionesCargadas() throws Exception {
		Trabajador uno = nuevoTrabajador("8000000025", TipoTrabajador.DESARROLLADOR);
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(uno.getId())))
				.andExpect(status().isOk());

		// Se vacia el contexto de persistencia: sin esto, las entidades que la
		// prueba ya cargo resolverian las relaciones desde la cache de primer
		// nivel y la comprobacion no probaria nada.
		entityManager.flush();
		entityManager.clear();

		List<Asignacion> equipo = servicioAsignaciones.equipoDeProyecto(proyecto.getId());

		// El controlador mapea a AsignacionResponse FUERA de la transaccion,
		// porque open-in-view esta desactivado. Si las relaciones llegan como
		// proxies sin inicializar, ese mapeo lanza LazyInitializationException y
		// el endpoint responde 500. Una prueba @Transactional que solo mire el
		// JSON no lo detecta: su transaccion mantiene la sesion abierta y el
		// proxy se resuelve igualmente. Por eso se comprueba la carga, y no el
		// cuerpo de la respuesta.
		assertThat(equipo).isNotEmpty();
		assertThat(Hibernate.isInitialized(equipo.get(0).getTrabajador())).isTrue();
		assertThat(Hibernate.isInitialized(equipo.get(0).getProyecto())).isTrue();
	}

	@Test
	@DisplayName("RNF-001: un desarrollador no puede asignar el equipo de un proyecto")
	void unDesarrolladorNoAsignaEquipo() throws Exception {
		Authentication dev = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"8000000010", "dev.equipo@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/equipo")
				.with(csrf()).with(authentication(dev))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(1L)))
				.andExpect(status().isForbidden());
	}

}

package com.PROYECTO.IKERNELL.backend.asignaciones;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Asignacion de un trabajador a un proyecto por el coordinador: una prueba por
 * condicion de aceptacion de HU-06 (RF-003).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AsignacionControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private ProyectoRepository proyectos;

	private MockMvc mockMvc;
	private Authentication coordinador;
	private Trabajador desarrollador;
	private Proyecto proyecto;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"7000000001", "coord@ikernell.com", TipoTrabajador.COORDINADOR);
		this.desarrollador = nuevoTrabajador("7000000002", TipoTrabajador.DESARROLLADOR);
		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto asignable", "d", null));
	}

	private Trabajador nuevoTrabajador(String identificacion, TipoTrabajador tipo) {
		return trabajadores.saveAndFlush(new Trabajador(identificacion, "Nombre", "Apellido",
				LocalDate.of(1991, 2, 2), "Calle 2", "Ingenieria", "Backend", tipo));
	}

	private String cuerpo(Long trabajadorId, Long proyectoId, String rol) {
		return "{\"trabajadorId\":%d,\"proyectoId\":%d,\"rolEnProyecto\":\"%s\"}"
				.formatted(trabajadorId, proyectoId, rol);
	}

	@Test
	@DisplayName("HU-06 C01: trabajador y proyecto habilitados, la asignacion se registra")
	void registraLaAsignacion() throws Exception {
		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.trabajadorId").value(desarrollador.getId()))
				.andExpect(jsonPath("$.proyectoId").value(proyecto.getId()))
				.andExpect(jsonPath("$.rolEnProyecto").value("DESARROLLADOR"))
				.andExpect(jsonPath("$.activa").value(true));
	}

	@Test
	@DisplayName("HU-06 C02: proyecto inhabilitado, no registra y avisa (RN-04)")
	void rechazaProyectoInhabilitado() throws Exception {
		proyecto.inhabilitar();
		proyectos.saveAndFlush(proyecto);

		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value("El proyecto 'Proyecto asignable' esta inhabilitado."));
	}

	@Test
	@DisplayName("HU-06 C03: trabajador inhabilitado, no registra y avisa (RN-03)")
	void rechazaTrabajadorInhabilitado() throws Exception {
		desarrollador.inhabilitar();
		trabajadores.saveAndFlush(desarrollador);

		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value(
						"El trabajador Nombre Apellido esta inhabilitado porque ya no pertenece a la empresa."));
	}

	@Test
	@DisplayName("HU-06 C04: asignacion equivalente activa, advierte para que el coordinador revise")
	void advierteSobreAsignacionEquivalente() throws Exception {
		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isCreated());

		// Segundo intento: advertencia, no bloqueo definitivo.
		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.advertencias.length()").value(1));
	}

	@Test
	@DisplayName("HU-06 C04: tras revisar, el coordinador confirma y la asignacion se registra")
	void permiteContinuarTrasLaAdvertencia() throws Exception {
		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.param("confirmado", "true")
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isCreated());
	}

	@Test
	@DisplayName("HU-06 C05: la asignacion se puede consultar por trabajador y por proyecto")
	void consultaLasAsignacionesRegistradas() throws Exception {
		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/asignaciones/trabajador/" + desarrollador.getId())
				.with(authentication(coordinador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].proyectoNombre").value("Proyecto asignable"));

		mockMvc.perform(get("/api/asignaciones/proyecto/" + proyecto.getId())
				.with(authentication(coordinador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].trabajadorIdentificacion").value("7000000002"));
	}

	@Test
	@DisplayName("D-21: el coordinador tambien puede asignar con rol de lider")
	void elCoordinadorPuedeAsignarRolDeLider() throws Exception {
		Trabajador lider = nuevoTrabajador("7000000003", TipoTrabajador.LIDER);

		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(lider.getId(), proyecto.getId(), "LIDER")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.rolEnProyecto").value("LIDER"));
	}

	@Test
	@DisplayName("RNF-001: un lider no puede usar la asignacion del coordinador")
	void unLiderNoUsaLaAsignacionDelCoordinador() throws Exception {
		Authentication lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"7000000004", "lider.asig@ikernell.com", TipoTrabajador.LIDER);

		mockMvc.perform(post("/api/asignaciones").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpo(desarrollador.getId(), proyecto.getId(), "DESARROLLADOR")))
				.andExpect(status().isForbidden());
	}

}

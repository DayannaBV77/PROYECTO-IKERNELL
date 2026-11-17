package com.PROYECTO.IKERNELL.backend.asignaciones;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Pruebas de integración para la implementación de Roles por Proyecto en IKernell.
 * Valida los 10 escenarios requeridos por la especificación.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RolesPorProyectoIntegrationTest {

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
	private AsignacionRepository asignacionRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private MockMvc mockMvc;
	private Trabajador coordinador;
	private Trabajador maria;
	private Proyecto proyectoA;
	private Proyecto proyectoB;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();

		this.coordinador = trabajadores.saveAndFlush(new Trabajador(
				"7700000001", "Carlos", "Coordinador", LocalDate.of(1985, 1, 1),
				"Calle 1", "Ingenieria", "Gestion", TipoTrabajador.COORDINADOR));
		cuentas.saveAndFlush(new CuentaAcceso(coordinador, "carlos.coord@ikernell.com",
				passwordEncoder.encode("Clave12345")));

		this.maria = trabajadores.saveAndFlush(new Trabajador(
				"7700000002", "Maria", "Lopez", LocalDate.of(1992, 5, 10),
				"Calle 2", "Ingenieria", "Software", TipoTrabajador.DESARROLLADOR));
		cuentas.saveAndFlush(new CuentaAcceso(maria, "maria.lopez@ikernell.com",
				passwordEncoder.encode("Clave12345")));

		this.proyectoA = proyectos.saveAndFlush(new Proyecto("Proyecto A", "Descripcion A", null));
		this.proyectoB = proyectos.saveAndFlush(new Proyecto("Proyecto B", "Descripcion B", null));
	}

	private MockHttpSession iniciarSesion(String correo, String clave) throws Exception {
		MvcResult resultado = mockMvc.perform(post("/api/auth/login")
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"correoCorporativo\":\"" + correo + "\",\"password\":\"" + clave + "\"}"))
				.andExpect(status().isOk())
				.andReturn();
		return (MockHttpSession) resultado.getRequest().getSession(false);
	}

	@Test
	@DisplayName("Escenario 1: Un trabajador con un solo proyecto y un solo rol")
	void escenario01_trabajadorConUnSoloProyectoYUnSoloRol() throws Exception {
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(maria.getId(), proyectoA.getId(), RolEnProyecto.LIDER),
				coordinador, false);

		MockHttpSession sesion = iniciarSesion("maria.lopez@ikernell.com", "Clave12345");

		mockMvc.perform(get("/api/contexto-proyecto/activo").session(sesion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.proyectoId").value(proyectoA.getId()))
				.andExpect(jsonPath("$.proyectoNombre").value("Proyecto A"))
				.andExpect(jsonPath("$.rolActivo").value("LIDER"))
				.andExpect(jsonPath("$.permisos").isArray());

		mockMvc.perform(get("/api/mis-proyectos/" + proyectoA.getId() + "/rol").session(sesion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.proyectoId").value(proyectoA.getId()))
				.andExpect(jsonPath("$.roles[0]").value("LIDER"))
				.andExpect(jsonPath("$.rolActivo").value("LIDER"));
	}

	@Test
	@DisplayName("Escenarios 2, 3, 4 y 5: María Líder en Proyecto A y Desarrollador en Proyecto B, cambio sin cerrar sesión y menús")
	void escenario02_03_04_05_cambioEntreProyectosSinCerrarSesion() throws Exception {
		// Asignar a María como LÍDER en Proyecto A
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(maria.getId(), proyectoA.getId(), RolEnProyecto.LIDER),
				coordinador, false);

		// Asignar a María como DESARROLLADOR en Proyecto B
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(maria.getId(), proyectoB.getId(), RolEnProyecto.DESARROLLADOR),
				coordinador, false);

		// Inicio de sesión único
		MockHttpSession sesion = iniciarSesion("maria.lopez@ikernell.com", "Clave12345");

		// Consultar sus proyectos asignados
		mockMvc.perform(get("/api/mis-proyectos").session(sesion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(2));

		// 1. Activar Proyecto A como LIDER
		mockMvc.perform(post("/api/contexto-proyecto/activo").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"proyectoId\":" + proyectoA.getId() + ",\"rol\":\"LIDER\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.proyectoId").value(proyectoA.getId()))
				.andExpect(jsonPath("$.rolActivo").value("LIDER"))
				.andExpect(jsonPath("$.permisos[?(@ == 'GESTION_PROYECTO')]").exists())
				.andExpect(jsonPath("$.permisos[?(@ == 'GESTION_ETAPAS')]").exists());

		// En Proyecto A, María puede crear una etapa porque tiene rol LIDER activo
		mockMvc.perform(post("/api/proyectos/" + proyectoA.getId() + "/etapas").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Etapa Inicial A\",\"descripcion\":\"Desc\"}"))
				.andExpect(status().isCreated());

		// 2. Conmutar a Proyecto B como DESARROLLADOR sin cerrar sesión
		mockMvc.perform(post("/api/contexto-proyecto/activo").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"proyectoId\":" + proyectoB.getId() + ",\"rol\":\"DESARROLLADOR\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.proyectoId").value(proyectoB.getId()))
				.andExpect(jsonPath("$.rolActivo").value("DESARROLLADOR"))
				.andExpect(jsonPath("$.permisos[?(@ == 'MIS_ACTIVIDADES')]").exists())
				.andExpect(jsonPath("$.permisos[?(@ == 'REGISTRO_INCIDENCIAS')]").exists())
				.andExpect(jsonPath("$.permisos[?(@ == 'GESTION_ETAPAS')]").doesNotExist());

		// 3. Verificar que las asignaciones en BD no se borraron
		assertThat(asignacionRepository.findByTrabajadorIdAndActivaTrueOrderByProyectoNombreAsc(maria.getId()))
				.hasSize(2);
	}

	@Test
	@DisplayName("Escenario 6: Intento de ejecutar una función sin permisos (403 Forbidden)")
	void escenario06_intentoDeEjecutarFuncionSinPermisos() throws Exception {
		// María es sólo DESARROLLADOR en Proyecto B
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(maria.getId(), proyectoB.getId(), RolEnProyecto.DESARROLLADOR),
				coordinador, false);

		MockHttpSession sesion = iniciarSesion("maria.lopez@ikernell.com", "Clave12345");

		// Activar contexto de DESARROLLADOR en Proyecto B
		mockMvc.perform(post("/api/contexto-proyecto/activo").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"proyectoId\":" + proyectoB.getId() + ",\"rol\":\"DESARROLLADOR\"}"))
				.andExpect(status().isOk());

		// Intento de crear etapa (requiere rol LIDER) -> 403 Forbidden
		mockMvc.perform(post("/api/proyectos/" + proyectoB.getId() + "/etapas").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Etapa Prohibida\",\"descripcion\":\"Desc\"}"))
				.andExpect(status().isForbidden());

		// Intento de registrar proyecto -> 403 Forbidden
		mockMvc.perform(post("/api/proyectos").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Nuevo Proyecto Hack\",\"descripcion\":\"Desc\"}"))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("Escenario 7: Intento de asignar un trabajador inhabilitado")
	void escenario07_intentoDeAsignarTrabajadorInhabilitado() throws Exception {
		Trabajador inhabilitado = trabajadores.saveAndFlush(new Trabajador(
				"7700000009", "Inactivo", "ExTrabajador", LocalDate.of(1990, 1, 1),
				"Calle 9", "Ingenieria", "Java", TipoTrabajador.DESARROLLADOR));
		inhabilitado.inhabilitar();
		trabajadores.saveAndFlush(inhabilitado);

		MockHttpSession sesion = iniciarSesion("carlos.coord@ikernell.com", "Clave12345");

		mockMvc.perform(post("/api/asignaciones").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"trabajadorId\":" + inhabilitado.getId() + ",\"proyectoId\":" + proyectoA.getId()
						+ ",\"rolEnProyecto\":\"DESARROLLADOR\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("inhabilitado")));
	}

	@Test
	@DisplayName("Escenario 8: Intento de asignar un proyecto inhabilitado")
	void escenario08_intentoDeAsignarProyectoInhabilitado() throws Exception {
		proyectoA.inhabilitar();
		proyectos.saveAndFlush(proyectoA);

		MockHttpSession sesion = iniciarSesion("carlos.coord@ikernell.com", "Clave12345");

		mockMvc.perform(post("/api/asignaciones").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"trabajadorId\":" + maria.getId() + ",\"proyectoId\":" + proyectoA.getId()
						+ ",\"rolEnProyecto\":\"DESARROLLADOR\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.containsString("inhabilitado")));
	}

	@Test
	@DisplayName("Escenario 9: Intento de crear una asignación equivalente duplicada")
	void escenario09_intentoDeCrearAsignacionEquivalenteDuplicada() throws Exception {
		MockHttpSession sesion = iniciarSesion("carlos.coord@ikernell.com", "Clave12345");

		// Primera asignación exitosa
		mockMvc.perform(post("/api/asignaciones").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"trabajadorId\":" + maria.getId() + ",\"proyectoId\":" + proyectoA.getId()
						+ ",\"rolEnProyecto\":\"DESARROLLADOR\"}"))
				.andExpect(status().isCreated());

		// Asignación duplicada con confirmado=false -> 409 Conflict con advertencia
		mockMvc.perform(post("/api/asignaciones").session(sesion)
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"trabajadorId\":" + maria.getId() + ",\"proyectoId\":" + proyectoA.getId()
						+ ",\"rolEnProyecto\":\"DESARROLLADOR\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje").value(
						"El trabajador ya tiene una asignacion equivalente activa en este proyecto."));

		// Con confirmado=true -> devuelve 201 y no duplica filas en la base de datos
		mockMvc.perform(post("/api/asignaciones").session(sesion)
				.param("confirmado", "true")
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"trabajadorId\":" + maria.getId() + ",\"proyectoId\":" + proyectoA.getId()
						+ ",\"rolEnProyecto\":\"DESARROLLADOR\"}"))
				.andExpect(status().isCreated());

		assertThat(asignacionRepository.findByTrabajadorIdAndProyectoIdAndActivaTrue(
				maria.getId(), proyectoA.getId())).hasSize(1);
	}

	@Test
	@DisplayName("Escenario 10: Trabajador sin proyectos asignados")
	void escenario10_trabajadorSinProyectosAsignados() throws Exception {
		// María no tiene asignaciones
		MockHttpSession sesion = iniciarSesion("maria.lopez@ikernell.com", "Clave12345");

		mockMvc.perform(get("/api/mis-proyectos").session(sesion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("No participa en ningun proyecto todavia."));

		mockMvc.perform(get("/api/contexto-proyecto/activo").session(sesion))
				.andExpect(status().isOk());
	}

}

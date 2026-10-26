package com.PROYECTO.IKERNELL.backend.asignaciones;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Proyectos del trabajador autenticado.
 *
 * <p>No corresponde a una condicion de aceptacion: el endpoint cubre el vacio
 * de requisitos que obligaba a deducir los proyectos propios de las actividades
 * asignadas. Lo que se comprueba es que entregue exactamente las asignaciones
 * activas de quien pregunta, con su rol, y nada mas.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MisProyectosControllerTest {

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
	private ServicioProyectos servicioProyectos;

	private MockMvc mockMvc;
	private Authentication desarrollador;
	private Trabajador desarrolladorTrabajador;
	private Trabajador liderTrabajador;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();

		AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000001", "lider.mis@ikernell.com", TipoTrabajador.LIDER);
		this.liderTrabajador = trabajadores.findByIdentificacion("9300000001").orElseThrow();

		this.desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000002", "dev.mis@ikernell.com", TipoTrabajador.DESARROLLADOR);
		this.desarrolladorTrabajador = trabajadores.findByIdentificacion("9300000002").orElseThrow();
	}

	private Proyecto proyecto(String nombre) {
		return proyectos.saveAndFlush(new Proyecto(nombre, "d", liderTrabajador));
	}

	private void asignar(Trabajador trabajador, Proyecto proyecto, RolEnProyecto rol) {
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(trabajador.getId(), proyecto.getId(), rol),
				liderTrabajador, false);
	}

	@Test
	@DisplayName("Entrega los proyectos con asignacion activa del trabajador autenticado")
	void entregaMisProyectos() throws Exception {
		asignar(desarrolladorTrabajador, proyecto("Proyecto Alfa"), RolEnProyecto.DESARROLLADOR);

		mockMvc.perform(get("/api/mis-proyectos").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].proyectoNombre").value("Proyecto Alfa"))
				.andExpect(jsonPath("$.contenido[0].estadoHabilitacion").value("HABILITADO"))
				.andExpect(jsonPath("$.contenido[0].roles[0]").value("DESARROLLADOR"))
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@DisplayName("No entrega los proyectos en los que esta asignado otro trabajador")
	void noEntregaProyectosDeOtros() throws Exception {
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9300000003", "Otro", "Dev",
				java.time.LocalDate.of(1990, 1, 1), "Calle 9", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		asignar(otro, proyecto("Proyecto ajeno"), RolEnProyecto.DESARROLLADOR);

		mockMvc.perform(get("/api/mis-proyectos").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	@DisplayName("Sin asignaciones devuelve el aviso y no una lista vacia a secas (RN-14)")
	void avisaCuandoNoParticipaEnNingunProyecto() throws Exception {
		mockMvc.perform(get("/api/mis-proyectos").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("No participa en ningun proyecto todavia."));
	}

	@Test
	@DisplayName("Un proyecto con dos roles activos aparece una sola vez, con los dos roles")
	void agrupaLosRolesDelMismoProyecto() throws Exception {
		Proyecto compartido = proyecto("Proyecto con dos roles");
		asignar(desarrolladorTrabajador, compartido, RolEnProyecto.DESARROLLADOR);
		asignar(desarrolladorTrabajador, compartido, RolEnProyecto.LIDER);

		mockMvc.perform(get("/api/mis-proyectos").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].roles.length()").value(2));
	}

	@Test
	@DisplayName("Los proyectos llegan ordenados por nombre, para que el selector sea estable")
	void ordenaPorNombreDeProyecto() throws Exception {
		asignar(desarrolladorTrabajador, proyecto("Zeta"), RolEnProyecto.DESARROLLADOR);
		asignar(desarrolladorTrabajador, proyecto("Beta"), RolEnProyecto.DESARROLLADOR);

		mockMvc.perform(get("/api/mis-proyectos").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.contenido[0].proyectoNombre").value("Beta"))
				.andExpect(jsonPath("$.contenido[1].proyectoNombre").value("Zeta"));
	}

	@Test
	@DisplayName("Un proyecto inhabilitado sigue apareciendo, marcado con su estado")
	void incluyeLosProyectosInhabilitadosMarcandolos() throws Exception {
		Proyecto inhabilitado = proyecto("Proyecto detenido");
		asignar(desarrolladorTrabajador, inhabilitado, RolEnProyecto.DESARROLLADOR);
		servicioProyectos.inhabilitar(inhabilitado.getId(), true);

		mockMvc.perform(get("/api/mis-proyectos").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].estadoHabilitacion").value("INHABILITADO"));
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no se consultan los proyectos propios")
	void sinSesionNoHayProyectos() throws Exception {
		mockMvc.perform(get("/api/mis-proyectos"))
				.andExpect(status().isUnauthorized());
	}

}

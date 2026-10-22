package com.PROYECTO.IKERNELL.backend.actividades;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
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
 * Consulta y ejecucion de actividades propias: una prueba por condicion de
 * aceptacion de HU-16 (RF-022).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MisActividadesControllerTest {

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
	private ActividadRepository actividades;

	@Autowired
	private EjecucionActividadRepository ejecuciones;

	private MockMvc mockMvc;
	private Authentication desarrollador;
	private Trabajador desarrolladorTrabajador;
	private Etapa etapa;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9100000001", "dev.mis@ikernell.com", TipoTrabajador.DESARROLLADOR);
		this.desarrolladorTrabajador = trabajadores.findByIdentificacion("9100000001").orElseThrow();
		Proyecto proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto propio", "d", null));
		this.etapa = etapas.saveAndFlush(new Etapa(proyecto, "Desarrollo", "d", 1));
	}

	private Actividad actividadPara(Trabajador trabajador, String descripcion) {
		return actividades.saveAndFlush(new Actividad(etapa, trabajador, descripcion));
	}

	@Test
	@DisplayName("HU-16 C01: muestra las actividades registradas que estan asignadas a mi")
	void muestraMisActividades() throws Exception {
		actividadPara(desarrolladorTrabajador, "Mi actividad");

		mockMvc.perform(get("/api/mis-actividades").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].descripcion").value("Mi actividad"))
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@DisplayName("HU-16 C01: no muestra las actividades de otros desarrolladores")
	void noMuestraActividadesDeOtros() throws Exception {
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9100000002", "Otro", "Dev",
				java.time.LocalDate.of(1990, 1, 1), "Calle 9", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		actividadPara(otro, "Actividad ajena");

		mockMvc.perform(get("/api/mis-actividades").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	@DisplayName("HU-16 C02: registra la ejecucion de una actividad propia y la confirma")
	void registraLaEjecucion() throws Exception {
		Actividad actividad = actividadPara(desarrolladorTrabajador, "Actividad a ejecutar");

		mockMvc.perform(post("/api/mis-actividades/" + actividad.getId() + "/ejecucion")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Avance del 50 por ciento\",\"finalizada\":false}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.actividadId").value(actividad.getId()))
				.andExpect(jsonPath("$.ejecutadaPorId").value(desarrolladorTrabajador.getId()))
				.andExpect(jsonPath("$.iniciadaEn").exists())
				.andExpect(jsonPath("$.finalizadaEn").doesNotExist());

		assertThat(ejecuciones.findByActividadIdOrderByIniciadaEnDesc(actividad.getId())).hasSize(1);
	}

	@Test
	@DisplayName("HU-16 C02: al finalizar queda registrada la hora de cierre")
	void registraLaEjecucionFinalizada() throws Exception {
		Actividad actividad = actividadPara(desarrolladorTrabajador, "Actividad a cerrar");

		mockMvc.perform(post("/api/mis-actividades/" + actividad.getId() + "/ejecucion")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Terminada\",\"finalizada\":true}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.finalizadaEn").exists());
	}

	@Test
	@DisplayName("HU-16 C03: no se puede ejecutar la actividad de otro desarrollador (RN-06)")
	void noEjecutaActividadDeOtro() throws Exception {
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9100000003", "Otro", "Dev",
				java.time.LocalDate.of(1990, 1, 1), "Calle 9", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		Actividad ajena = actividadPara(otro, "Actividad ajena");

		mockMvc.perform(post("/api/mis-actividades/" + ajena.getId() + "/ejecucion")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Intento\",\"finalizada\":false}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.mensaje").value("La actividad no existe o no esta asignada a usted."));

		assertThat(ejecuciones.findByActividadIdOrderByIniciadaEnDesc(ajena.getId())).isEmpty();
	}

	@Test
	@DisplayName("HU-16 C03: una actividad inexistente da el mismo mensaje, sin revelar si existe")
	void actividadInexistenteDaElMismoMensaje() throws Exception {
		mockMvc.perform(post("/api/mis-actividades/999999/ejecucion")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Intento\",\"finalizada\":false}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.mensaje").value("La actividad no existe o no esta asignada a usted."));
	}

	@Test
	@DisplayName("HU-16 C04: sin actividades asignadas muestra un aviso, no una lista vacia")
	void avisaCuandoNoTengoActividades() throws Exception {
		mockMvc.perform(get("/api/mis-actividades").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("No tiene actividades asignadas."));
	}

	@Test
	@DisplayName("HU-16 C05 y C-06: un lider ejecuta las actividades que le asignaron como desarrollador")
	void unLiderEjecutaSusActividadesComoDesarrollador() throws Exception {
		Authentication liderAuth = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9100000004", "lider.dev@ikernell.com", TipoTrabajador.LIDER);
		Trabajador liderTrabajador = trabajadores.findByIdentificacion("9100000004").orElseThrow();
		Actividad actividad = actividadPara(liderTrabajador, "Actividad del lider como desarrollador");

		// Las ve igual que cualquier desarrollador...
		mockMvc.perform(get("/api/mis-actividades").with(authentication(liderAuth)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));

		// ...y las ejecuta, aunque su tipo global sea LIDER.
		mockMvc.perform(post("/api/mis-actividades/" + actividad.getId() + "/ejecucion")
				.with(csrf()).with(authentication(liderAuth))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Ejecutada\",\"finalizada\":true}"))
				.andExpect(status().isCreated());
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no se accede a las actividades propias")
	void sinSesionNoHayActividades() throws Exception {
		mockMvc.perform(get("/api/mis-actividades"))
				.andExpect(status().isUnauthorized());
	}

}

package com.PROYECTO.IKERNELL.backend.reportes;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
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

import com.PROYECTO.IKERNELL.backend.actividades.ActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.incidencias.InterrupcionProyectoRepository;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.UnidadDuracion;
import com.PROYECTO.IKERNELL.backend.proyectos.EtapaRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Reportes internos: una prueba por condicion de aceptacion de HU-07 (RF-006),
 * HU-14 (RF-018) y HU-15 (RF-017).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReporteControllerTest {

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
	private InterrupcionProyectoRepository interrupciones;


	@Autowired
	private ServicioAsignaciones servicioAsignaciones;

	private MockMvc mockMvc;
	private Authentication coordinador;
	private Authentication lider;
	private Authentication desarrolladorAuth;
	private Trabajador desarrollador;
	private Proyecto proyecto;
	private Etapa etapa;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();

		this.coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000001", "coord.rep@ikernell.com", TipoTrabajador.COORDINADOR);
		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000002", "lider.rep@ikernell.com", TipoTrabajador.LIDER);
		Trabajador liderTrabajador = trabajadores.findByIdentificacion("9300000002").orElseThrow();

		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto con reportes", "d", liderTrabajador));
		this.etapa = etapas.saveAndFlush(new Etapa(proyecto, "Desarrollo", "d", 1));

		this.desarrolladorAuth = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000003", "dev.rep@ikernell.com", TipoTrabajador.DESARROLLADOR);
		this.desarrollador = trabajadores.findByIdentificacion("9300000003").orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(desarrollador.getId(), proyecto.getId(), RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);

	}

	private Actividad nuevaActividad(Trabajador asignado, String descripcion) {
		return actividades.saveAndFlush(new Actividad(etapa, asignado, descripcion, null, null));
	}

	private void registrarEjecucion(Long actividadId, boolean finalizada) throws Exception {
		mockMvc.perform(post("/api/mis-actividades/" + actividadId + "/ejecucion")
				.with(csrf()).with(authentication(desarrolladorAuth))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Trabajo realizado\",\"finalizada\":%s}".formatted(finalizada)))
				.andExpect(status().isCreated());
	}

	private InterrupcionProyecto nuevaInterrupcion(String tipo, LocalDate fecha, String valor,
			UnidadDuracion unidad) {
		return interrupciones.saveAndFlush(new InterrupcionProyecto(proyecto, tipo, fecha,
				new BigDecimal(valor), unidad, etapa, desarrollador));
	}

	// --------------------------------------------------- HU-07 / RF-006

	@Test
	@DisplayName("HU-07 C01 y C02: el reporte reune las actividades del desarrollador con sus ejecuciones")
	void reporteDeDesempenoConActividadesYEjecuciones() throws Exception {
		Actividad actividad = nuevaActividad(desarrollador, "Implementar modulo");
		registrarEjecucion(actividad.getId(), true);

		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(coordinador))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.desarrolladorNombreCompleto").exists())
				.andExpect(jsonPath("$.proyectoNombre").value("Proyecto con reportes"))
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].descripcion").value("Implementar modulo"))
				.andExpect(jsonPath("$.contenido[0].numeroEjecuciones").value(1))
				.andExpect(jsonPath("$.resumen.ejecucionesFinalizadas").value(1))
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@DisplayName("HU-07 C02: el reporte declara que indicadores de desempeno faltan por definir (D-09)")
	void elReporteDeclaraLoQueFaltaPorDefinir() throws Exception {
		nuevaActividad(desarrollador, "Actividad");

		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(coordinador))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.datosPendientes.length()").value(4));
	}

	@Test
	@DisplayName("HU-07 C03: sin actividades registradas muestra un aviso, no un reporte vacio")
	void avisaCuandoNoHayActividadesDelDesarrollador() throws Exception {
		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(coordinador))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("El desarrollador no tiene actividades registradas en este proyecto."));
	}

	@Test
	@DisplayName("HU-07 C04: con periodo definido solo entran las actividades ejecutadas en el")
	void filtraElDesempenoPorPeriodo() throws Exception {
		Actividad ejecutada = nuevaActividad(desarrollador, "Actividad ejecutada hoy");
		registrarEjecucion(ejecutada.getId(), false);
		nuevaActividad(desarrollador, "Actividad sin ejecutar");

		LocalDate hoy = LocalDate.now();

		// Periodo que incluye hoy: aparece la ejecutada y no la que no tiene ejecucion.
		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(coordinador))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId()))
				.param("desde", hoy.minusDays(1).toString())
				.param("hasta", hoy.plusDays(1).toString()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].descripcion").value("Actividad ejecutada hoy"));

		// Periodo anterior: nada cae dentro.
		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(coordinador))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId()))
				.param("desde", hoy.minusDays(30).toString())
				.param("hasta", hoy.minusDays(20).toString()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value(
						"El desarrollador no tiene actividades registradas en este proyecto para el periodo indicado."));
	}

	@Test
	@DisplayName("HU-07 C05: un desarrollador no puede generar el reporte de desempeno")
	void unDesarrolladorNoGeneraElReporteDeDesempeno() throws Exception {
		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(desarrolladorAuth))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("HU-07 C05: tampoco el lider; este reporte es del coordinador")
	void elLiderNoGeneraElReporteDeDesempeno() throws Exception {
		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(lider))
				.param("desarrolladorId", String.valueOf(desarrollador.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("RF-006 y RN-05: tambien reporta el trabajo de un lider asignado como desarrollador")
	void reportaElDesempenoDeUnLiderComoDesarrollador() throws Exception {
		Trabajador otroLider = trabajadores.saveAndFlush(new Trabajador("9300000004", "Otro", "Lider",
				LocalDate.of(1990, 1, 1), "Calle 1", "Ingenieria", "Backend", TipoTrabajador.LIDER));
		nuevaActividad(otroLider, "Actividad del lider como desarrollador");

		mockMvc.perform(get("/api/reportes/desempeno").with(authentication(coordinador))
				.param("desarrolladorId", String.valueOf(otroLider.getId()))
				.param("proyectoId", String.valueOf(proyecto.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));
	}

	// --------------------------------------------------- HU-14 / RF-018

	@Test
	@DisplayName("HU-14 C01 y C02: el reporte muestra cada actividad con su desarrollador asignado")
	void reporteDeActividadesPorProyecto() throws Exception {
		nuevaActividad(desarrollador, "Actividad uno");
		nuevaActividad(desarrollador, "Actividad dos");

		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/actividades")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.proyectoNombre").value("Proyecto con reportes"))
				.andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.contenido[0].desarrolladorNombreCompleto").exists())
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@DisplayName("HU-14 C03: sin actividades muestra un aviso, no un reporte vacio")
	void avisaCuandoElProyectoNoTieneActividades() throws Exception {
		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/actividades")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("El proyecto no tiene actividades registradas."));
	}

	@Test
	@DisplayName("HU-14 C04: el filtro por desarrollador deja solo sus actividades")
	void filtraElReporteDeActividades() throws Exception {
		nuevaActividad(desarrollador, "Del desarrollador asignado");
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9300000005", "Otro", "Dev",
				LocalDate.of(1990, 1, 1), "Calle 1", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		nuevaActividad(otro, "De otro desarrollador");

		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/actividades")
				.with(authentication(lider))
				.param("desarrolladorId", String.valueOf(desarrollador.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].descripcion").value("Del desarrollador asignado"));
	}

	@Test
	@DisplayName("HU-14 C05: un desarrollador no puede generar el reporte de actividades")
	void unDesarrolladorNoGeneraElReporteDeActividades() throws Exception {
		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/actividades")
				.with(authentication(desarrolladorAuth)))
				.andExpect(status().isForbidden());
	}

	// --------------------------------------------------- HU-15 / RF-017

	@Test
	@DisplayName("HU-15 C01 y C02: cada interrupcion se reporta con tipo, fecha, duracion y etapa")
	void reporteDeInterrupciones() throws Exception {
		nuevaInterrupcion("CORTE_ENERGIA", LocalDate.of(2026, 10, 10), "4", UnidadDuracion.HORAS);

		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].tipoInterrupcion").value("CORTE_ENERGIA"))
				.andExpect(jsonPath("$.contenido[0].fecha").value("2026-10-10"))
				.andExpect(jsonPath("$.contenido[0].duracionValor").value(4))
				.andExpect(jsonPath("$.contenido[0].etapaNombre").value("Desarrollo"));
	}

	@Test
	@DisplayName("RF-017: las duraciones se totalizan por unidad, sin convertir horas en dias (D-07)")
	void totalizaLaDuracionPorUnidad() throws Exception {
		nuevaInterrupcion("CORTE_ENERGIA", LocalDate.of(2026, 10, 10), "4", UnidadDuracion.HORAS);
		nuevaInterrupcion("CORTE_INTERNET", LocalDate.of(2026, 10, 11), "2.5", UnidadDuracion.HORAS);
		nuevaInterrupcion("PARO_GENERAL", LocalDate.of(2026, 10, 12), "1", UnidadDuracion.DIAS);

		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(3))
				.andExpect(jsonPath("$.duracionTotalPorUnidad.HORAS").value(6.5))
				.andExpect(jsonPath("$.duracionTotalPorUnidad.DIAS").value(1));
	}

	@Test
	@DisplayName("HU-15 C03: sin interrupciones muestra un aviso, no un reporte vacio")
	void avisaCuandoNoHayInterrupciones() throws Exception {
		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("El proyecto no tiene interrupciones registradas."));
	}

	@Test
	@DisplayName("HU-15 C04: con periodo definido solo aparecen las interrupciones de ese rango")
	void filtraLasInterrupcionesPorPeriodo() throws Exception {
		nuevaInterrupcion("DENTRO", LocalDate.of(2026, 10, 10), "4", UnidadDuracion.HORAS);
		nuevaInterrupcion("FUERA", LocalDate.of(2026, 9, 1), "4", UnidadDuracion.HORAS);

		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider))
				.param("desde", "2026-10-01")
				.param("hasta", "2026-10-31"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].tipoInterrupcion").value("DENTRO"));
	}

	@Test
	@DisplayName("HU-15 C05: un desarrollador no puede generar el reporte de interrupciones")
	void unDesarrolladorNoGeneraElReporteDeInterrupciones() throws Exception {
		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(desarrolladorAuth)))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("RF-017: un periodo invertido se rechaza con un mensaje claro")
	void rechazaPeriodoInvertido() throws Exception {
		mockMvc.perform(get("/api/reportes/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider))
				.param("desde", "2026-10-31")
				.param("hasta", "2026-10-01"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje")
						.value("La fecha inicial del periodo no puede ser posterior a la final."));
	}

	@Test
	@DisplayName("RF-017: un proyecto inexistente devuelve 404")
	void proyectoInexistenteEnElReporte() throws Exception {
		mockMvc.perform(get("/api/reportes/proyectos/999999/interrupciones").with(authentication(lider)))
				.andExpect(status().isNotFound());
	}

}

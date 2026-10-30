package com.PROYECTO.IKERNELL.backend.midia;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

import com.PROYECTO.IKERNELL.backend.actividades.ActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.PrioridadActividad;
import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.midia.domain.TareaMiDia;
import com.PROYECTO.IKERNELL.backend.proyectos.EtapaRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Panel «Mi Dia»: una prueba por salida de RF-038 y por cada decision que el
 * requerimiento deja abierta (D-29, D-30, D-31).
 *
 * <p>Las fechas se expresan relativas a hoy, nunca fijas: "hoy" es justo lo que
 * define este panel, y una fecha escrita a mano haria fallar la prueba al dia
 * siguiente.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MiDiaControllerTest {

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

	@Autowired
	private TareaMiDiaRepository tareas;

	@Autowired
	private ServicioAsignaciones servicioAsignaciones;

	private MockMvc mockMvc;
	private Authentication desarrollador;
	private Trabajador desarrolladorTrabajador;
	private Trabajador liderTrabajador;
	private Proyecto proyecto;
	private Etapa etapa;

	private static final LocalDate HOY = LocalDate.now();

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();

		AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9600000001", "lider.midia@ikernell.com", TipoTrabajador.LIDER);
		this.liderTrabajador = trabajadores.findByIdentificacion("9600000001").orElseThrow();
		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto del dia", "d", liderTrabajador));
		this.etapa = etapas.saveAndFlush(new Etapa(proyecto, "Construccion", "d", 1));

		this.desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9600000002", "dev.midia@ikernell.com", TipoTrabajador.DESARROLLADOR);
		this.desarrolladorTrabajador = trabajadores.findByIdentificacion("9600000002").orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(desarrolladorTrabajador.getId(), proyecto.getId(),
						RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);
	}

	private Actividad actividad(Trabajador para, String descripcion, PrioridadActividad prioridad,
			LocalDate dia) {
		return actividades.saveAndFlush(new Actividad(etapa, para, descripcion, prioridad, dia));
	}

	/** Registra una ejecucion finalizada, que es lo que deja de estar pendiente (D-31). */
	private void finalizar(Long actividadId) throws Exception {
		mockMvc.perform(post("/api/mis-actividades/" + actividadId + "/ejecucion")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Terminada\",\"finalizada\":true}"))
				.andExpect(status().isCreated());
	}

	/** Agrega una tarea personal y devuelve su id, para las pruebas del checklist. */
	private Long crearTarea(String descripcion) throws Exception {
		String respuesta = mockMvc.perform(post("/api/mi-dia/tareas")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"descripcion\":\"" + descripcion + "\"}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	// ------------------------------------------------- Actividades del dia

	@Test
	@DisplayName("RF-038: muestra las actividades pendientes del dia ordenadas por prioridad")
	void ordenaLasActividadesPorPrioridad() throws Exception {
		actividad(desarrolladorTrabajador, "Tarea media", PrioridadActividad.MEDIA, HOY);
		actividad(desarrolladorTrabajador, "Tarea alta", PrioridadActividad.ALTA, HOY);
		actividad(desarrolladorTrabajador, "Tarea baja", PrioridadActividad.BAJA, HOY);

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.dia").value(HOY.toString()))
				.andExpect(jsonPath("$.total").value(3))
				.andExpect(jsonPath("$.actividades[0].actividad.descripcion").value("Tarea alta"))
				.andExpect(jsonPath("$.actividades[1].actividad.descripcion").value("Tarea media"))
				.andExpect(jsonPath("$.actividades[2].actividad.descripcion").value("Tarea baja"))
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@DisplayName("D-29: las actividades sin prioridad van al final, sin suponerles una")
	void lasActividadesSinPrioridadVanAlFinal() throws Exception {
		actividad(desarrolladorTrabajador, "Sin prioridad", null, HOY);
		actividad(desarrolladorTrabajador, "Con prioridad baja", PrioridadActividad.BAJA, HOY);

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.actividades[0].actividad.descripcion").value("Con prioridad baja"))
				.andExpect(jsonPath("$.actividades[1].actividad.descripcion").value("Sin prioridad"))
				.andExpect(jsonPath("$.actividades[1].actividad.prioridad").doesNotExist());
	}

	@Test
	@DisplayName("D-30: una actividad de ayer sigue en el panel y se marca como atrasada")
	void mantieneLasAtrasadasYLasMarca() throws Exception {
		actividad(desarrolladorTrabajador, "De ayer", PrioridadActividad.MEDIA, HOY.minusDays(1));
		actividad(desarrolladorTrabajador, "De hoy", PrioridadActividad.MEDIA, HOY);

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.atrasadas").value(1))
				// Misma prioridad: primero lo mas atrasado.
				.andExpect(jsonPath("$.actividades[0].actividad.descripcion").value("De ayer"))
				.andExpect(jsonPath("$.actividades[0].atrasada").value(true))
				.andExpect(jsonPath("$.actividades[1].atrasada").value(false));
	}

	@Test
	@DisplayName("D-30: una actividad planificada para manana todavia no aparece")
	void noMuestraLasDeDiasPosteriores() throws Exception {
		actividad(desarrolladorTrabajador, "De manana", PrioridadActividad.ALTA, HOY.plusDays(1));

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	@DisplayName("D-31: una actividad finalizada sigue en el checklist, marcada como completada")
	void incluyeLasFinalizadasComoCompletadas() throws Exception {
		Actividad terminada = actividad(desarrolladorTrabajador, "Ya terminada",
				PrioridadActividad.ALTA, HOY);
		actividad(desarrolladorTrabajador, "Aun pendiente", PrioridadActividad.BAJA, HOY);
		finalizar(terminada.getId());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.pendientes").value(1))
				.andExpect(jsonPath("$.completadas").value(1))
				.andExpect(jsonPath("$.actividades[0].actividad.descripcion").value("Aun pendiente"))
				.andExpect(jsonPath("$.actividades[0].completada").value(false))
				.andExpect(jsonPath("$.actividades[1].actividad.descripcion").value("Ya terminada"))
				.andExpect(jsonPath("$.actividades[1].completada").value(true));
	}

	@Test
	@DisplayName("D-31: una ejecucion sin finalizar no saca la actividad del panel")
	void unaEjecucionAbiertaNoLaDaPorTerminada() throws Exception {
		Actividad enCurso = actividad(desarrolladorTrabajador, "En curso", PrioridadActividad.ALTA, HOY);
		mockMvc.perform(post("/api/mis-actividades/" + enCurso.getId() + "/ejecucion")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"observaciones\":\"Avance parcial\",\"finalizada\":false}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));
	}

	@Test
	@DisplayName("RF-038: solo muestra las actividades asignadas a quien consulta")
	void noMuestraActividadesDeOtros() throws Exception {
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9600000003", "Otro", "Dev",
				LocalDate.of(1990, 1, 1), "Calle 9", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		actividad(otro, "Tarea ajena", PrioridadActividad.ALTA, HOY);

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0));
	}

	// ----------------------------------------- Actividades sin dia planificado

	@Test
	@DisplayName("RF-038: avisa de las actividades pendientes sin dia, en lugar de ocultarlas")
	void avisaDeLasQueNoTienenDiaPlanificado() throws Exception {
		actividad(desarrolladorTrabajador, "Sin dia", PrioridadActividad.ALTA, null);

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.sinDiaPlanificado").value(1))
				.andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers
						.containsString("sin dia planificado")));
	}

	@Test
	@DisplayName("RN-14: sin tareas devuelve el aviso y no una lista vacia a secas")
	void avisaCuandoNoHayNadaParaHoy() throws Exception {
		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.pendientes").value(0))
				.andExpect(jsonPath("$.completadas").value(0))
				.andExpect(jsonPath("$.tareasPersonales").isEmpty())
				.andExpect(jsonPath("$.sinDiaPlanificado").value(0))
				.andExpect(jsonPath("$.mensaje").value("No tiene tareas pendientes para hoy."));
	}

	// ------------------------------------------------------- Notificaciones

	@Test
	@DisplayName("RF-038: el indicador del chat cuenta los mensajes ajenos sin leer")
	void cuentaLosNoLeidosDelChat() throws Exception {
		Authentication companero = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9600000004", "dev2.midia@ikernell.com", TipoTrabajador.DESARROLLADOR);
		Trabajador companeroTrabajador = trabajadores.findByIdentificacion("9600000004").orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(companeroTrabajador.getId(), proyecto.getId(),
						RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);

		String respuesta = mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(csrf()).with(authentication(companero))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"Consulta tecnica\"}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		Long hiloId = Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));

		mockMvc.perform(post("/api/hilos/" + hiloId + "/mensajes")
				.with(csrf()).with(authentication(companero))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"cuerpo\":\"Tengo una duda\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notificaciones.chatNoLeidos").value(1))
				.andExpect(jsonPath("$.notificaciones.conversacionesNoLeidas").isArray())
				.andExpect(jsonPath("$.notificaciones.conversacionesNoLeidas[0].id").value(hiloId))
				.andExpect(jsonPath("$.notificaciones.conversacionesNoLeidas[0].titulo")
						.value("Consulta tecnica"))
				.andExpect(jsonPath("$.notificaciones.conversacionesNoLeidas[0].proyectoNombre")
						.value("Proyecto del dia"))
				.andExpect(jsonPath("$.notificaciones.conversacionesNoLeidas[0].noLeidos").value(1));
	}

	@Test
	@DisplayName("RF-038: sin conversaciones el indicador es cero y la lista llega vacia")
	void sinConversacionesElIndicadorEsCero() throws Exception {
		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notificaciones.chatNoLeidos").value(0))
				.andExpect(jsonPath("$.notificaciones.conversacionesNoLeidas").isEmpty());
	}

	@Test
	@DisplayName("RF-038 INCUMPLIDO: del correo se informa el estado, no un contador")
	void delCorreoSeInformaElEstadoYNoUnContador() throws Exception {
		// RF-031 resuelve el correo como enlace a un servicio externo (D-13), de
		// modo que el aplicativo no puede saber cuantos mensajes sin leer hay. Se
		// entrega el estado del acceso y un aviso explicito, en lugar de un cero
		// que el cliente leeria como "no tiene correos nuevos".
		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notificaciones.correo.disponible").value(false))
				.andExpect(jsonPath("$.notificaciones.correo.mensaje").exists())
				.andExpect(jsonPath("$.notificaciones.avisoCorreoNoLeidos").exists())
				.andExpect(jsonPath("$.notificaciones.correoNoLeidos").doesNotExist());
	}

	// ------------------------------------------------------------- Checklist

	@Test
	@DisplayName("Checklist: agrega una tarea personal y aparece en el panel")
	void agregaUnaTareaPersonalYLaMuestraEnElPanel() throws Exception {
		Long tareaId = crearTarea("Revisar el pull request");

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tareasPersonales[0].id").value(tareaId))
				.andExpect(jsonPath("$.tareasPersonales[0].descripcion")
						.value("Revisar el pull request"))
				.andExpect(jsonPath("$.tareasPersonales[0].completada").value(false))
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.pendientes").value(1))
				.andExpect(jsonPath("$.completadas").value(0));
	}

	@Test
	@DisplayName("Checklist: una tarea personal vacia se rechaza con el campo senalado")
	void rechazaUnaTareaPersonalVacia() throws Exception {
		mockMvc.perform(post("/api/mi-dia/tareas")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"descripcion\":\"   \"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.descripcion").exists());
	}

	@Test
	@DisplayName("Checklist: marca y desmarca una tarea personal")
	void marcaYDesmarcaUnaTareaPersonal() throws Exception {
		Long tareaId = crearTarea("Preparar la reunion");

		mockMvc.perform(patch("/api/mi-dia/tareas/" + tareaId)
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"completada\":true}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.completada").value(true));

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tareasPersonales[0].completada").value(true))
				.andExpect(jsonPath("$.pendientes").value(0))
				.andExpect(jsonPath("$.completadas").value(1))
				.andExpect(jsonPath("$.mensaje")
						.value("¡Todo al día por hoy! No tiene tareas pendientes."));

		mockMvc.perform(patch("/api/mi-dia/tareas/" + tareaId)
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"completada\":false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.completada").value(false));
	}

	@Test
	@DisplayName("Checklist: elimina una tarea personal y deja de aparecer")
	void eliminaUnaTareaPersonal() throws Exception {
		Long tareaId = crearTarea("Llamar al cliente");

		mockMvc.perform(delete("/api/mi-dia/tareas/" + tareaId)
				.with(csrf()).with(authentication(desarrollador)))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tareasPersonales").isEmpty())
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	@DisplayName("Checklist: no se pueden tocar las tareas personales de otro")
	void noPermiteTocarTareasDeOtros() throws Exception {
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9600000006", "Otro", "Dev",
				LocalDate.of(1990, 1, 1), "Calle 9", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		TareaMiDia ajena = tareas.saveAndFlush(new TareaMiDia(otro, "Tarea ajena", HOY));

		mockMvc.perform(patch("/api/mi-dia/tareas/" + ajena.getId())
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"completada\":true}"))
				.andExpect(status().isNotFound());

		mockMvc.perform(delete("/api/mi-dia/tareas/" + ajena.getId())
				.with(csrf()).with(authentication(desarrollador)))
				.andExpect(status().isNotFound());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tareasPersonales").isEmpty());
	}

	@Test
	@DisplayName("Checklist: marcar una actividad finaliza su ejecucion y desmarcarla la reabre")
	void marcaYDesmarcaUnaActividad() throws Exception {
		Actividad tarea = actividad(desarrolladorTrabajador, "Tarea del checklist",
				PrioridadActividad.ALTA, HOY);

		mockMvc.perform(patch("/api/mi-dia/actividades/" + tarea.getId())
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"completada\":true}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.completada").value(true));

		assertEquals(1, ejecuciones.findByActividadIdOrderByIniciadaEnDesc(tarea.getId()).size());
		assertNotNull(ejecuciones.findByActividadIdOrderByIniciadaEnDesc(tarea.getId())
				.get(0).getFinalizadaEn());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.actividades[0].completada").value(true))
				.andExpect(jsonPath("$.pendientes").value(0))
				.andExpect(jsonPath("$.completadas").value(1));

		mockMvc.perform(patch("/api/mi-dia/actividades/" + tarea.getId())
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"completada\":false}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.completada").value(false));

		assertNull(ejecuciones.findByActividadIdOrderByIniciadaEnDesc(tarea.getId())
				.get(0).getFinalizadaEn());

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pendientes").value(1))
				.andExpect(jsonPath("$.completadas").value(0));
	}

	@Test
	@DisplayName("Checklist: no se puede marcar una actividad asignada a otro")
	void noPermiteMarcarActividadesDeOtros() throws Exception {
		Trabajador otro = trabajadores.saveAndFlush(new Trabajador("9600000007", "Otro", "Dev",
				LocalDate.of(1990, 1, 1), "Calle 9", "Ingenieria", "Backend",
				TipoTrabajador.DESARROLLADOR));
		Actividad ajena = actividad(otro, "Tarea ajena", PrioridadActividad.ALTA, HOY);

		mockMvc.perform(patch("/api/mi-dia/actividades/" + ajena.getId())
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"completada\":true}"))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("Checklist: una tarea personal cuenta junto a las actividades en el avance")
	void sumaTareasYActividadesEnElAvance() throws Exception {
		actividad(desarrolladorTrabajador, "Actividad del proyecto",
				PrioridadActividad.MEDIA, HOY);
		crearTarea("Tarea personal");

		mockMvc.perform(get("/api/mi-dia").with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.pendientes").value(2))
				.andExpect(jsonPath("$.completadas").value(0))
				.andExpect(jsonPath("$.actividades").isArray())
				.andExpect(jsonPath("$.tareasPersonales").isArray());
	}

	// ----------------------------------------------------------- Autorizacion

	@Test
	@DisplayName("RN-05: un lider asignado como desarrollador tambien tiene su panel")
	void unLiderAsignadoComoDesarrolladorTieneSuPanel() throws Exception {
		Authentication liderAsignado = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9600000005", "lider.dev.midia@ikernell.com", TipoTrabajador.LIDER);
		Trabajador liderAsignadoTrabajador = trabajadores.findByIdentificacion("9600000005").orElseThrow();
		actividad(liderAsignadoTrabajador, "Tarea del lider como desarrollador",
				PrioridadActividad.ALTA, HOY);

		mockMvc.perform(get("/api/mi-dia").with(authentication(liderAsignado)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no hay panel")
	void sinSesionNoHayPanel() throws Exception {
		mockMvc.perform(get("/api/mi-dia"))
				.andExpect(status().isUnauthorized());
	}

}

package com.PROYECTO.IKERNELL.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.chat.domain.MensajeHilo;
import com.PROYECTO.IKERNELL.backend.proyectos.EtapaRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.EntityManager;

/**
 * Hilos de conversacion por proyecto y etapa: una prueba por condicion de
 * aceptacion de HU-22 (RF-037).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class HiloControllerTest {

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
	private MensajeHiloRepository mensajes;

	@Autowired
	private ServicioAsignaciones servicioAsignaciones;

	@Autowired
	private EntityManager entityManager;

	private MockMvc mockMvc;
	private Authentication desarrollador;
	private Authentication companero;
	private Trabajador liderTrabajador;
	private Proyecto proyecto;
	private Etapa etapa;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();

		AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000001", "lider.chat@ikernell.com", TipoTrabajador.LIDER);
		this.liderTrabajador = trabajadores.findByIdentificacion("9400000001").orElseThrow();
		this.proyecto = proyectos.saveAndFlush(
				new Proyecto("Proyecto con conversaciones", "d", liderTrabajador));
		this.etapa = etapas.saveAndFlush(new Etapa(proyecto, "Construccion", "d", 1));

		this.desarrollador = asignarA("9400000002", "dev.chat@ikernell.com");
		this.companero = asignarA("9400000003", "dev2.chat@ikernell.com");
	}

	/** Crea un trabajador y le da asignacion activa en el proyecto de la prueba. */
	private Authentication asignarA(String identificacion, String correo) {
		Authentication autenticacion = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				identificacion, correo, TipoTrabajador.DESARROLLADOR);
		Trabajador trabajador = trabajadores.findByIdentificacion(identificacion).orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(trabajador.getId(), proyecto.getId(), RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);
		return autenticacion;
	}

	private Long crearHilo(Authentication quien, String titulo, Long etapaId) throws Exception {
		String cuerpo = etapaId == null
				? "{\"titulo\":\"%s\"}".formatted(titulo)
				: "{\"titulo\":\"%s\",\"etapaId\":%d}".formatted(titulo, etapaId);
		String respuesta = mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(csrf()).with(authentication(quien))
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	private void enviar(Authentication quien, Long hiloId, String texto) throws Exception {
		mockMvc.perform(post("/api/hilos/" + hiloId + "/mensajes")
				.with(csrf()).with(authentication(quien))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"cuerpo\":\"%s\"}".formatted(texto)))
				.andExpect(status().isCreated());
	}

	// --------------------------------------------------------------- HU-22 C01

	@Test
	@DisplayName("HU-22 C01: con acceso al proyecto, se ven los hilos disponibles")
	void muestraLosHilosDelProyecto() throws Exception {
		crearHilo(desarrollador, "Duda sobre el modelo de datos", null);

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Duda sobre el modelo de datos"))
				.andExpect(jsonPath("$.contenido[0].proyectoId").value(proyecto.getId()))
				.andExpect(jsonPath("$.mensaje").doesNotExist());
	}

	@Test
	@DisplayName("HU-22 C01: sin conversaciones devuelve el aviso y no una lista vacia (RN-14)")
	void avisaCuandoNoHayHilos() throws Exception {
		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje")
						.value("Este proyecto todavia no tiene conversaciones registradas."));
	}

	@Test
	@DisplayName("HU-22 C01: no se ven los hilos de un proyecto en el que no participa")
	void noMuestraLosHilosDeOtroProyecto() throws Exception {
		Proyecto ajeno = proyectos.saveAndFlush(new Proyecto("Proyecto ajeno", "d", liderTrabajador));

		mockMvc.perform(get("/api/proyectos/" + ajeno.getId() + "/hilos")
				.with(authentication(desarrollador)))
				.andExpect(status().isForbidden());
	}

	// --------------------------------------------------------------- HU-22 C02

	@Test
	@DisplayName("HU-22 C02: el mensaje se guarda en el hilo, con su autor y su fecha")
	void guardaElMensajeConAutorYFecha() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Decision sobre el cache", null);
		Trabajador autor = trabajadores.findByIdentificacion("9400000002").orElseThrow();

		mockMvc.perform(post("/api/hilos/" + hiloId + "/mensajes")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"cuerpo\":\"Propongo invalidar por evento\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.hiloId").value(hiloId))
				.andExpect(jsonPath("$.autorId").value(autor.getId()))
				.andExpect(jsonPath("$.autorNombreCompleto").value(autor.nombreCompleto()))
				.andExpect(jsonPath("$.cuerpo").value("Propongo invalidar por evento"))
				.andExpect(jsonPath("$.enviadoEn").exists());

		assertThat(mensajes.findByHiloIdOrderByEnviadoEnAsc(hiloId)).hasSize(1);
	}

	@Test
	@DisplayName("HU-22 C02: un mensaje vacio no se guarda e indica el dato faltante")
	void rechazaElMensajeVacio() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo sin mensajes", null);

		mockMvc.perform(post("/api/hilos/" + hiloId + "/mensajes")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON).content("{\"cuerpo\":\"  \"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.cuerpo").exists());

		assertThat(mensajes.findByHiloIdOrderByEnviadoEnAsc(hiloId)).isEmpty();
	}

	@Test
	@DisplayName("HU-22 C02: el autor lo pone el servidor, no el cliente")
	void elAutorSaleDeLaSesion() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo del equipo", null);
		Trabajador otro = trabajadores.findByIdentificacion("9400000003").orElseThrow();

		// Se intenta atribuir el mensaje a otra persona: el campo se ignora.
		mockMvc.perform(post("/api/hilos/" + hiloId + "/mensajes")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"cuerpo\":\"Mensaje propio\",\"autorId\":%d}".formatted(otro.getId())))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.autorId")
						.value(trabajadores.findByIdentificacion("9400000002").orElseThrow().getId()));
	}

	// --------------------------------------------------------------- HU-22 C03

	@Test
	@DisplayName("HU-22 C03: el hilo creado sobre una etapa queda vinculado a ella")
	void vinculaElHiloALaEtapa() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"Consulta de construccion\",\"etapaId\":%d}"
						.formatted(etapa.getId())))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.etapaId").value(etapa.getId()))
				.andExpect(jsonPath("$.etapaNombre").value("Construccion"));
	}

	@Test
	@DisplayName("HU-22 C03: se pueden consultar solo los hilos de una etapa")
	void filtraLosHilosPorEtapa() throws Exception {
		crearHilo(desarrollador, "Hilo del proyecto", null);
		crearHilo(desarrollador, "Hilo de la etapa", etapa.getId());

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/hilos")
				.param("etapaId", String.valueOf(etapa.getId()))
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].titulo").value("Hilo de la etapa"));
	}

	@Test
	@DisplayName("HU-22 C03: un hilo sin etapa es del proyecto y no inventa una")
	void elHiloSinEtapaEsDelProyecto() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo general", null);

		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.etapaId").doesNotExist())
				.andExpect(jsonPath("$.etapaNombre").doesNotExist());
	}

	@Test
	@DisplayName("D-36: la etapa del hilo tiene que ser una de su propio proyecto")
	void rechazaUnaEtapaDeOtroProyecto() throws Exception {
		Proyecto ajeno = proyectos.saveAndFlush(new Proyecto("Otro proyecto", "d", liderTrabajador));
		Etapa etapaAjena = etapas.saveAndFlush(new Etapa(ajeno, "Etapa ajena", "d", 1));

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"Hilo tramposo\",\"etapaId\":%d}".formatted(etapaAjena.getId())))
				.andExpect(status().isNotFound());
	}

	// --------------------------------------------------------------- HU-22 C04

	@Test
	@DisplayName("HU-22 C04: quien no esta asignado al proyecto no accede a sus hilos")
	void impideElAccesoAQuienNoParticipa() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo reservado", null);
		Authentication ajeno = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000004", "dev.ajeno.chat@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(ajeno)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/hilos/" + hiloId + "/mensajes").with(authentication(ajeno)))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("HU-22 C04: quien no esta asignado tampoco escribe ni crea hilos")
	void impideEscribirAQuienNoParticipa() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo reservado", null);
		Authentication ajeno = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000005", "dev.ajeno2.chat@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/hilos/" + hiloId + "/mensajes")
				.with(csrf()).with(authentication(ajeno))
				.contentType(MediaType.APPLICATION_JSON).content("{\"cuerpo\":\"Intento\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(csrf()).with(authentication(ajeno))
				.contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"Intento\"}"))
				.andExpect(status().isForbidden());

		assertThat(mensajes.findByHiloIdOrderByEnviadoEnAsc(hiloId)).isEmpty();
	}

	@Test
	@DisplayName("HU-22 C04 y RN-05: el permiso es la asignacion, no el tipo de trabajador")
	void elPermisoEsLaAsignacionYNoElTipo() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo del equipo", null);

		// Un coordinador, el tipo con mas permisos de gestion, no participa en el
		// proyecto y por tanto no entra en sus conversaciones.
		Authentication coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000006", "coord.chat@ikernell.com", TipoTrabajador.COORDINADOR);
		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(coordinador)))
				.andExpect(status().isForbidden());

		// Un lider asignado como desarrollador si entra, igual que cualquier otro
		// miembro del equipo.
		Authentication liderAsignado = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9400000007", "lider.asignado.chat@ikernell.com", TipoTrabajador.LIDER);
		Trabajador liderAsignadoTrabajador = trabajadores.findByIdentificacion("9400000007").orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(liderAsignadoTrabajador.getId(), proyecto.getId(),
						RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);

		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(liderAsignado)))
				.andExpect(status().isOk());
	}

	// --------------------------------------------------------------- HU-22 C05

	@Test
	@DisplayName("HU-22 C05: el hilo muestra sus mensajes en el orden en que se enviaron")
	void muestraElHistorialDelHilo() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Decisiones tecnicas", null);
		enviar(desarrollador, hiloId, "Primero");
		enviar(companero, hiloId, "Segundo");

		mockMvc.perform(get("/api/hilos/" + hiloId + "/mensajes")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.contenido[0].cuerpo").value("Primero"))
				.andExpect(jsonPath("$.contenido[1].cuerpo").value("Segundo"));
	}

	@Test
	@DisplayName("HU-22 C05: un hilo sin mensajes devuelve el aviso, no una lista vacia")
	void avisaCuandoElHiloNoTieneMensajes() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo nuevo", null);

		mockMvc.perform(get("/api/hilos/" + hiloId + "/mensajes")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("Este hilo todavia no tiene mensajes."));
	}

	// ------------------------------------------------------- No leidos (RF-038)

	@Test
	@DisplayName("RF-038: los mensajes de otros cuentan como no leidos y los propios no")
	void cuentaLosNoLeidosAjenos() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo con novedades", null);
		enviar(desarrollador, hiloId, "Mio");
		enviar(companero, hiloId, "Ajeno uno");
		enviar(companero, hiloId, "Ajeno dos");

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/hilos")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contenido[0].totalMensajes").value(3))
				.andExpect(jsonPath("$.contenido[0].noLeidos").value(2));
	}

	@Test
	@DisplayName("RF-038: consultar el hilo deja en cero sus no leidos")
	void leerElHiloPoneLosNoLeidosEnCero() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo leido", null);
		enviar(companero, hiloId, "Novedad");

		mockMvc.perform(get("/api/hilos/" + hiloId + "/mensajes")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.noLeidos").value(0));
	}

	@Test
	@DisplayName("RF-038: un mensaje posterior a la lectura vuelve a contar como no leido")
	void unMensajeNuevoVuelveAContar() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo activo", null);
		enviar(companero, hiloId, "Primera novedad");
		mockMvc.perform(get("/api/hilos/" + hiloId + "/mensajes")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk());

		enviar(companero, hiloId, "Segunda novedad");

		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.noLeidos").value(1));
	}

	// ----------------------------------------------------------------- Tecnicas

	@Test
	@DisplayName("open-in-view=false: los mensajes llegan con autor e hilo cargados")
	void losMensajesLleganConSusRelacionesCargadas() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo para comprobar cargas", null);
		enviar(desarrollador, hiloId, "Mensaje");
		entityManager.clear();

		// El controlador lee el nombre del autor y el id del hilo fuera de la
		// sesion de persistencia; un proxy sin inicializar romperia la peticion.
		MensajeHilo mensaje = mensajes.findByHiloIdOrderByEnviadoEnAsc(hiloId).get(0);
		assertThat(Hibernate.isInitialized(mensaje.getAutor())).isTrue();
		assertThat(Hibernate.isInitialized(mensaje.getHilo())).isTrue();
	}

	@Test
	@DisplayName("RN-02: un proyecto inhabilitado conserva sus conversaciones")
	void unProyectoInhabilitadoConservaSusHilos() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo historico", null);
		enviar(desarrollador, hiloId, "Mensaje antiguo");
		proyecto.inhabilitar();
		proyectos.saveAndFlush(proyecto);

		mockMvc.perform(get("/api/hilos/" + hiloId + "/mensajes")
				.with(authentication(desarrollador)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1));
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no se accede a las conversaciones")
	void sinSesionNoHayConversaciones() throws Exception {
		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/hilos"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("Un hilo inexistente da 404, no 403")
	void hiloInexistenteDa404() throws Exception {
		mockMvc.perform(get("/api/hilos/999999").with(authentication(desarrollador)))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("El trabajador inhabilitado pierde el acceso a las conversaciones")
	void elTrabajadorInhabilitadoPierdeElAcceso() throws Exception {
		Long hiloId = crearHilo(desarrollador, "Hilo del equipo", null);
		Trabajador devTrabajador = trabajadores.findByIdentificacion("9400000002").orElseThrow();
		devTrabajador.inhabilitar();
		trabajadores.saveAndFlush(devTrabajador);

		// participaEnProyecto exige que el trabajador siga habilitado, igual que el
		// resto del nivel 2: quien ya no pertenece a la empresa no usa los
		// servicios internos (RF-007).
		mockMvc.perform(get("/api/hilos/" + hiloId).with(authentication(desarrollador)))
				.andExpect(status().isForbidden());
	}

}

package com.PROYECTO.IKERNELL.backend.incidencias;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


import java.math.BigDecimal;
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

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.RegistroInterrupcionRequest;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.RegistroErrorRequest;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.UnidadDuracion;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.ErrorProyecto;
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
 * Errores e interrupciones: una prueba por condicion de aceptacion de HU-17 y
 * HU-18 (RF-023, RF-024).
 *
 * <p>Verifica tambien la decision D-36: la fase de una incidencia ES una etapa
 * del proyecto, y tiene que ser una de las de SU proyecto.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class IncidenciaControllerTest {

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
	private ErrorProyectoRepository errores;

	@Autowired
	private ServicioAsignaciones servicioAsignaciones;

	@Autowired
	private ServicioIncidencias servicioIncidencias;

	@Autowired
	private EntityManager entityManager;

	private MockMvc mockMvc;
	private Authentication desarrollador;
	private Authentication lider;
	private Proyecto proyecto;
	private Etapa etapaPruebas;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();

		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9200000001", "lider.inc@ikernell.com", TipoTrabajador.LIDER);
		Trabajador liderTrabajador = trabajadores.findByIdentificacion("9200000001").orElseThrow();
		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto con incidencias", "d", liderTrabajador));

		this.desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9200000002", "dev.inc@ikernell.com", TipoTrabajador.DESARROLLADOR);
		Trabajador devTrabajador = trabajadores.findByIdentificacion("9200000002").orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(devTrabajador.getId(), proyecto.getId(), RolEnProyecto.DESARROLLADOR),
				liderTrabajador, false);

		this.etapaPruebas = etapas.saveAndFlush(new Etapa(proyecto, "Pruebas", "d", 4));
	}

	private String cuerpoError(String tipo, Long etapaId) {
		return "{\"tipoError\":\"%s\",\"etapaId\":%s}".formatted(tipo, etapaId);
	}

	private String cuerpoInterrupcion(String tipo, String fecha, String duracion, String unidad, Long etapaId) {
		return """
				{"tipoInterrupcion":"%s","fecha":"%s","duracionValor":%s,"duracionUnidad":"%s","etapaId":%s}
				""".formatted(tipo, fecha, duracion, unidad, etapaId);
	}

	// ------------------------------------------------------------ D-36

	@Test
	@DisplayName("D-36: la etapa de la incidencia tiene que ser una de su propio proyecto")
	void rechazaUnaEtapaDeOtroProyecto() throws Exception {
		Proyecto ajeno = proyectos.saveAndFlush(new Proyecto("Proyecto ajeno", "d", null));
		Etapa etapaAjena = etapas.saveAndFlush(new Etapa(ajeno, "Etapa ajena", "d", 1));

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaAjena.getId())))
				.andExpect(status().isNotFound());

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoInterrupcion("FALLA", "2026-10-15", "3", "HORAS", etapaAjena.getId())))
				.andExpect(status().isNotFound());
	}

	// ------------------------------------------------------------- HU-17

	@Test
	@DisplayName("HU-17 C01: con tipo y etapa el error se guarda asociado al proyecto")
	void registraElError() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.proyectoId").value(proyecto.getId()))
				.andExpect(jsonPath("$.tipoError").value("VALIDACION"))
				.andExpect(jsonPath("$.etapaNombre").value("Pruebas"));
	}

	@Test
	@DisplayName("HU-17 C02: sin tipo o sin etapa no guarda e indica el dato faltante")
	void rechazaErrorSinTipoNiEtapa() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipoError\":\"\",\"etapaId\":null}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.tipoError").exists())
				.andExpect(jsonPath("$.campos.etapaId").exists());

		assertThat(errores.countByProyectoId(proyecto.getId())).isZero();
	}

	@Test
	@DisplayName("HU-17 C03: un proyecto inexistente impide guardar el error")
	void rechazaErrorSinProyectoValido() throws Exception {
		mockMvc.perform(post("/api/proyectos/999999/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("HU-17 C01: la descripcion y la fecha son opcionales mientras la empresa no las exija")
	void aceptaErrorConDatosOpcionales() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipoError":"LOGICA","etapaId":%d,"descripcion":"Calculo incorrecto","fecha":"2026-10-20"}
						""".formatted(etapaPruebas.getId())))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.descripcion").value("Calculo incorrecto"))
				.andExpect(jsonPath("$.fecha").value("2026-10-20"));
	}

	@Test
	@DisplayName("RF-023: una etapa inexistente impide guardar el error")
	void rechazaEtapaInexistente() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", 999999L)))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("HU-17 C05: un coordinador no puede registrar errores")
	void unCoordinadorNoRegistraErrores() throws Exception {
		Authentication coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9200000003", "coord.inc@ikernell.com", TipoTrabajador.COORDINADOR);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("HU-17 C05: el lider del proyecto tampoco registra errores si no esta asignado como desarrollador")
	void elLiderNoRegistraErrores() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("C-06 y RN-05: un lider asignado como desarrollador SI registra errores en ese proyecto")
	void unLiderAsignadoComoDesarrolladorRegistraErrores() throws Exception {
		Authentication otroLider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9200000004", "lider.dev.inc@ikernell.com", TipoTrabajador.LIDER);
		Trabajador otroLiderTrabajador = trabajadores.findByIdentificacion("9200000004").orElseThrow();
		Trabajador liderDelProyecto = trabajadores.findByIdentificacion("9200000001").orElseThrow();
		servicioAsignaciones.asignarTrabajador(
				new AsignacionRequest(otroLiderTrabajador.getId(), proyecto.getId(),
						RolEnProyecto.DESARROLLADOR),
				liderDelProyecto, false);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(otroLider))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("INTEGRACION", etapaPruebas.getId())))
				.andExpect(status().isCreated());
	}

	// ------------------------------------------------------------- HU-18

	@Test
	@DisplayName("HU-18 C01: con tipo, fecha, duracion y etapa la interrupcion se guarda")
	void registraLaInterrupcion() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoInterrupcion("FALLA_ELECTRICA", "2026-10-15", "4.5", "HORAS",
						etapaPruebas.getId())))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.tipoInterrupcion").value("FALLA_ELECTRICA"))
				.andExpect(jsonPath("$.fecha").value("2026-10-15"))
				.andExpect(jsonPath("$.duracionValor").value(4.5))
				.andExpect(jsonPath("$.duracionUnidad").value("HORAS"))
				.andExpect(jsonPath("$.etapaNombre").value("Pruebas"));
	}

	@Test
	@DisplayName("HU-18 C02: los cuatro datos son obligatorios (RN-10)")
	void losCuatroDatosSonObligatorios() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"tipoInterrupcion":"","fecha":null,"duracionValor":null,
						 "duracionUnidad":null,"etapaId":null}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.tipoInterrupcion").exists())
				.andExpect(jsonPath("$.campos.fecha").exists())
				.andExpect(jsonPath("$.campos.duracionValor").exists())
				.andExpect(jsonPath("$.campos.duracionUnidad").exists())
				.andExpect(jsonPath("$.campos.etapaId").exists());
	}

	@Test
	@DisplayName("HU-18 C03: un proyecto inexistente impide guardar la interrupcion")
	void rechazaInterrupcionSinProyectoValido() throws Exception {
		mockMvc.perform(post("/api/proyectos/999999/interrupciones")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoInterrupcion("FALLA", "2026-10-15", "2", "DIAS", etapaPruebas.getId())))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("HU-18 C04: la interrupcion registrada aparece en la consulta del lider con sus cuatro datos")
	void laInterrupcionQuedaDisponibleParaElLider() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoInterrupcion("CORTE_INTERNET", "2026-10-18", "3", "HORAS",
						etapaPruebas.getId())))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].tipoInterrupcion").value("CORTE_INTERNET"))
				.andExpect(jsonPath("$.contenido[0].fecha").value("2026-10-18"))
				.andExpect(jsonPath("$.contenido[0].duracionValor").value(3))
				.andExpect(jsonPath("$.contenido[0].etapaNombre").value("Pruebas"));
	}

	@Test
	@DisplayName("HU-18 C04: sin interrupciones la consulta devuelve un aviso")
	void avisaCuandoNoHayInterrupciones() throws Exception {
		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(0))
				.andExpect(jsonPath("$.mensaje").value("El proyecto no tiene interrupciones registradas."));
	}

	@Test
	@DisplayName("HU-18 C05: un coordinador no puede registrar interrupciones")
	void unCoordinadorNoRegistraInterrupciones() throws Exception {
		Authentication coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9200000005", "coord.int@ikernell.com", TipoTrabajador.COORDINADOR);

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(csrf()).with(authentication(coordinador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoInterrupcion("FALLA", "2026-10-15", "2", "DIAS", etapaPruebas.getId())))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("RF-024: la duracion debe ser mayor que cero")
	void rechazaDuracionNoPositiva() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/interrupciones")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoInterrupcion("FALLA", "2026-10-15", "0", "HORAS", etapaPruebas.getId())))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.duracionValor").exists());
	}

	// ------------------------------------------------------- RF-016 y vacios

	@Test
	@DisplayName("RF-016: errores e interrupciones aparecen como datos disponibles del proyecto")
	void lasIncidenciasAparecenEnElEstadoDelProyecto() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/estado").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.datosDisponibles.erroresRegistrados").value(1))
				.andExpect(jsonPath("$.datosDisponibles.interrupcionesRegistradas").value(0))
				.andExpect(jsonPath("$.datosDisponibles.etapasRegistradas").value(1))
				// CONSECUENCIA DE D-36: antes se comprobaba aqui que un error no es
				// dato de avance, porque el proyecto podia tener un error y ninguna
				// etapa. Ya no puede: la etapa es la fase que RN-10 exige indicar, de
				// modo que todo proyecto con una incidencia tiene al menos una etapa y
				// el aviso de HU-12 C02 nunca coincide con una incidencia. Ese criterio
				// se verifica donde ahora si es observable, en ProyectoControllerTest.
				.andExpect(jsonPath("$.mensajeAvance").doesNotExist());
	}

	@Test
	@DisplayName("Vacio de requisitos: los errores registrados son recuperables por el lider")
	void losErroresSonRecuperables() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/errores").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.contenido[0].tipoError").value("VALIDACION"));
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no se registra ninguna incidencia")
	void sinSesionNoHayRegistro() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("RN-02: inhabilitar un proyecto conserva sus incidencias historicas")
	void lasIncidenciasSobrevivenALaInhabilitacion() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/errores")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoError("VALIDACION", etapaPruebas.getId())))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/inhabilitacion")
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isOk());

		assertThat(errores.countByProyectoId(proyecto.getId())).isEqualTo(1);
	}

	@Test
	@DisplayName("open-in-view=false: errores e interrupciones llegan con proyecto y etapa cargados")
	void lasIncidenciasLleganConSusRelacionesCargadas() throws Exception {
		Trabajador dev = trabajadores.findByIdentificacion("9200000002").orElseThrow();
		servicioIncidencias.registrarError(proyecto.getId(),
				new RegistroErrorRequest("Validacion", etapaPruebas.getId(), "d", LocalDate.now()),
				dev.getId());
		servicioIncidencias.registrarInterrupcion(proyecto.getId(),
				new RegistroInterrupcionRequest("Corte", LocalDate.now(), new BigDecimal("2.5"),
						UnidadDuracion.HORAS, etapaPruebas.getId()),
				dev.getId());

		// Sin vaciar el contexto, las entidades ya cargadas resolverian las
		// relaciones desde la cache de primer nivel y la comprobacion no
		// probaria nada.
		entityManager.flush();
		entityManager.clear();

		// El controlador lee el nombre del proyecto y el de la etapa fuera de la
		// transaccion; con proxies sin inicializar responde 500. Una prueba
		// @Transactional que mire el JSON no lo detecta, porque su transaccion
		// mantiene la sesion abierta.
		List<ErrorProyecto> listaErrores = servicioIncidencias.erroresDeProyecto(proyecto.getId());
		assertThat(listaErrores).isNotEmpty();
		assertThat(Hibernate.isInitialized(listaErrores.get(0).getProyecto())).isTrue();
		assertThat(Hibernate.isInitialized(listaErrores.get(0).getEtapa())).isTrue();

		entityManager.clear();

		List<InterrupcionProyecto> listaInterrupciones =
				servicioIncidencias.interrupcionesDeProyecto(proyecto.getId());
		assertThat(listaInterrupciones).isNotEmpty();
		assertThat(Hibernate.isInitialized(listaInterrupciones.get(0).getProyecto())).isTrue();
		assertThat(Hibernate.isInitialized(listaInterrupciones.get(0).getEtapa())).isTrue();
	}

}

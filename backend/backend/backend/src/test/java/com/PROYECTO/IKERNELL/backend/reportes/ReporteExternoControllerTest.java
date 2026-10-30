package com.PROYECTO.IKERNELL.backend.reportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.actividades.ActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;
import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.EtapaRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.reportes.externo.AuditoriaReporteExternoRepository;
import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.AuditoriaReporteExterno;
import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.ResultadoAuditoriaReporteExterno;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Reporte externo para la empresa brasileña (RF-025, HU-19).
 *
 * <p>Comprueba lo que la historia determina: quien puede generarlo (C05), que
 * solo salgan proyectos autorizados (C01), que sin informacion se avise en
 * lugar de entregar un archivo vacio (C03), que un fallo no produzca un archivo
 * parcial (C04) y que no se filtren datos personales (D-43).
 *
 * <p>C02 -"el archivo cumple la estructura acordada"- no se puede comprobar
 * todavia: esa estructura es justamente lo que HU-19 T1 deja pendiente de
 * acordar. Lo que si se comprueba es que el archivo respete el formato, el
 * separador y la codificacion CONFIGURADOS, de modo que cuando el acuerdo llegue
 * baste ajustar la configuracion.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReporteExternoControllerTest {

	private static final String CABECERA = "proyecto_id|proyecto_nombre|estado_habilitacion|"
			+ "estado_operativo|fecha_inicio_real|fecha_fin_real|etapas_registradas|"
			+ "actividades_registradas|ejecuciones_registradas|ejecuciones_finalizadas|"
			+ "errores_registrados|interrupciones_registradas|primera_ejecucion|ultima_ejecucion";

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
	private AuditoriaReporteExternoRepository auditorias;

	private MockMvc mockMvc;
	private Authentication lider;
	private Trabajador desarrollador;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000001", "lider.reporte@ikernell.com", TipoTrabajador.LIDER);
		this.desarrollador = trabajadores.saveAndFlush(new Trabajador(
				"DOC-PII-999", "NombreSecreto", "ApellidoSecreto", LocalDate.of(1990, 1, 1),
				"Calle PII 123", "Ingenieria de sistemas", "Backend",
				TipoTrabajador.DESARROLLADOR));
	}

	@Test
	@DisplayName("HU-19 C01: el archivo incluye solo los proyectos autorizados")
	void generaElArchivoSoloConProyectosAutorizados() throws Exception {
		Proyecto autorizado = proyecto("Portal documental", true);
		Proyecto noAutorizado = proyecto("App interna", false);
		ejecutar(autorizado, "Trabajo ordinario");
		ejecutar(noAutorizado, "Trabajo ordinario");

		MvcResult resultado = mockMvc.perform(
				get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Disposition",
						containsString("attachment")))
				.andExpect(header().string("Content-Disposition", containsString(".txt")))
				.andExpect(content().contentTypeCompatibleWith("text/plain"))
				.andReturn();

		String contenido = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
		List<String> lineas = lineas(contenido);

		assertThat(lineas).hasSize(2);
		assertThat(lineas.get(0)).isEqualTo(CABECERA);
		assertThat(contenido).contains(autorizado.getId() + "|Portal documental|");
		assertThat(contenido).doesNotContain("App interna");

		String[] campos = lineas.get(1).split("\\|", -1);
		assertThat(campos).hasSize(14);
		// Conteos reales de ejecucion: una ejecucion y ninguna finalizada.
		assertThat(campos[8]).isEqualTo("1");
		assertThat(campos[9]).isEqualTo("0");
		assertThat(campos[12]).isNotBlank();
		assertThat(campos[13]).isNotBlank();
	}

	@Test
	@DisplayName("HU-19 C01: se pueden elegir los proyectos a incluir")
	void incluyeSoloLosProyectosElegidos() throws Exception {
		Proyecto incluido = proyecto("Proyecto incluido", true);
		Proyecto excluido = proyecto("Proyecto excluido", true);
		ejecutar(incluido, "Trabajo");
		ejecutar(excluido, "Trabajo");

		MvcResult resultado = mockMvc.perform(get("/api/reportes/externos/archivo")
				.param("proyectoIds", String.valueOf(incluido.getId()))
				.with(authentication(lider)))
				.andExpect(status().isOk())
				.andReturn();

		String contenido = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);
		assertThat(contenido).contains("Proyecto incluido");
		assertThat(contenido).doesNotContain("Proyecto excluido");
		assertThat(lineas(contenido)).hasSize(2);
	}

	@Test
	@DisplayName("HU-19 C03: sin proyectos autorizados se avisa, no se entrega un archivo vacio")
	void avisaCuandoNoHayProyectosAutorizados() throws Exception {
		proyecto("Proyecto no autorizado", false);

		mockMvc.perform(get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje", containsString("No hay proyectos autorizados")));
	}

	@Test
	@DisplayName("HU-19 C03: proyectos autorizados sin ejecucion no producen archivo")
	void avisaCuandoNoHayDatosDeEjecucion() throws Exception {
		proyecto("Proyecto sin ejecucion", true);

		mockMvc.perform(get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensaje", containsString("no tienen datos de ejecucion")));
	}

	@Test
	@DisplayName("HU-19 C01: pedir un proyecto no autorizado responde 403 y no exporta nada")
	void rechazaUnProyectoNoAutorizado() throws Exception {
		Proyecto autorizado = proyecto("Autorizado", true);
		Proyecto noAutorizado = proyecto("No autorizado", false);
		ejecutar(autorizado, "Trabajo");
		ejecutar(noAutorizado, "Trabajo");

		mockMvc.perform(get("/api/reportes/externos/archivo")
				.param("proyectoIds", String.valueOf(noAutorizado.getId()))
				.with(authentication(lider)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.mensaje", containsString("no esta autorizado")));
	}

	@Test
	@DisplayName("D-43: el archivo no contiene nombres, documentos, correos ni observaciones")
	void noIncluyeDatosPersonales() throws Exception {
		Proyecto autorizado = proyecto("Proyecto con PII", true);
		ejecutar(autorizado, "OBSERVACION-PII-SECRETA");

		MvcResult resultado = mockMvc.perform(
				get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isOk())
				.andReturn();

		String contenido = resultado.getResponse().getContentAsString(StandardCharsets.UTF_8);

		assertThat(contenido)
				.doesNotContain("NombreSecreto")
				.doesNotContain("ApellidoSecreto")
				.doesNotContain("DOC-PII-999")
				.doesNotContain("Calle PII 123")
				.doesNotContain("OBSERVACION-PII-SECRETA");
	}

	@Test
	@DisplayName("RF-025: un nombre con el separador no parte la fila en dos")
	void unNombreConElSeparadorNoRompeLaEstructura() throws Exception {
		Proyecto autorizado = proyecto("Portal | de documentos", true);
		ejecutar(autorizado, "Trabajo");

		MvcResult resultado = mockMvc.perform(
				get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isOk())
				.andReturn();

		String fila = lineas(resultado.getResponse().getContentAsString(StandardCharsets.UTF_8))
				.get(1);

		assertThat(fila.split("\\|", -1)).hasSize(14);
		assertThat(fila).contains("Portal de documentos");
	}

	@Test
	@DisplayName("HU-19 C05: un desarrollador no puede generar el reporte")
	void unDesarrolladorNoGeneraElReporte() throws Exception {
		Authentication otro = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000002", "dev.reporte@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(get("/api/reportes/externos/archivo").with(authentication(otro)))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("HU-19 C05: un coordinador no puede generar el reporte")
	void unCoordinadorNoGeneraElReporte() throws Exception {
		Authentication coordinador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9300000003", "coord.reporte@ikernell.com", TipoTrabajador.COORDINADOR);

		mockMvc.perform(get("/api/reportes/externos/archivo").with(authentication(coordinador)))
				.andExpect(status().isForbidden());
	}

	@Test
	@DisplayName("RF-025: el intento exitoso queda auditado con proyectos y formato")
	void registraElIntentoExitosoEnLaAuditoria() throws Exception {
		Proyecto autorizado = proyecto("Proyecto auditado", true);
		ejecutar(autorizado, "Trabajo");

		mockMvc.perform(get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isOk());

		AuditoriaReporteExterno intento = ultimoIntento();
		assertThat(intento.getResultado()).isEqualTo(ResultadoAuditoriaReporteExterno.EXITOSO);
		assertThat(intento.getProyectosIncluidos()).isEqualTo(String.valueOf(autorizado.getId()));
		assertThat(intento.getFormato()).isEqualTo("DELIMITADO");
		assertThat(intento.getCodificacion()).isEqualTo("UTF-8");
		assertThat(intento.getNombreArchivo()).contains("ikernell-reporte-externo");
		assertThat(intento.getTotalRegistros()).isEqualTo(1);
		assertThat(intento.getCorreo()).isEqualTo("lider.reporte@ikernell.com");
		assertThat(intento.getMensajeError()).isNull();
	}

	@Test
	@DisplayName("HU-19 C04: el intento fallido tambien queda auditado, con su mensaje")
	void registraElIntentoFallidoEnLaAuditoria() throws Exception {
		Proyecto noAutorizado = proyecto("Proyecto cerrado", false);
		ejecutar(noAutorizado, "Trabajo");

		mockMvc.perform(get("/api/reportes/externos/archivo")
				.param("proyectoIds", String.valueOf(noAutorizado.getId()))
				.with(authentication(lider)))
				.andExpect(status().isForbidden());

		AuditoriaReporteExterno intento = ultimoIntento();
		assertThat(intento.getResultado()).isEqualTo(ResultadoAuditoriaReporteExterno.FALLIDO);
		assertThat(intento.getMensajeError()).contains("no esta autorizado");
		assertThat(intento.getNombreArchivo()).isNull();
	}

	@Test
	@DisplayName("RF-025: el listado de proyectos solo devuelve los autorizados")
	void soloListaLosProyectosAutorizados() throws Exception {
		Proyecto autorizado = proyecto("Visible", true);
		proyecto("Oculto", false);

		mockMvc.perform(get("/api/reportes/externos/proyectos").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(autorizado.getId()))
				.andExpect(jsonPath("$[0].tieneDatosEjecucion").value(false));
	}

	@Test
	@DisplayName("HU-19 C02: la configuracion expone formato, campos y lo que falta acordar")
	void exponeLaConfiguracionYLosParametrosPendientes() throws Exception {
		mockMvc.perform(get("/api/reportes/externos/configuracion").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.formato").value("DELIMITADO"))
				.andExpect(jsonPath("$.separador").value("|"))
				.andExpect(jsonPath("$.codificacion").value("UTF-8"))
				.andExpect(jsonPath("$.incluirCabecera").value(true))
				.andExpect(jsonPath("$.campos.length()").value(14))
				.andExpect(jsonPath("$.parametrosPendientes.length()").value(10));
	}

	@Test
	@DisplayName("RF-025: el historial de auditoria es visible para el lider")
	void exponeElHistorialDeAuditoria() throws Exception {
		Proyecto autorizado = proyecto("Proyecto historial", true);
		ejecutar(autorizado, "Trabajo");

		mockMvc.perform(get("/api/reportes/externos/archivo").with(authentication(lider)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/reportes/externos/auditoria").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].resultado").value("EXITOSO"))
				.andExpect(jsonPath("$[0].correo").value("lider.reporte@ikernell.com"));
	}

	private Proyecto proyecto(String nombre, boolean autorizado) {
		Proyecto proyecto = new Proyecto(nombre, "descripcion", null);
		proyecto.autorizarReporteExterno(autorizado);
		return proyectos.saveAndFlush(proyecto);
	}

	private void ejecutar(Proyecto proyecto, String observaciones) {
		Etapa etapa = etapas.saveAndFlush(new Etapa(proyecto, "Etapa", "descripcion", 1));
		Actividad actividad = actividades.saveAndFlush(
				new Actividad(etapa, desarrollador, "Actividad", null, null));
		ejecuciones.saveAndFlush(new EjecucionActividad(actividad, desarrollador, observaciones));
	}

	private List<String> lineas(String contenido) {
		return contenido.strip().lines().toList();
	}

	private AuditoriaReporteExterno ultimoIntento() {
		return auditorias.findAll().stream()
				.max((uno, otro) -> uno.getId().compareTo(otro.getId()))
				.orElseThrow();
	}

}

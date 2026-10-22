package com.PROYECTO.IKERNELL.backend.auth;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;

/**
 * Inicio de sesion de los trabajadores: un metodo por cada condicion de
 * aceptacion de HU-03 (RF-027, RNF-001).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

	private static final String CORREO = "lider.prueba@ikernell.com";
	private static final String PASSWORD = "Clave12345";

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private MockMvc mockMvc;

	@BeforeEach
	void prepararEntorno() {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
	}

	private Trabajador registrarTrabajador(String identificacion, TipoTrabajador tipo) {
		Trabajador trabajador = new Trabajador(identificacion, "Ana", "Perez", LocalDate.of(1995, 5, 20),
				"Calle 1 # 2-3", "Ingenieria de sistemas", "Backend", tipo);
		return trabajadores.save(trabajador);
	}

	private void registrarCuenta(Trabajador trabajador, String correo) {
		cuentas.save(new CuentaAcceso(trabajador, correo, passwordEncoder.encode(PASSWORD)));
	}

	private String cuerpoLogin(String correo, String password) {
		return "{\"correoCorporativo\":\"" + correo + "\",\"password\":\"" + password + "\"}";
	}

	@Test
	@DisplayName("HU-03 C01: credenciales correctas y cuenta habilitada abren la sesion")
	void credencialesCorrectasAbrenSesion() throws Exception {
		Trabajador trabajador = registrarTrabajador("2000000001", TipoTrabajador.LIDER);
		registrarCuenta(trabajador, CORREO);

		mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin(CORREO, PASSWORD)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.correoCorporativo").value(CORREO))
				.andExpect(jsonPath("$.tipoTrabajador").value("LIDER"));
	}

	@Test
	@DisplayName("HU-03 C02: la sesion informa el tipo de trabajador y los cuatro servicios comunes")
	void laSesionInformaTipoYServiciosComunes() throws Exception {
		Trabajador trabajador = registrarTrabajador("2000000002", TipoTrabajador.DESARROLLADOR);
		registrarCuenta(trabajador, CORREO);

		var sesion = mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin(CORREO, PASSWORD)))
				.andExpect(status().isOk())
				.andReturn()
				.getRequest()
				.getSession();

		mockMvc.perform(get("/api/auth/sesion").session(
				(org.springframework.mock.web.MockHttpSession) sesion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tipoTrabajador").value("DESARROLLADOR"))
				.andExpect(jsonPath("$.serviciosComunes.length()").value(4));
	}

	@Test
	@DisplayName("HU-03 C03: credenciales incorrectas devuelven el mensaje generico de acceso denegado")
	void credencialesIncorrectasDevuelvenMensajeGenerico() throws Exception {
		Trabajador trabajador = registrarTrabajador("2000000003", TipoTrabajador.LIDER);
		registrarCuenta(trabajador, CORREO);

		mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin(CORREO, "clave-equivocada")))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensaje").value("Acceso denegado."))
				.andExpect(jsonPath("$.campos").doesNotExist());
	}

	@Test
	@DisplayName("HU-03 C04: el trabajador inhabilitado recibe el mismo mensaje generico (RN-11)")
	void trabajadorInhabilitadoRecibeElMismoMensaje() throws Exception {
		Trabajador trabajador = registrarTrabajador("2000000004", TipoTrabajador.DESARROLLADOR);
		trabajador.inhabilitar();
		trabajadores.save(trabajador);
		registrarCuenta(trabajador, CORREO);

		mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin(CORREO, PASSWORD)))
				.andExpect(status().isUnauthorized())
				// Identico a C03: el mensaje no permite deducir si la cuenta existe.
				.andExpect(jsonPath("$.mensaje").value("Acceso denegado."));
	}

	@Test
	@DisplayName("HU-03 C05: con datos vacios no se intenta la sesion y se piden los campos faltantes")
	void datosVaciosNoIntentanLaSesion() throws Exception {
		mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin("", "")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.correoCorporativo").exists())
				.andExpect(jsonPath("$.campos.password").exists());
	}

	@Test
	@DisplayName("RF-007 + RN-03: inhabilitar a un trabajador le cierra el acceso de inmediato")
	void alInhabilitarSeCierraElAcceso() throws Exception {
		Trabajador trabajador = registrarTrabajador("2000000005", TipoTrabajador.DESARROLLADOR);
		registrarCuenta(trabajador, CORREO);

		// Con la cuenta habilitada entra.
		mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin(CORREO, PASSWORD)))
				.andExpect(status().isOk());

		// El coordinador lo inhabilita (RF-007).
		trabajador.inhabilitar();
		trabajadores.saveAndFlush(trabajador);

		// Desde ese momento no puede entrar a los servicios internos (HU-05 C05).
		mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(cuerpoLogin(CORREO, PASSWORD)))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensaje").value("Acceso denegado."));
	}

	@Test
	@DisplayName("HU-01 C05: sin sesion no se accede a los servicios internos")
	void sinSesionNoHayAccesoAServiciosInternos() throws Exception {
		mockMvc.perform(get("/api/auth/sesion"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensaje").value("Acceso denegado."));
	}

}

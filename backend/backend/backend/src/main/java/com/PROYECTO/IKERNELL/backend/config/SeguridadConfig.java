package com.PROYECTO.IKERNELL.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import com.PROYECTO.IKERNELL.backend.shared.error.AccesoDenegadoException;

/**
 * Nivel 1 de autorizacion: control de acceso por tipo de trabajador (RNF-001).
 *
 * <p>El nivel 2 (permiso sobre un proyecto concreto) no se configura aqui; se
 * resolvera consultando la asignacion activa cuando se implemente la fase 4,
 * para preservar RN-05.
 */
@Configuration
@EnableMethodSecurity
public class SeguridadConfig {

	/**
	 * Hash de contrasenas. RNF-001 exige "mecanismos seguros de almacenamiento";
	 * BCrypt es la eleccion propuesta, no un requisito del documento.
	 */
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(UserDetailsService detallesTrabajador,
			PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider proveedor = new DaoAuthenticationProvider(detallesTrabajador);
		proveedor.setPasswordEncoder(passwordEncoder);
		return new ProviderManager(proveedor);
	}

	/** La sesion autenticada se guarda en la sesion HTTP (RF-027: "sesion autenticada"). */
	@Bean
	public SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, SecurityContextRepository contextRepository)
			throws Exception {
		http
				// RF-026 y RF-032..036: la informacion empresarial y el formulario de
				// consultas son publicos; RNF-001 reserva todo lo demas (HU-01 C05).
				.authorizeHttpRequests(peticiones -> peticiones
						.requestMatchers("/api/publico/**", "/api/auth/login", "/api/auth/csrf").permitAll()
						.anyRequest().authenticated())
				// Token CSRF en cookie legible por el cliente: la API usa sesion con
				// cookie, asi que la proteccion CSRF debe quedar activa.
				.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
				.securityContext(contexto -> contexto.securityContextRepository(contextRepository))
				// El login se expone como endpoint JSON propio, no como formulario.
				.formLogin(login -> login.disable())
				.httpBasic(basic -> basic.disable())
				.logout(logout -> logout
						.logoutUrl("/api/auth/logout")
						.invalidateHttpSession(true)
						.deleteCookies("JSESSIONID")
						.logoutSuccessHandler((peticion, respuesta, autenticacion) -> respuesta
								.setStatus(HttpStatus.NO_CONTENT.value())))
				.exceptionHandling(manejo -> manejo
						// Sin sesion: mismo mensaje generico que el login fallido (RN-11).
						.authenticationEntryPoint((peticion, respuesta, excepcion) -> {
							respuesta.setStatus(HttpStatus.UNAUTHORIZED.value());
							respuesta.setContentType(MediaType.APPLICATION_JSON_VALUE);
							respuesta.setCharacterEncoding("UTF-8");
							respuesta.getWriter()
									.write("{\"mensaje\":\"" + AccesoDenegadoException.MENSAJE + "\"}");
						})
						// Autenticado pero sin permiso para la operacion: HU-07 C05,
						// HU-08 C05, HU-12 C05, HU-14 C05, HU-15 C05, HU-17 C05, HU-18 C05.
						.accessDeniedHandler((peticion, respuesta, excepcion) -> {
							respuesta.setStatus(HttpStatus.FORBIDDEN.value());
							respuesta.setContentType(MediaType.APPLICATION_JSON_VALUE);
							respuesta.setCharacterEncoding("UTF-8");
							respuesta.getWriter().write(
									"{\"mensaje\":\"No tiene autorizacion para realizar esta operacion.\"}");
						}));
		return http.build();
	}

}

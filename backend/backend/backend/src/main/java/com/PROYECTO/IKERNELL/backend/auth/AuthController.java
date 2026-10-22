package com.PROYECTO.IKERNELL.backend.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.dto.LoginRequest;
import com.PROYECTO.IKERNELL.backend.auth.dto.SesionResponse;
import com.PROYECTO.IKERNELL.backend.shared.error.AccesoDenegadoException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/** Inicio de sesion de los trabajadores (RF-027, HU-03). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository contextRepository;
	private final ServicioAutenticacion servicioAutenticacion;

	public AuthController(AuthenticationManager authenticationManager, SecurityContextRepository contextRepository,
			ServicioAutenticacion servicioAutenticacion) {
		this.authenticationManager = authenticationManager;
		this.contextRepository = contextRepository;
		this.servicioAutenticacion = servicioAutenticacion;
	}

	/**
	 * Entrega el token CSRF antes del login.
	 *
	 * <p>La API mantiene la sesion en una cookie, de modo que la proteccion CSRF
	 * sigue activa; el cliente lee el token aqui (o de la cookie XSRF-TOKEN) y lo
	 * reenvia en la cabecera X-XSRF-TOKEN.
	 */
	@GetMapping("/csrf")
	public CsrfToken csrf(CsrfToken token) {
		return token;
	}

	/**
	 * Valida las credenciales y abre la sesion (HU-03 C01).
	 *
	 * <p>Cualquier fallo de autenticacion -credenciales incorrectas (C03) o
	 * trabajador inhabilitado (C04)- se convierte en la misma excepcion para que
	 * el cliente reciba un mensaje identico y no pueda deducir cual dato fallo
	 * (RN-11). Los campos vacios los rechaza antes la validacion del DTO (C05).
	 */
	@PostMapping("/login")
	public SesionResponse login(@Valid @RequestBody LoginRequest peticion, HttpServletRequest http,
			HttpServletResponse respuesta) {
		Authentication autenticacion;
		try {
			autenticacion = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(peticion.correoCorporativo(), peticion.password()));
		}
		catch (AuthenticationException ex) {
			throw new AccesoDenegadoException();
		}

		// Sesion nueva para la identidad autenticada (proteccion de fijacion de sesion).
		if (http.getSession(false) != null) {
			http.changeSessionId();
		}
		SecurityContext contexto = SecurityContextHolder.createEmptyContext();
		contexto.setAuthentication(autenticacion);
		SecurityContextHolder.setContext(contexto);
		contextRepository.saveContext(contexto, http, respuesta);

		TrabajadorAutenticado trabajador = (TrabajadorAutenticado) autenticacion.getPrincipal();
		servicioAutenticacion.registrarUltimoAcceso(trabajador.getUsername());
		return SesionResponse.de(trabajador);
	}

	/** Datos de la sesion vigente; permite al cliente rearmar el menu de HU-03 C02. */
	@GetMapping("/sesion")
	public SesionResponse sesion(Authentication autenticacion) {
		return SesionResponse.de((TrabajadorAutenticado) autenticacion.getPrincipal());
	}

}

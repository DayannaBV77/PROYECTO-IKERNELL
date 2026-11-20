package com.PROYECTO.IKERNELL.backend.auth;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Verifica en cada peticion autenticada que la cuenta del trabajador siga
 * habilitada en la base de datos (RN-03). Si fue inhabilitada mientras tenia
 * sesion abierta, invalida la sesion inmediatamente y responde 401.
 */
@Component
public class FiltroVigenciaCuenta extends OncePerRequestFilter {

	private static final String MENSAJE_SUSPENDIDA =
			"Tu sesi\u00f3n ha finalizado o tu cuenta ha sido suspendida. Por favor, contacta al administrador.";

	private final CuentaAccesoRepository cuentas;

	public FiltroVigenciaCuenta(CuentaAccesoRepository cuentas) {
		this.cuentas = cuentas;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String ruta = request.getRequestURI();
		return ruta.startsWith("/api/publico/")
				|| "/api/auth/login".equals(ruta)
				|| "/api/auth/csrf".equals(ruta)
				|| "/api/auth/logout".equals(ruta);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof TrabajadorAutenticado trabajador) {
			boolean vigente = cuentas.findByTrabajadorId(trabajador.getTrabajadorId())
					.map(cuenta -> cuenta.getTrabajador().estaHabilitado())
					.orElse(false);

			if (!vigente) {
				HttpSession sesion = request.getSession(false);
				if (sesion != null) {
					sesion.invalidate();
				}
				SecurityContextHolder.clearContext();
				response.setStatus(HttpStatus.UNAUTHORIZED.value());
				response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
				response.setContentType(MediaType.APPLICATION_JSON_VALUE);
				response.setCharacterEncoding("UTF-8");
				response.getWriter().write(
						"{\"mensaje\":\"" + MENSAJE_SUSPENDIDA + "\",\"codigo\":\"SESION_INVALIDA\"}");
				return;
			}
		}

		filterChain.doFilter(request, response);
	}

}

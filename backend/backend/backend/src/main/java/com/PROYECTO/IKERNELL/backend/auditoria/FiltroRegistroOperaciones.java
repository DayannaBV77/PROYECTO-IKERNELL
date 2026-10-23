package com.PROYECTO.IKERNELL.backend.auditoria;

import java.io.IOException;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Anota en la bitacora cada operacion de escritura y cada peticion fallida
 * (RNF-003), y deja de todas ellas una linea legible en la consola.
 *
 * <p>Las consultas de solo lectura no se anotan en la tabla; su SQL va al log
 * de consola, que es donde se depura.
 *
 * <h2>Por que va el PRIMERO de la cadena</h2>
 *
 * Con {@code HIGHEST_PRECEDENCE} este filtro envuelve a toda la cadena de
 * Spring Security, de modo que al terminar ve el codigo HTTP <b>definitivo</b>.
 *
 * <p>Estuvo al reves y estaba mal: situado al final, quedaba <i>dentro</i> de
 * la cadena de seguridad, y un 403 de {@code @PreAuthorize} se anotaba como
 * "200 exitosa". El motivo es que {@code AccessDeniedException} sube por este
 * filtro antes de que {@code ExceptionTranslationFilter} -que esta mas afuera-
 * traduzca la excepcion a 403. La bitacora daba por buenas operaciones que el
 * sistema habia rechazado, que es justo lo contrario de lo que debe registrar.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FiltroRegistroOperaciones extends OncePerRequestFilter {

	/** Nombre fijo para poder filtrar la bitacora en la consola. */
	private static final Logger log = LoggerFactory.getLogger("ikernell.auditoria");

	private static final Set<String> METODOS_DE_ESCRITURA = Set.of("POST", "PUT", "PATCH", "DELETE");

	/**
	 * Atributo donde {@link CapturaMensajeDeError} deja el mensaje que se le
	 * devolvio al cliente, para no tener que volver a leer el cuerpo ya escrito.
	 */
	static final String ATRIBUTO_DETALLE_ERROR = "ikernell.detalleError";

	private final ServicioRegistroOperaciones servicio;

	public FiltroRegistroOperaciones(ServicioRegistroOperaciones servicio) {
		this.servicio = servicio;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest peticion, HttpServletResponse respuesta,
			FilterChain cadena) throws ServletException, IOException {

		long inicio = System.nanoTime();
		try {
			cadena.doFilter(peticion, respuesta);
		} finally {
			long duracionMs = (System.nanoTime() - inicio) / 1_000_000;
			anotar(peticion, respuesta, duracionMs);
		}
	}

	private void anotar(HttpServletRequest peticion, HttpServletResponse respuesta, long duracionMs) {
		String metodo = peticion.getMethod();
		int codigo = respuesta.getStatus();
		boolean fallo = codigo >= 400;

		if (!METODOS_DE_ESCRITURA.contains(metodo) && !fallo) {
			return;
		}

		String ruta = peticion.getRequestURI();
		Object detalle = peticion.getAttribute(ATRIBUTO_DETALLE_ERROR);
		String detalleError = fallo ? (detalle != null ? detalle.toString() : "HTTP " + codigo) : null;

		TrabajadorAutenticado trabajador = quienLaEjecuto(peticion);
		Long trabajadorId = trabajador != null ? trabajador.getTrabajadorId() : null;
		String correo = trabajador != null ? trabajador.getUsername() : null;
		String quien = correo != null ? correo : "anonimo";

		if (fallo) {
			log.warn("FALLO  {} {} -> {} ({} ms) por {}: {}",
					metodo, ruta, codigo, duracionMs, quien, detalleError);
		} else {
			log.info("OK     {} {} -> {} ({} ms) por {}", metodo, ruta, codigo, duracionMs, quien);
		}

		servicio.registrar(metodo, ruta, codigo, duracionMs, trabajadorId, correo, detalleError);
	}

	/**
	 * Resuelve quien ejecuto la operacion.
	 *
	 * <p>Estar fuera de la cadena de seguridad tiene un precio: cuando este
	 * filtro recupera el control, {@code SecurityContextHolderFilter} ya limpio
	 * el contexto, asi que {@link SecurityContextHolder} suele venir vacio. Por
	 * eso se consulta ademas la sesion HTTP, que es donde
	 * {@link HttpSessionSecurityContextRepository} -el repositorio configurado
	 * en SeguridadConfig- deja el contexto de la sesion iniciada.
	 *
	 * <p>Se mira primero el holder porque es el valor de esta peticion; la
	 * sesion es el respaldo.
	 */
	private TrabajadorAutenticado quienLaEjecuto(HttpServletRequest peticion) {
		TrabajadorAutenticado delHolder = extraer(SecurityContextHolder.getContext().getAuthentication());
		if (delHolder != null) {
			return delHolder;
		}

		HttpSession sesion = peticion.getSession(false);
		if (sesion == null) {
			return null;
		}
		Object guardado = sesion.getAttribute(
				HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
		return guardado instanceof SecurityContext contexto ? extraer(contexto.getAuthentication()) : null;
	}

	private TrabajadorAutenticado extraer(Authentication autenticacion) {
		return autenticacion != null
				&& autenticacion.getPrincipal() instanceof TrabajadorAutenticado trabajador
						? trabajador
						: null;
	}

}

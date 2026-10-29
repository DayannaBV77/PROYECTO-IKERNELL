package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.publico.domain.EstadoConsulta;
import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;
import com.PROYECTO.IKERNELL.backend.publico.dto.ConsultaResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.ContenidoResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.OperacionRespuestaResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroConsultaRequest;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroContenidoRequest;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroRespuestaConsultaRequest;
import com.PROYECTO.IKERNELL.backend.publico.dto.RespuestaConsultaResponse;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Administración del contenido público y gestión integral de consultas web recibidas
 * (RF-035, HU-02).
 *
 * <p>Reservado exclusivamente al rol de Coordinador (D-26). Permite:
 * <ul>
 *   <li>Visualizar consultas recibidas con filtros por estado (Pendiente, En gestión, Respondida, Error).</li>
 *   <li>Abrir y consultar el historial completo de respuestas y trazabilidad de cada caso.</li>
 *   <li>Redactar y notificar respuestas por correo electrónico sin abandonar la plataforma.</li>
 *   <li>Reintentar notificaciones en caso de fallos del servicio de correo.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('COORDINADOR')")
public class ContenidoAdminController {

	private final ServicioContenidoPublico servicioContenido;
	private final ServicioConsultas servicioConsultas;

	public ContenidoAdminController(ServicioContenidoPublico servicioContenido,
			ServicioConsultas servicioConsultas) {
		this.servicioContenido = servicioContenido;
		this.servicioConsultas = servicioConsultas;
	}

	/** Contenido de una seccion incluyendo los borradores sin publicar. */
	@GetMapping("/contenido")
	public ListaResponse<ContenidoResponse> listar(@RequestParam TipoContenido tipo) {
		List<ContenidoResponse> lista = servicioContenido.seccionCompleta(tipo).stream()
				.map(ContenidoResponse::administrativa).toList();
		return ListaResponse.de(lista, "Esta seccion aun no tiene contenido registrado.");
	}

	/** Crea contenido. Nace sin publicar, para que nada aparezca por descuido. */
	@PostMapping("/contenido")
	@ResponseStatus(HttpStatus.CREATED)
	public ContenidoResponse crear(@Valid @RequestBody RegistroContenidoRequest peticion) {
		return ContenidoResponse.administrativa(servicioContenido.crear(peticion));
	}

	@PutMapping("/contenido/{id}")
	public ContenidoResponse actualizar(@PathVariable Long id,
			@Valid @RequestBody RegistroContenidoRequest peticion) {
		return ContenidoResponse.administrativa(servicioContenido.actualizar(id, peticion));
	}

	/** Publica o retira una pieza de contenido. */
	@PostMapping("/contenido/{id}/publicacion")
	public ContenidoResponse cambiarPublicacion(@PathVariable Long id,
			@RequestParam boolean publicada) {
		return ContenidoResponse.administrativa(servicioContenido.cambiarPublicacion(id, publicada));
	}

	/** Consultas recibidas por el formulario publico (RF-035, HU-02). */
	@GetMapping("/consultas")
	public ListaResponse<ConsultaResponse> consultas(
			@RequestParam(required = false) EstadoConsulta estado,
			@RequestParam(required = false) Boolean atendida) {
		List<ConsultaResponse> lista = servicioConsultas.recibidas(estado, atendida).stream()
				.map(ConsultaResponse::de).toList();
		return ListaResponse.de(lista, "No hay consultas recibidas.");
	}

	/** Consulta específica con su historial de respuestas asociadas. */
	@GetMapping("/consultas/{id}")
	public ConsultaResponse obtenerConsulta(@PathVariable Long id) {
		return ConsultaResponse.de(servicioConsultas.obtener(id));
	}

	/** Marca una consulta en estado EN_GESTION al iniciar su revisión. */
	@PostMapping("/consultas/{id}/en-gestion")
	public ConsultaResponse marcarEnGestion(@PathVariable Long id) {
		return ConsultaResponse.de(servicioConsultas.marcarEnGestion(id));
	}

	/**
	 * Redacta y despacha la respuesta a una consulta pública directamente desde el sistema,
	 * notificando al visitante por correo electrónico.
	 */
	@PostMapping("/consultas/{id}/respuestas")
	public OperacionRespuestaResponse responderConsulta(
			@PathVariable Long id,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado,
			@Valid @RequestBody RegistroRespuestaConsultaRequest peticion) {
		return servicioConsultas.responder(id, autenticado.getTrabajadorId(), peticion);
	}

	/**
	 * Reintenta el envío de la notificación por correo de una respuesta previamente guardada.
	 */
	@PostMapping("/consultas/{id}/respuestas/{respuestaId}/reintentar")
	public OperacionRespuestaResponse reintentarNotificacion(
			@PathVariable Long id,
			@PathVariable Long respuestaId,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return servicioConsultas.reintentarNotificacion(id, respuestaId, autenticado.getTrabajadorId());
	}

	/** Consulta el historial de respuestas redactadas para mantener la trazabilidad. */
	@GetMapping("/consultas/{id}/historial")
	public List<RespuestaConsultaResponse> historial(@PathVariable Long id) {
		return servicioConsultas.historial(id).stream()
				.map(RespuestaConsultaResponse::de)
				.toList();
	}

	/** Marca una consulta como atendida (mantenido por compatibilidad previa). */
	@PostMapping("/consultas/{id}/atencion")
	public ConsultaResponse marcarAtendida(@PathVariable Long id,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return ConsultaResponse.de(
				servicioConsultas.marcarAtendida(id, autenticado.getTrabajadorId()));
	}

}

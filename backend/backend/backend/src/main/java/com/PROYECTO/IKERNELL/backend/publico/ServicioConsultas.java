package com.PROYECTO.IKERNELL.backend.publico;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.publico.ServicioNotificacionCorreo.ResultadoEnvioCorreo;
import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;
import com.PROYECTO.IKERNELL.backend.publico.domain.EstadoConsulta;
import com.PROYECTO.IKERNELL.backend.publico.domain.RespuestaConsulta;
import com.PROYECTO.IKERNELL.backend.publico.dto.ConsultaResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.OperacionRespuestaResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroConsultaRequest;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroRespuestaConsultaRequest;
import com.PROYECTO.IKERNELL.backend.publico.dto.RespuestaConsultaResponse;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Gestión, atención y respuesta de consultas públicas enviadas desde el portal web
 * (RF-035, HU-02).
 */
@Service
public class ServicioConsultas {

	private final ConsultaPublicaRepository consultas;
	private final RespuestaConsultaRepository respuestas;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioNotificacionCorreo servicioNotificacionCorreo;

	public ServicioConsultas(
			ConsultaPublicaRepository consultas,
			RespuestaConsultaRepository respuestas,
			ServicioTrabajadores servicioTrabajadores,
			ServicioNotificacionCorreo servicioNotificacionCorreo) {
		this.consultas = consultas;
		this.respuestas = respuestas;
		this.servicioTrabajadores = servicioTrabajadores;
		this.servicioNotificacionCorreo = servicioNotificacionCorreo;
	}

	/** RF-035, HU-02 C02: registra la consulta recibida desde el portal público. */
	@Transactional
	public ConsultaPublica registrar(RegistroConsultaRequest peticion) {
		return consultas.save(new ConsultaPublica(peticion.pregunta(), peticion.nombreContacto(),
				peticion.correoContacto(), peticion.telefonoContacto()));
	}

	/**
	 * Consultas recibidas, con soporte de filtrado por estado específico o por atendida.
	 */
	@Transactional(readOnly = true)
	public List<ConsultaPublica> recibidas(EstadoConsulta estado, Boolean atendida) {
		if (estado != null) {
			return consultas.findByEstadoOrderByRecibidaEnDesc(estado);
		}
		if (atendida != null) {
			return consultas.findByAtendidaOrderByRecibidaEnDesc(atendida);
		}
		return consultas.findAllByOrderByRecibidaEnDesc();
	}

	/** Obtiene una consulta por su identificador. */
	@Transactional(readOnly = true)
	public ConsultaPublica obtener(Long id) {
		return consultas.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe la consulta con el id " + id + "."));
	}

	/**
	 * Marca una consulta en estado EN_GESTION cuando el coordinador empieza a analizarla.
	 */
	@Transactional
	public ConsultaPublica marcarEnGestion(Long id) {
		ConsultaPublica consulta = obtener(id);
		if (consulta.getEstado() == EstadoConsulta.RESPONDIDA) {
			throw new ReglaNegocioException("La consulta ya fue respondida.");
		}
		consulta.pasarAEnGestion();
		return consultas.save(consulta);
	}

	/**
	 * Marca una consulta como atendida (mantiene compatibilidad con endpoints previos).
	 */
	@Transactional
	public ConsultaPublica marcarAtendida(Long id, Long trabajadorId) {
		ConsultaPublica consulta = obtener(id);
		if (consulta.estaAtendida()) {
			throw new ReglaNegocioException("La consulta ya fue marcada como atendida.");
		}
		Trabajador trabajador = servicioTrabajadores.obtener(trabajadorId);
		consulta.marcarAtendida(trabajador);
		return consultas.save(consulta);
	}

	/**
	 * Redacta y envía la respuesta a una consulta pública directamente desde el sistema.
	 *
	 * <p>Aplica control anti-duplicados para evitar envíos dobles por clics repetidos.
	 * Dispara la notificación por correo electrónico hacia el visitante.
	 * Si el correo falla:
	 * <ul>
	 *   <li>La respuesta se conserva en la base de datos (con su detalle de error).</li>
	 *   <li>La consulta NO se marca como respondida ni desaparece; queda en ERROR_NOTIFICACION.</li>
	 * </ul>
	 */
	@Transactional
	public OperacionRespuestaResponse responder(Long id, Long trabajadorId, RegistroRespuestaConsultaRequest peticion) {
		ConsultaPublica consulta = obtener(id);
		Trabajador trabajador = servicioTrabajadores.obtener(trabajadorId);

		String textoRespuesta = peticion.respuesta().trim();

		// Control backend anti-duplicados (mismo trabajador, mismo contenido en los últimos 15 segundos)
		LocalDateTime ventanaReciente = LocalDateTime.now().minusSeconds(15);
		boolean duplicada = consulta.getRespuestas().stream().anyMatch(r ->
				r.getTrabajador() != null
						&& r.getTrabajador().getId().equals(trabajadorId)
						&& r.getContenido().trim().equalsIgnoreCase(textoRespuesta)
						&& r.getFechaRespuesta() != null
						&& r.getFechaRespuesta().isAfter(ventanaReciente));

		if (duplicada) {
			throw new ReglaNegocioException("Se detectó un envío duplicado reciente. Por favor espere unos segundos antes de enviar nuevamente.");
		}

		RespuestaConsulta respuesta = new RespuestaConsulta(consulta, trabajador, textoRespuesta);

		// Intentar envío de correo
		ResultadoEnvioCorreo resultado = servicioNotificacionCorreo.enviarNotificacionRespuesta(
				consulta.getCorreoContacto(),
				consulta.getNombreContacto(),
				consulta.getId(),
				consulta.getPregunta(),
				textoRespuesta);

		if (resultado.exitoso()) {
			consulta.registrarRespuestaExitosa(respuesta, trabajador);
			respuestas.save(respuesta);
			ConsultaPublica actualizada = consultas.save(consulta);
			return new OperacionRespuestaResponse(
					true,
					"Respuesta registrada y notificada por correo al visitante exitosamente.",
					ConsultaResponse.de(actualizada),
					RespuestaConsultaResponse.de(respuesta));
		} else {
			// Manejo de fallo: la respuesta redactada SE CONSERVA en la base de datos,
			// pero el estado pasa a ERROR_NOTIFICACION y atendida = false.
			consulta.registrarRespuestaFallida(respuesta, resultado.detalleError());
			respuestas.save(respuesta);
			ConsultaPublica actualizada = consultas.save(consulta);
			return new OperacionRespuestaResponse(
					false,
					"La respuesta fue guardada en el sistema, pero ocurrió un problema al enviar la notificación por correo: "
							+ resultado.detalleError(),
					ConsultaResponse.de(actualizada),
					RespuestaConsultaResponse.de(respuesta));
		}
	}

	/**
	 * Reintenta el envío de la notificación por correo para una respuesta previamente guardada
	 * cuyo envío inicial falló.
	 */
	@Transactional
	public OperacionRespuestaResponse reintentarNotificacion(Long consultaId, Long respuestaId, Long trabajadorId) {
		ConsultaPublica consulta = obtener(id(consultaId));
		RespuestaConsulta respuesta = respuestas.findById(respuestaId)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe la respuesta con id " + respuestaId + "."));

		if (!respuesta.getConsulta().getId().equals(consulta.getId())) {
			throw new ReglaNegocioException("La respuesta no corresponde a la consulta indicada.");
		}

		if (respuesta.isEnviadaPorCorreo()) {
			throw new ReglaNegocioException("Esta respuesta ya fue notificada por correo electrónico exitosamente.");
		}

		ResultadoEnvioCorreo resultado = servicioNotificacionCorreo.enviarNotificacionRespuesta(
				consulta.getCorreoContacto(),
				consulta.getNombreContacto(),
				consulta.getId(),
				consulta.getPregunta(),
				respuesta.getContenido());

		Trabajador trabajador = servicioTrabajadores.obtener(trabajadorId);

		if (resultado.exitoso()) {
			consulta.registrarRespuestaExitosa(respuesta, trabajador);
			respuesta.actualizarFechaRespuesta(LocalDateTime.now());
			respuestas.save(respuesta);
			ConsultaPublica actualizada = consultas.save(consulta);
			return new OperacionRespuestaResponse(
					true,
					"Notificación por correo enviada exitosamente en el reintento.",
					ConsultaResponse.de(actualizada),
					RespuestaConsultaResponse.de(respuesta));
		} else {
			consulta.registrarRespuestaFallida(respuesta, resultado.detalleError());
			respuestas.save(respuesta);
			ConsultaPublica actualizada = consultas.save(consulta);
			return new OperacionRespuestaResponse(
					false,
					"El reintento de envío de correo volvió a fallar: " + resultado.detalleError(),
					ConsultaResponse.de(actualizada),
					RespuestaConsultaResponse.de(respuesta));
		}
	}

	/** Retorna el historial cronológico de respuestas registradas para una consulta. */
	@Transactional(readOnly = true)
	public List<RespuestaConsulta> historial(Long consultaId) {
		obtener(consultaId);
		return respuestas.findByConsultaIdOrderByFechaRespuestaAsc(consultaId);
	}

	private Long id(Long valor) {
		return valor;
	}

}

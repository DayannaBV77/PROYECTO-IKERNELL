package com.PROYECTO.IKERNELL.backend.publico.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;
import com.PROYECTO.IKERNELL.backend.publico.domain.EstadoConsulta;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Consulta recibida, para la vista interna de gestión por parte del coordinador (RF-035, HU-02).
 *
 * <p>Nunca se devuelve en la pagina publica: HU-02 C05 lo prohibe.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConsultaResponse(
		Long id,
		String pregunta,
		String nombreContacto,
		String correoContacto,
		String telefonoContacto,
		LocalDateTime recibidaEn,
		boolean atendida,
		Long atendidaPorId,
		String atendidaPorNombre,
		EstadoConsulta estado,
		LocalDateTime fechaRespuesta,
		List<RespuestaConsultaResponse> respuestas) {

	public static ConsultaResponse de(ConsultaPublica consulta) {
		String nombreAtendio = null;
		if (consulta.getAtendidaPor() != null) {
			nombreAtendio = (consulta.getAtendidaPor().getNombre() + " " + consulta.getAtendidaPor().getApellido()).trim();
		}
		List<RespuestaConsultaResponse> historial = consulta.getRespuestas() != null
				? consulta.getRespuestas().stream().map(RespuestaConsultaResponse::de).toList()
				: List.of();

		return new ConsultaResponse(
				consulta.getId(),
				consulta.getPregunta(),
				consulta.getNombreContacto(),
				consulta.getCorreoContacto(),
				consulta.getTelefonoContacto(),
				consulta.getRecibidaEn(),
				consulta.estaAtendida(),
				consulta.getAtendidaPor() != null ? consulta.getAtendidaPor().getId() : null,
				nombreAtendio,
				consulta.getEstado(),
				consulta.getFechaRespuesta(),
				historial);
	}

}

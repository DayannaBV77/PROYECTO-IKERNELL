package com.PROYECTO.IKERNELL.backend.auth.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Datos de la sesion abierta (RF-027).
 *
 * <p>{@code serviciosComunes} son los cuatro servicios internos que HU-03 C02
 * enumera para cualquier trabajador autenticado. Se devuelven para que el
 * cliente arme el menu.
 *
 * <p>Estado de cada uno: la biblioteca y los tutoriales los atiende
 * {@code ServiciosCorporativosController} (RF-029, RF-030); el correo se ofrece
 * como enlace autorizado configurable (RF-031, D-13); y del chat existe la parte
 * contextual, los hilos por proyecto y etapa de RF-037
 * ({@code HiloController}). El chat LIBRE de RF-028 -conversaciones
 * individuales, grupos, disponibilidad- sigue sin implementar porque D-12 lo
 * deja sin definir.
 *
 * <p>El {@code tipoTrabajador} y {@code rolActivo} permiten al cliente mostrar
 * las funciones autorizadas para el contexto seleccionado.
 */
public record SesionResponse(
		Long trabajadorId,
		String nombreCompleto,
		String correoCorporativo,
		TipoTrabajador tipoTrabajador,
		List<String> serviciosComunes,
		Long proyectoActivoId,
		String proyectoActivoNombre,
		RolEnProyecto rolActivo) {

	private static final List<String> SERVICIOS_COMUNES = List.of(
			"CORREO_ELECTRONICO",
			"CHAT_CORPORATIVO",
			"BIBLIOTECA_DE_PROGRAMAS",
			"TUTORIALES_DE_PROGRAMACION");

	public SesionResponse(
			Long trabajadorId,
			String nombreCompleto,
			String correoCorporativo,
			TipoTrabajador tipoTrabajador,
			List<String> serviciosComunes) {
		this(trabajadorId, nombreCompleto, correoCorporativo, tipoTrabajador, serviciosComunes, null, null, null);
	}

	public static SesionResponse de(TrabajadorAutenticado trabajador) {
		return new SesionResponse(
				trabajador.getTrabajadorId(),
				trabajador.getNombreCompleto(),
				trabajador.getUsername(),
				trabajador.getTipoTrabajador(),
				SERVICIOS_COMUNES,
				trabajador.getProyectoActivoId(),
				trabajador.getProyectoActivoNombre(),
				trabajador.getRolActivo());
	}

}

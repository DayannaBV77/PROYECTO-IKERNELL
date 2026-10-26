package com.PROYECTO.IKERNELL.backend.asignaciones.dto;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Asignacion;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

/**
 * Proyecto en el que el trabajador autenticado participa ahora mismo.
 *
 * <p>Una fila por proyecto y no por asignacion: nada impide que la misma
 * persona tenga dos asignaciones activas en un proyecto -una como lider y otra
 * como desarrollador-, porque RF-003 considera equivalentes solo las que
 * coinciden tambien en el rol. Agrupar evita que el proyecto aparezca repetido
 * en un selector.
 *
 * <p>{@code roles} viaja porque es lo que permite al cliente no ofrecer una
 * operacion que el servidor iba a rechazar: registrar incidencias exige el rol
 * DESARROLLADOR en ESE proyecto (nivel 2). La decision sigue siendo del
 * servidor; esto solo evita ofrecer un 403.
 *
 * <p>{@code estadoHabilitacion} se entrega sin filtrar los proyectos
 * inhabilitados, a proposito: ninguna operacion sobre incidencias exige hoy que
 * el proyecto este habilitado, de modo que ocultarlos esconderia proyectos en
 * los que la operacion si funciona. El cliente puede senalarlos con este dato.
 */
public record MiProyectoResponse(
		Long proyectoId,
		String proyectoNombre,
		EstadoHabilitacion estadoHabilitacion,
		List<RolEnProyecto> roles) {

	/**
	 * Agrupa las asignaciones activas por proyecto, conservando el orden en que
	 * llegan (el repositorio las entrega ordenadas por nombre de proyecto).
	 */
	public static List<MiProyectoResponse> agrupar(List<Asignacion> asignaciones) {
		Map<Long, List<RolEnProyecto>> rolesPorProyecto = new LinkedHashMap<>();
		Map<Long, Asignacion> primeraDelProyecto = new LinkedHashMap<>();

		for (Asignacion asignacion : asignaciones) {
			Long proyectoId = asignacion.getProyecto().getId();
			primeraDelProyecto.putIfAbsent(proyectoId, asignacion);
			List<RolEnProyecto> roles = rolesPorProyecto.computeIfAbsent(proyectoId,
					clave -> new ArrayList<>());
			if (!roles.contains(asignacion.getRolEnProyecto())) {
				roles.add(asignacion.getRolEnProyecto());
			}
		}

		return primeraDelProyecto.values().stream()
				.map(asignacion -> {
					List<RolEnProyecto> roles = rolesPorProyecto.get(asignacion.getProyecto().getId());
					roles.sort(Comparator.naturalOrder());
					return new MiProyectoResponse(
							asignacion.getProyecto().getId(),
							asignacion.getProyecto().getNombre(),
							asignacion.getProyecto().getEstadoHabilitacion(),
							List.copyOf(roles));
				})
				.toList();
	}

}

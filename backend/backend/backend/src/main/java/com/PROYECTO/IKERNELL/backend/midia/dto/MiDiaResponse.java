package com.PROYECTO.IKERNELL.backend.midia.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Panel personalizado «Mi Dia» del desarrollador autenticado (RF-038).
 *
 * <p>Reune las tres cosas que el requerimiento enumera: las actividades del dia
 * con su estado de checklist, las notificaciones no leidas y el contexto
 * necesario para el acceso rapido al registro de interrupciones. A ellas se
 * suman las tareas personales que el propio trabajador agrega para organizar su
 * dia.
 *
 * <p>Las actividades llegan <b>todas</b> las del dia, no solo las pendientes:
 * el checklist necesita seguir mostrando una actividad recien marcada para
 * permitir desmarcarla, y el cliente pinta las completadas atenuadas. El orden
 * pone primero las pendientes por prioridad y despues las completadas, para que
 * lo que falta quede arriba.
 *
 * <p>{@code total}, {@code pendientes} y {@code completadas} cuentan actividades
 * y tareas personales juntas: es el avance del dia, que es lo que muestra la
 * cabecera del panel. {@code atrasadas} cuenta solo actividades del sistema,
 * porque una tarea personal no tiene fecha de planificacion del lider.
 *
 * <p>{@code sinDiaPlanificado} cuenta las actividades propias pendientes que NO
 * tienen dia asignado. No aparecen en la lista -no son "del dia"- pero el panel
 * avisa de cuantas hay en lugar de ocultarlas sin decirlo: RF-019 no exige la
 * fecha, asi que una actividad sin ella es legitima y su ausencia del panel
 * podria parecer un error.
 *
 * <p>{@code mensaje} lleva el aviso de RN-14 cuando no queda nada pendiente,
 * para no entregar una lista vacia a secas. Distingue "no hay nada" de "ya esta
 * todo hecho" y de "hay actividades sin planificar".
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MiDiaResponse(
		LocalDate dia,
		List<ActividadDelDiaResponse> actividades,
		List<TareaMiDiaResponse> tareasPersonales,
		int total,
		int pendientes,
		int completadas,
		long atrasadas,
		long sinDiaPlanificado,
		NotificacionesResponse notificaciones,
		String mensaje) {

	public static MiDiaResponse de(LocalDate dia, List<ActividadDelDiaResponse> actividades,
			List<TareaMiDiaResponse> tareasPersonales, long sinDiaPlanificado,
			NotificacionesResponse notificaciones) {

		int completadas = (int) (actividades.stream().filter(ActividadDelDiaResponse::completada).count()
				+ tareasPersonales.stream().filter(TareaMiDiaResponse::completada).count());
		int total = actividades.size() + tareasPersonales.size();
		int pendientes = total - completadas;
		long atrasadas = actividades.stream()
				.filter(actividad -> !actividad.completada() && actividad.atrasada())
				.count();

		return new MiDiaResponse(
				dia,
				actividades,
				tareasPersonales,
				total,
				pendientes,
				completadas,
				atrasadas,
				sinDiaPlanificado,
				notificaciones,
				mensajeSinPendientes(pendientes, total, sinDiaPlanificado));
	}

	/**
	 * El aviso distingue los tres motivos por los que no queda nada pendiente,
	 * porque no se resuelven igual: no hay nada, ya esta todo hecho, o hay
	 * actividades que el lider todavia no planifico.
	 */
	private static String mensajeSinPendientes(int pendientes, int total, long sinDiaPlanificado) {
		if (pendientes > 0) {
			return null;
		}
		if (total > 0) {
			return "¡Todo al día por hoy! No tiene tareas pendientes.";
		}
		if (sinDiaPlanificado > 0) {
			return "No tiene tareas pendientes para hoy. Tiene " + sinDiaPlanificado
					+ " actividad(es) pendiente(s) sin dia planificado, que no aparecen en el panel"
					+ " del dia.";
		}
		return "No tiene tareas pendientes para hoy.";
	}

}

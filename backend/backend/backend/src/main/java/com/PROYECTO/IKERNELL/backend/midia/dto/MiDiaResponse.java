package com.PROYECTO.IKERNELL.backend.midia.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Panel personalizado «Mi Dia» del desarrollador autenticado (RF-038).
 *
 * <p>Reune las tres cosas que el requerimiento enumera: las actividades
 * pendientes del dia ordenadas por prioridad, las notificaciones no leidas y el
 * contexto necesario para el acceso rapido al registro de interrupciones.
 *
 * <p>{@code sinDiaPlanificado} cuenta las actividades propias pendientes que NO
 * tienen dia asignado. No aparecen en la lista -no son "del dia"- pero el panel
 * avisa de cuantas hay en lugar de ocultarlas sin decirlo: RF-019 no exige la
 * fecha, asi que una actividad sin ella es legitima y su ausencia del panel
 * podria parecer un error.
 *
 * <p>{@code mensaje} lleva el aviso de RN-14 cuando no hay nada que mostrar,
 * para no entregar una lista vacia a secas.
 *
 * <p>NO incluye un endpoint propio para registrar la interrupcion: el acceso
 * rapido que pide RF-038 lleva al registro que ya existe (RF-024), y crear una
 * via paralela habria duplicado sus reglas.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MiDiaResponse(
		LocalDate dia,
		List<ActividadDelDiaResponse> actividades,
		int total,
		long atrasadas,
		long sinDiaPlanificado,
		NotificacionesResponse notificaciones,
		String mensaje) {

	public static MiDiaResponse de(LocalDate dia, List<ActividadDelDiaResponse> actividades,
			long sinDiaPlanificado, NotificacionesResponse notificaciones) {
		long atrasadas = actividades.stream().filter(ActividadDelDiaResponse::atrasada).count();
		return new MiDiaResponse(
				dia,
				actividades,
				actividades.size(),
				atrasadas,
				sinDiaPlanificado,
				notificaciones,
				actividades.isEmpty() ? mensajeSinActividades(sinDiaPlanificado) : null);
	}

	/**
	 * El aviso distingue los dos motivos por los que el panel puede venir vacio,
	 * porque no se resuelven igual: sin actividades no hay nada que hacer, y con
	 * actividades sin planificar hay que pedirle al lider que les ponga dia.
	 */
	private static String mensajeSinActividades(long sinDiaPlanificado) {
		if (sinDiaPlanificado > 0) {
			return "No tiene actividades pendientes para hoy. Tiene " + sinDiaPlanificado
					+ " actividad(es) pendiente(s) sin dia planificado, que no aparecen en el panel"
					+ " del dia.";
		}
		return "No tiene actividades pendientes para hoy.";
	}

}

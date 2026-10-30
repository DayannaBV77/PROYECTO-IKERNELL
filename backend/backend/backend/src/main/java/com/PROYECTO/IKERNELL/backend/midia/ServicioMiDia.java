package com.PROYECTO.IKERNELL.backend.midia;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.actividades.ActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.PrioridadActividad;
import com.PROYECTO.IKERNELL.backend.chat.ServicioHilos;
import com.PROYECTO.IKERNELL.backend.chat.dto.HiloResponse;
import com.PROYECTO.IKERNELL.backend.corporativo.ServicioAccesoCorreo;
import com.PROYECTO.IKERNELL.backend.midia.dto.ActividadDelDiaResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.MiDiaResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.NotificacionesResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.TareaMiDiaResponse;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * <p>No tiene reglas de negocio propias de las actividades: COMPONE las de otros
 * modulos. Las actividades son las del repositorio de actividades, los no leidos
 * los calcula el servicio de hilos y el estado del correo lo decide el de
 * servicios corporativos. Deliberadamente no reimplementa nada de eso, para que
 * el panel no pueda acabar diciendo algo distinto de lo que dicen las pantallas
 * de las que saca los datos.
 *
 * <p>El checklist anade dos operaciones: alternar el estado de una actividad y
 * administrar tareas personales. La primera no inventa un estado paralelo: crea
 * o reabre una ejecucion real (RF-022), de modo que «Mis actividades» vea lo
 * mismo que el panel. Las tareas personales viven en su propia tabla porque no
 * son actividades de ningun proyecto.
 *
 * <p>No lleva restriccion por tipo de trabajador. RF-038 nombra al
 * desarrollador, pero el dato que el panel usa es la actividad asignada, y
 * HU-16 C05 (RN-05) incluye al lider al que asignaron como desarrollador en
 * otro proyecto. Filtrar por el tipo global lo dejaria fuera de su propio
 * trabajo; quien no tenga actividades asignadas recibe el panel vacio con su
 * aviso.
 *
 * <p>TRES DECISIONES PENDIENTES viven aqui, no en el esquema:
 * <ul>
 * <li><b>D-30:</b> "del dia" son las de fecha menor o igual a hoy, marcando las
 * atrasadas, no solo las de hoy exacto.
 * <li><b>D-31:</b> "pendiente" es sin ninguna ejecucion finalizada, porque
 * {@code actividad.estado} sigue sin dominio definido (D-04).
 * <li><b>D-29:</b> el orden por prioridad usa el orden de declaracion de
 * {@link PrioridadActividad}; las actividades sin prioridad van al final, para
 * no suponerles una.
 * </ul>
 */
@Service
public class ServicioMiDia {

	/** Observacion con que el checklist cierra una actividad sin ejecucion previa. */
	private static final String OBSERVACION_CHECKLIST = "Completada desde Mi Dia";

	private final ActividadRepository actividades;
	private final EjecucionActividadRepository ejecuciones;
	private final ServicioTareasMiDia servicioTareas;
	private final ServicioHilos servicioHilos;
	private final ServicioAccesoCorreo servicioCorreo;

	public ServicioMiDia(ActividadRepository actividades, EjecucionActividadRepository ejecuciones,
			ServicioTareasMiDia servicioTareas, ServicioHilos servicioHilos,
			ServicioAccesoCorreo servicioCorreo) {
		this.actividades = actividades;
		this.ejecuciones = ejecuciones;
		this.servicioTareas = servicioTareas;
		this.servicioHilos = servicioHilos;
		this.servicioCorreo = servicioCorreo;
	}

	/** RF-038: el panel del trabajador autenticado. */
	@Transactional(readOnly = true)
	public MiDiaResponse panelDe(Long trabajadorId) {
		// La hora de pared de la aplicacion, igual que en el resto del modelo: el
		// despliegue corre en America/Bogota, no en UTC, y de eso depende que "hoy"
		// sea el mismo dia que ve el trabajador (ver docs/base-de-datos.md).
		LocalDate hoy = LocalDate.now();

		List<Actividad> candidatas = actividades
				.findByDesarrolladorIdAndFechaPlanificadaLessThanEqual(trabajadorId, hoy);
		Set<Long> terminadas = idsTerminadas(candidatas);

		// Pendientes primero, cada grupo por prioridad. El cliente recibe tambien
		// las completadas para poder desmarcarlas y para pintarlas atenuadas.
		List<ActividadDelDiaResponse> pendientes = candidatas.stream()
				.filter(actividad -> !terminadas.contains(actividad.getId()))
				.sorted(POR_PRIORIDAD_Y_FECHA)
				.map(actividad -> ActividadDelDiaResponse.de(actividad, hoy, false))
				.toList();
		List<ActividadDelDiaResponse> completadas = candidatas.stream()
				.filter(actividad -> terminadas.contains(actividad.getId()))
				.sorted(POR_PRIORIDAD_Y_FECHA)
				.map(actividad -> ActividadDelDiaResponse.de(actividad, hoy, true))
				.toList();
		List<ActividadDelDiaResponse> delDia = Stream.concat(pendientes.stream(), completadas.stream())
				.toList();

		List<TareaMiDiaResponse> tareasPersonales = servicioTareas.delDia(trabajadorId, hoy).stream()
				.map(TareaMiDiaResponse::de)
				.toList();

		List<HiloResponse> conversacionesNoLeidas = servicioHilos.hilosConNoLeidos(trabajadorId)
				.stream()
				.map(HiloResponse::de)
				.toList();

		return MiDiaResponse.de(hoy, delDia, tareasPersonales,
				contarPendientesSinDia(trabajadorId),
				NotificacionesResponse.de(conversacionesNoLeidas, servicioCorreo.acceso()));
	}

	/**
	 * Marca o desmarca una actividad desde el checklist (RF-038).
	 *
	 * <p>No escribe {@code actividad.estado}: el dominio de los estados sigue sin
	 * definir (D-04). Lo que hace es mover la ejecucion real (RF-022), que es el
	 * dato del que D-31 deriva "pendiente":
	 * <ul>
	 * <li><b>Marcar:</b> si ya hay una ejecucion finalizada no hace nada; si hay
	 * una abierta la finaliza; si no hay ninguna crea una finalizada.
	 * <li><b>Desmarcar:</b> limpia el cierre de las ejecuciones finalizadas sin
	 * borrar las filas, de modo que la actividad vuelve a estar pendiente sin
	 * perder su historial.
	 * </ul>
	 *
	 * <p>RN-06: solo el desarrollador asignado puede hacerlo. El 404 es el mismo
	 * si la actividad no existe o es de otra persona.
	 */
	@Transactional
	public ActividadDelDiaResponse cambiarEstadoActividad(Long actividadId, Long trabajadorId,
			boolean completada) {
		Actividad actividad = actividades.findByIdAndDesarrolladorId(actividadId, trabajadorId)
				.orElseThrow(() -> new RecursoNoEncontradoException(
						"La actividad no existe o no esta asignada a usted."));

		List<EjecucionActividad> ejecucionesDeLaActividad = ejecuciones
				.findByActividadIdOrderByIniciadaEnDesc(actividadId);

		if (completada) {
			boolean yaFinalizada = ejecucionesDeLaActividad.stream()
					.anyMatch(EjecucionActividad::estaFinalizada);
			if (!yaFinalizada) {
				EjecucionActividad abierta = ejecucionesDeLaActividad.stream()
						.filter(ejecucion -> !ejecucion.estaFinalizada())
						.findFirst()
						.orElse(null);
				if (abierta != null) {
					abierta.finalizar();
					ejecuciones.save(abierta);
				} else {
					EjecucionActividad nueva = new EjecucionActividad(actividad,
							actividad.getDesarrollador(), OBSERVACION_CHECKLIST);
					nueva.finalizar();
					ejecuciones.save(nueva);
				}
			}
		} else {
			List<EjecucionActividad> finalizadas = ejecucionesDeLaActividad.stream()
					.filter(EjecucionActividad::estaFinalizada)
					.toList();
			finalizadas.forEach(EjecucionActividad::reabrir);
			ejecuciones.saveAll(finalizadas);
		}

		return ActividadDelDiaResponse.de(actividad, LocalDate.now(), completada);
	}

	/**
	 * Orden del panel: primero la prioridad, que es lo que RF-038 exige, y dentro
	 * de la misma prioridad lo mas atrasado primero.
	 *
	 * <p>Las actividades sin prioridad van al final. No se les asume una: el
	 * dominio sigue sin acordar (D-29) y RF-019 no obliga a diligenciarla, asi que
	 * tratarlas como MEDIA seria inventar el dato.
	 */
	private static final Comparator<Actividad> POR_PRIORIDAD_Y_FECHA = Comparator
			.comparingInt(ServicioMiDia::severidad)
			.thenComparing(Actividad::getFechaPlanificada,
					Comparator.nullsLast(Comparator.naturalOrder()))
			.thenComparing(Actividad::getId);

	/** ALTA primero. Sin prioridad, al final: un valor mayor que cualquier ordinal. */
	private static int severidad(Actividad actividad) {
		PrioridadActividad prioridad = actividad.getPrioridad();
		return prioridad == null ? PrioridadActividad.values().length : prioridad.ordinal();
	}

	/** D-31: las que ya tienen una ejecucion finalizada no estan pendientes. */
	private Set<Long> idsTerminadas(List<Actividad> candidatas) {
		if (candidatas.isEmpty()) {
			// Con la lista vacia no se consulta: un 'in ()' no es SQL valido en
			// todos los motores.
			return Set.of();
		}
		List<Long> ids = candidatas.stream().map(Actividad::getId).toList();
		return Set.copyOf(ejecuciones.idsConEjecucionFinalizada(ids));
	}

	/**
	 * Actividades propias pendientes a las que nadie les puso dia.
	 *
	 * <p>El panel no las muestra pero si avisa de cuantas son, porque su ausencia
	 * podria parecer un error cuando en realidad falta que el lider las planifique.
	 */
	private long contarPendientesSinDia(Long trabajadorId) {
		List<Actividad> sinDia = actividades.findByDesarrolladorIdAndFechaPlanificadaIsNull(trabajadorId);
		Set<Long> terminadas = idsTerminadas(sinDia);
		return sinDia.stream().filter(actividad -> !terminadas.contains(actividad.getId())).count();
	}

}

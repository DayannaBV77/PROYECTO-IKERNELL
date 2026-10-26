package com.PROYECTO.IKERNELL.backend.midia;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.actividades.ActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.PrioridadActividad;
import com.PROYECTO.IKERNELL.backend.chat.ServicioHilos;
import com.PROYECTO.IKERNELL.backend.corporativo.ServicioAccesoCorreo;
import com.PROYECTO.IKERNELL.backend.midia.dto.ActividadDelDiaResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.MiDiaResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.NotificacionesResponse;

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * <p>No tiene reglas de negocio propias: COMPONE las de otros modulos. Las
 * actividades son las del repositorio de actividades, los no leidos los calcula
 * el servicio de hilos y el estado del correo lo decide el de servicios
 * corporativos. Deliberadamente no reimplementa nada de eso, para que el panel
 * no pueda acabar diciendo algo distinto de lo que dicen las pantallas de las que
 * saca los datos.
 *
 * <p>Solo lee. El acceso rapido al registro de interrupciones que pide RF-038
 * lleva al endpoint que ya existe (RF-024, HU-18): abrir aqui una via paralela
 * habria duplicado sus reglas de autorizacion y validacion.
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

	private final ActividadRepository actividades;
	private final EjecucionActividadRepository ejecuciones;
	private final ServicioHilos servicioHilos;
	private final ServicioAccesoCorreo servicioCorreo;

	public ServicioMiDia(ActividadRepository actividades, EjecucionActividadRepository ejecuciones,
			ServicioHilos servicioHilos, ServicioAccesoCorreo servicioCorreo) {
		this.actividades = actividades;
		this.ejecuciones = ejecuciones;
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

		List<ActividadDelDiaResponse> delDia = candidatas.stream()
				.filter(actividad -> !terminadas.contains(actividad.getId()))
				.sorted(POR_PRIORIDAD_Y_FECHA)
				.map(actividad -> ActividadDelDiaResponse.de(actividad, hoy))
				.toList();

		return MiDiaResponse.de(hoy, delDia, contarPendientesSinDia(trabajadorId),
				NotificacionesResponse.de(servicioHilos.totalNoLeidos(trabajadorId),
						servicioCorreo.acceso()));
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

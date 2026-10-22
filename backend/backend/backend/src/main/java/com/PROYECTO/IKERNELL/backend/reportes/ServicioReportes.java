package com.PROYECTO.IKERNELL.backend.reportes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.actividades.ActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.ServicioActividades;
import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.ActividadResponse;
import com.PROYECTO.IKERNELL.backend.actividades.dto.CriteriosBusquedaActividad;
import com.PROYECTO.IKERNELL.backend.incidencias.ServicioIncidencias;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.InterrupcionProyectoResponse;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ActividadConEjecucionesResponse;
import com.PROYECTO.IKERNELL.backend.reportes.dto.PeriodoConsulta;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ReporteActividadesProyectoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ReporteDesempenoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ReporteInterrupcionesResponse;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Reportes internos (RF-006, RF-017, RF-018).
 *
 * <p>Todos son de solo lectura y reutilizan los datos ya registrados por las
 * fases anteriores; no introducen reglas de negocio nuevas.
 */
@Service
public class ServicioReportes {

	/** Lo que la empresa debe definir para que RF-006 pueda medir desempeno (D-09). */
	private static final List<String> DATOS_PENDIENTES_DESEMPENO = List.of(
			"Que indicadores de desempeno debe mostrar el reporte (RF-006, HU-07 T1).",
			"Los estados posibles de una actividad, para saber cuales estan completadas (D-04).",
			"Que datos registra el desarrollador al ejecutar una actividad (D-04).",
			"Si el desempeno se mide por actividades cerradas, por tiempo invertido o de otra forma.");

	private final ActividadRepository actividades;
	private final EjecucionActividadRepository ejecuciones;
	private final ServicioActividades servicioActividades;
	private final ServicioIncidencias servicioIncidencias;
	private final ServicioProyectos servicioProyectos;
	private final ServicioTrabajadores servicioTrabajadores;

	public ServicioReportes(ActividadRepository actividades, EjecucionActividadRepository ejecuciones,
			ServicioActividades servicioActividades, ServicioIncidencias servicioIncidencias,
			ServicioProyectos servicioProyectos, ServicioTrabajadores servicioTrabajadores) {
		this.actividades = actividades;
		this.ejecuciones = ejecuciones;
		this.servicioActividades = servicioActividades;
		this.servicioIncidencias = servicioIncidencias;
		this.servicioProyectos = servicioProyectos;
		this.servicioTrabajadores = servicioTrabajadores;
	}

	/**
	 * RF-006, HU-07: desempeno y actividades de un desarrollador en un proyecto.
	 *
	 * <p>No exige que el trabajador tenga tipo DESARROLLADOR: por RN-05 un lider
	 * puede estar asignado como desarrollador en otro proyecto y su trabajo alli
	 * tambien debe poder revisarse.
	 *
	 * <p>El filtro por periodo se aplica sobre las FECHAS DE EJECUCION, no sobre
	 * la actividad: la actividad no tiene fecha propia en el modelo, asi que es la
	 * unica forma de resolver "las actividades que corresponden a ese periodo"
	 * (HU-07 C04). Consecuencia: una actividad sin ejecuciones queda fuera de
	 * cualquier periodo. Es una PROPUESTA que conviene validar con la empresa.
	 */
	@Transactional(readOnly = true)
	public ReporteDesempenoResponse desempenoDeDesarrollador(Long desarrolladorId, Long proyectoId,
			PeriodoConsulta periodo) {
		Trabajador desarrollador = servicioTrabajadores.obtener(desarrolladorId);
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);

		List<Actividad> encontradas = actividades
				.findByDesarrolladorIdAndEtapaProyectoIdOrderByIdDesc(desarrolladorId, proyectoId);
		Map<Long, List<EjecucionActividad>> ejecucionesPorActividad = ejecucionesDe(encontradas);

		List<ActividadConEjecucionesResponse> filas = new ArrayList<>();
		long actividadesConEjecucion = 0;
		long totalEjecuciones = 0;
		long ejecucionesFinalizadas = 0;

		for (Actividad actividad : encontradas) {
			List<EjecucionActividad> suyas = ejecucionesPorActividad
					.getOrDefault(actividad.getId(), List.of())
					.stream()
					.filter(ejecucion -> periodo.contiene(ejecucion.getIniciadaEn().toLocalDate()))
					.toList();

			// Con periodo definido, solo entran las actividades con ejecucion en el.
			if (periodo.estaDefinido() && suyas.isEmpty()) {
				continue;
			}
			filas.add(ActividadConEjecucionesResponse.de(actividad, suyas));
			if (!suyas.isEmpty()) {
				actividadesConEjecucion++;
			}
			totalEjecuciones += suyas.size();
			ejecucionesFinalizadas += suyas.stream()
					.filter(ejecucion -> ejecucion.getFinalizadaEn() != null)
					.count();
		}

		Map<String, Long> resumen = new LinkedHashMap<>();
		resumen.put("actividadesRegistradas", (long) filas.size());
		resumen.put("actividadesConEjecucionRegistrada", actividadesConEjecucion);
		resumen.put("ejecucionesRegistradas", totalEjecuciones);
		resumen.put("ejecucionesFinalizadas", ejecucionesFinalizadas);

		// HU-07 C03: aviso en lugar de un reporte vacio.
		String mensaje = filas.isEmpty()
				? "El desarrollador no tiene actividades registradas en este proyecto"
						+ (periodo.estaDefinido() ? " para el periodo indicado." : ".")
				: null;

		return new ReporteDesempenoResponse(
				desarrollador.getId(),
				desarrollador.nombreCompleto(),
				proyecto.getId(),
				proyecto.getNombre(),
				periodo.desde(),
				periodo.hasta(),
				filas,
				filas.size(),
				resumen,
				mensaje,
				DATOS_PENDIENTES_DESEMPENO);
	}

	/**
	 * RF-018, HU-14: actividades registradas en un proyecto con su desarrollador.
	 *
	 * <p>Reutiliza la busqueda de RF-020 en lugar de duplicar la consulta, de modo
	 * que los filtros del reporte y los de la busqueda no puedan divergir.
	 *
	 * <p>PROPUESTA: HU-14 T1 deja abierto "que filtros se podran usar en el
	 * reporte"; se ofrecen etapa y desarrollador, los mismos que ya admite RF-020.
	 */
	@Transactional(readOnly = true)
	public ReporteActividadesProyectoResponse actividadesDeProyecto(Long proyectoId, Long etapaId,
			Long desarrolladorId, Pageable paginacion) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);

		Page<Actividad> pagina = servicioActividades.buscar(
				new CriteriosBusquedaActividad(null, proyectoId, etapaId, desarrolladorId), paginacion);

		// HU-14 C03: aviso en lugar de un reporte vacio.
		String mensaje = pagina.getTotalElements() == 0
				? "El proyecto no tiene actividades registradas."
				: null;

		return new ReporteActividadesProyectoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				pagina.getContent().stream().map(ActividadResponse::de).toList(),
				pagina.getTotalElements(),
				pagina.getNumber(),
				pagina.getTotalPages(),
				mensaje);
	}

	/**
	 * RF-017, HU-15: interrupciones de un proyecto con tipo, fecha, duracion y fase.
	 *
	 * <p>Aqui el periodo se aplica sobre la fecha propia de la interrupcion, que
	 * si es un dato obligatorio del registro (RN-10), de modo que el filtro de
	 * HU-15 C04 no necesita ninguna interpretacion.
	 */
	@Transactional(readOnly = true)
	public ReporteInterrupcionesResponse interrupcionesDeProyecto(Long proyectoId, PeriodoConsulta periodo) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);

		List<InterrupcionProyecto> encontradas = servicioIncidencias.interrupcionesDeProyecto(proyectoId)
				.stream()
				.filter(interrupcion -> periodo.contiene(interrupcion.getFecha()))
				.toList();

		Map<String, BigDecimal> duracionPorUnidad = new LinkedHashMap<>();
		for (InterrupcionProyecto interrupcion : encontradas) {
			duracionPorUnidad.merge(
					interrupcion.getDuracionUnidad().name(),
					interrupcion.getDuracionValor(),
					BigDecimal::add);
		}

		// HU-15 C03: aviso en lugar de un reporte vacio.
		String mensaje = encontradas.isEmpty()
				? "El proyecto no tiene interrupciones registradas"
						+ (periodo.estaDefinido() ? " en el periodo indicado." : ".")
				: null;

		return new ReporteInterrupcionesResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				periodo.desde(),
				periodo.hasta(),
				encontradas.stream().map(InterrupcionProyectoResponse::de).toList(),
				encontradas.size(),
				duracionPorUnidad,
				mensaje);
	}

	/** Una sola consulta para las ejecuciones de todas las actividades del reporte. */
	private Map<Long, List<EjecucionActividad>> ejecucionesDe(List<Actividad> actividadesDelReporte) {
		if (actividadesDelReporte.isEmpty()) {
			return Map.of();
		}
		List<Long> ids = actividadesDelReporte.stream().map(Actividad::getId).toList();
		return ejecuciones.findByActividadIdInOrderByIniciadaEnDesc(ids).stream()
				.collect(Collectors.groupingBy(ejecucion -> ejecucion.getActividad().getId()));
	}

}

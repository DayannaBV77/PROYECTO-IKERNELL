package com.PROYECTO.IKERNELL.backend.reportes;

import java.time.LocalDate;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.reportes.dto.PeriodoConsulta;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ReporteActividadesProyectoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ReporteDesempenoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.dto.ReporteInterrupcionesResponse;

/**
 * Reportes internos (RF-006, RF-017, RF-018).
 *
 * <p>Cada reporte se reserva al actor que lo declara en el catalogo, y los
 * criterios lo refuerzan: "solo el coordinador genera este reporte" (HU-07 C05)
 * y "solo el lider genera este reporte" (HU-14 C05, HU-15 C05).
 */
@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

	private static final int TAMANO_MAXIMO_PAGINA = 200;

	private final ServicioReportes servicio;

	public ReporteController(ServicioReportes servicio) {
		this.servicio = servicio;
	}

	/**
	 * RF-006, HU-07: desempeno y actividades de un desarrollador en un proyecto.
	 *
	 * <p>Reservado al coordinador (HU-07 C05).
	 */
	@GetMapping("/desempeno")
	@PreAuthorize("hasRole('COORDINADOR')")
	public ReporteDesempenoResponse desempeno(
			@RequestParam Long desarrolladorId,
			@RequestParam Long proyectoId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
		return servicio.desempenoDeDesarrollador(desarrolladorId, proyectoId,
				PeriodoConsulta.de(desde, hasta));
	}

	/**
	 * RF-018, HU-14: actividades de un proyecto con su desarrollador asignado.
	 *
	 * <p>Reservado al lider (HU-14 C05).
	 */
	@GetMapping("/proyectos/{proyectoId}/actividades")
	@PreAuthorize("hasRole('LIDER')")
	public ReporteActividadesProyectoResponse actividadesPorProyecto(
			@PathVariable Long proyectoId,
			@RequestParam(required = false) Long etapaId,
			@RequestParam(required = false) Long desarrolladorId,
			@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "50") int tamano) {
		PageRequest paginacion = PageRequest.of(
				Math.max(pagina, 0),
				Math.min(Math.max(tamano, 1), TAMANO_MAXIMO_PAGINA),
				Sort.by(Sort.Direction.DESC, "id"));
		return servicio.actividadesDeProyecto(proyectoId, etapaId, desarrolladorId, paginacion);
	}

	/**
	 * RF-017, HU-15: interrupciones de un proyecto.
	 *
	 * <p>Reservado al lider (HU-15 C05).
	 */
	@GetMapping("/proyectos/{proyectoId}/interrupciones")
	@PreAuthorize("hasRole('LIDER')")
	public ReporteInterrupcionesResponse interrupcionesPorProyecto(
			@PathVariable Long proyectoId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
		return servicio.interrupcionesDeProyecto(proyectoId, PeriodoConsulta.de(desde, hasta));
	}

}

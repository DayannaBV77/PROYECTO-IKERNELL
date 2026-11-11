package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones.ResultadoAsignacionesCoordinador;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionLoteRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionLoteResponse;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionResponse;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ProyectoAsignacionResponse;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.CriteriosBusquedaProyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.ProyectoResumenResponse;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;
import com.PROYECTO.IKERNELL.backend.shared.dto.PaginaResponse;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.validation.Valid;

/**
 * Asignacion de trabajadores a proyectos por el coordinador (RF-003, HU-06).
 *
 * <p>Reservado al coordinador: es el actor que RF-003 declara y HU-06 confirma
 * ("solo el coordinador hace esta asignacion").
 */
@RestController
@RequestMapping("/api/asignaciones")
@PreAuthorize("hasRole('COORDINADOR')")
public class AsignacionController {

	private static final int TAMANO_MAXIMO_PAGINA = 100;

	private final ServicioAsignaciones servicio;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioProyectos servicioProyectos;

	public AsignacionController(ServicioAsignaciones servicio, ServicioTrabajadores servicioTrabajadores,
			ServicioProyectos servicioProyectos) {
		this.servicio = servicio;
		this.servicioTrabajadores = servicioTrabajadores;
		this.servicioProyectos = servicioProyectos;
	}

	/**
	 * RF-003, HU-06 C01: proyectos a los que se puede asignar un trabajador.
	 *
	 * <p>Sin este endpoint el coordinador tendria que conocer de memoria los
	 * identificadores que la asignacion le exige enviar: la gestion de proyectos
	 * esta reservada al lider (RNF-001) y responde 403 a cualquier otro.
	 *
	 * <p>Entrega lo justo para elegir -la misma vista resumida que ya usa la
	 * busqueda de proyectos- sin abrir el modulo completo, que es lo que decidiria
	 * la ambiguedad A-01.
	 *
	 * <p>Solo los habilitados: asignar a un proyecto inhabilitado lo rechaza la
	 * propia operacion (C02), de modo que ofrecerlo seria ofrecer un fracaso.
	 */
	@GetMapping("/proyectos-asignables")
	public ListaResponse<ProyectoResumenResponse> proyectosAsignables() {
		List<ProyectoResumenResponse> lista = servicioProyectos.habilitados().stream()
				.map(ProyectoResumenResponse::de).toList();
		return ListaResponse.de(lista, "No hay proyectos habilitados a los que asignar trabajadores.");
	}

	/** Busqueda paginada de proyectos para la gestion de equipo del coordinador. */
	@GetMapping("/proyectos")
	public PaginaResponse<ProyectoAsignacionResponse> buscarProyectos(
			@RequestParam(required = false) String q,
			@RequestParam(required = false) EstadoHabilitacion estado,
			@RequestParam(defaultValue = "recientes") String orden,
			@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "12") int tamano) {
		CriteriosBusquedaProyecto criterios = criteriosDe(q, estado);
		PageRequest paginacion = PageRequest.of(
				Math.max(pagina, 0),
				Math.min(Math.max(tamano, 1), TAMANO_MAXIMO_PAGINA),
				ordenar(orden));
		Page<Proyecto> resultado = servicioProyectos.buscar(criterios, paginacion);
		List<Long> ids = resultado.getContent().stream()
				.map(Proyecto::getId)
				.toList();
		Map<Long, Long> conteos = servicio.conteosActivosPorProyecto(ids);
		Page<ProyectoAsignacionResponse> respuesta = resultado.map(proyecto ->
				ProyectoAsignacionResponse.de(proyecto, conteos.getOrDefault(proyecto.getId(), 0L)));
		return PaginaResponse.de(respuesta, "No hay proyectos que coincidan con los criterios indicados.");
	}

	/** Detalle de proyecto de solo lectura para el coordinador de asignaciones. */
	@GetMapping("/proyectos/{proyectoId}")
	public ProyectoAsignacionResponse detalleDeProyecto(@PathVariable Long proyectoId) {
		var proyecto = servicioProyectos.obtenerConLiderResponsable(proyectoId);
		long integrantes = servicio.conteosActivosPorProyecto(List.of(proyectoId))
				.getOrDefault(proyectoId, 0L);
		return ProyectoAsignacionResponse.de(proyecto, integrantes);
	}

	/** Equipo activo completo, incluyendo todas las asignaciones por rol. */
	@GetMapping("/proyectos/{proyectoId}/equipo")
	public List<AsignacionResponse> equipoDelProyecto(@PathVariable Long proyectoId) {
		return servicio.equipoCompletoDeProyecto(proyectoId).stream()
				.map(AsignacionResponse::de)
				.toList();
	}

	/** Registro de equipo con rol por persona en una sola transaccion. */
	@PostMapping("/proyectos/{proyectoId}/equipo")
	public AsignacionLoteResponse asignarEquipo(
			@PathVariable Long proyectoId,
			@Valid @RequestBody AsignacionLoteRequest peticion,
			@RequestParam(defaultValue = "false") boolean confirmado,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		Trabajador coordinador = servicioTrabajadores.obtener(autenticado.getTrabajadorId());
		ResultadoAsignacionesCoordinador resultado = servicio.asignarEquipoCoordinador(
				proyectoId, peticion.asignaciones(), coordinador, confirmado);
		return new AsignacionLoteResponse(
				resultado.asignadas().stream().map(AsignacionResponse::de).toList(),
				resultado.yaExistentes().stream().map(AsignacionResponse::de).toList());
	}

	/**
	 * RF-003, HU-06 C01: registra la asignacion.
	 *
	 * <p>Con una asignacion equivalente activa y {@code confirmado=false}
	 * responde 409 con la advertencia y no registra nada, para que el coordinador
	 * la revise antes de continuar (HU-06 C04).
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AsignacionResponse asignar(@Valid @RequestBody AsignacionRequest peticion,
			@RequestParam(defaultValue = "false") boolean confirmado,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		Trabajador coordinador = servicioTrabajadores.obtener(autenticado.getTrabajadorId());
		return AsignacionResponse.de(servicio.asignarTrabajador(peticion, coordinador, confirmado));
	}

	private CriteriosBusquedaProyecto criteriosDe(String consulta, EstadoHabilitacion estado) {
		if (consulta == null || consulta.isBlank()) {
			return new CriteriosBusquedaProyecto(null, null, estado);
		}
		String texto = consulta.trim();
		String idTexto = texto.replaceFirst("(?i)^PRY-", "");
		if (idTexto.matches("\\d+")) {
			try {
				return new CriteriosBusquedaProyecto(Long.valueOf(idTexto), null, estado);
			}
			catch (NumberFormatException error) {
				throw new ResponseStatusException(
						HttpStatus.BAD_REQUEST, "El identificador del proyecto no es valido.", error);
			}
		}
		return new CriteriosBusquedaProyecto(null, texto, estado);
	}

	private Sort ordenar(String orden) {
		return switch (orden) {
			case "recientes" -> Sort.by(
					Sort.Order.desc("fechaCreacion").nullsLast(),
					Sort.Order.desc("id"));
			case "nombre" -> Sort.by(Sort.Order.asc("nombre"), Sort.Order.asc("id"));
			default -> throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST, "El orden debe ser 'recientes' o 'nombre'.");
		};
	}

	/** HU-06 C05: consulta las asignaciones registradas de un trabajador. */
	@GetMapping("/trabajador/{trabajadorId}")
	public List<AsignacionResponse> deTrabajador(@PathVariable Long trabajadorId) {
		return servicio.asignacionesDeTrabajador(trabajadorId).stream().map(AsignacionResponse::de).toList();
	}

	/** HU-06 C05: consulta las asignaciones registradas de un proyecto. */
	@GetMapping("/proyecto/{proyectoId}")
	public List<AsignacionResponse> deProyecto(@PathVariable Long proyectoId) {
		return servicio.asignacionesDeProyecto(proyectoId).stream().map(AsignacionResponse::de).toList();
	}

}

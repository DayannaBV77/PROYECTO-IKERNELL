package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.List;

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

import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionResponse;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
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

	private final ServicioAsignaciones servicio;
	private final ServicioTrabajadores servicioTrabajadores;

	public AsignacionController(ServicioAsignaciones servicio, ServicioTrabajadores servicioTrabajadores) {
		this.servicio = servicio;
		this.servicioTrabajadores = servicioTrabajadores;
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

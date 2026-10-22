package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones.ResultadoLote;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionEquipoRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionResponse;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ResultadoAsignacionEquipoResponse;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.validation.Valid;

/**
 * Equipo de trabajo de un proyecto (RF-009, HU-10).
 *
 * <p>Reservado al lider, el actor que declara RF-009. Anidado bajo el proyecto
 * porque el equipo solo tiene sentido referido a uno.
 *
 * <p>PENDIENTE A-02: HU-10 dice "solo el lider asigna el equipo de SU proyecto",
 * pero no se comprueba que sea el responsable del proyecto concreto. Ese nivel 2
 * queda pendiente de confirmar si un lider puede intervenir en proyectos de
 * otro lider.
 */
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/equipo")
@PreAuthorize("hasRole('LIDER')")
public class EquipoProyectoController {

	private final ServicioAsignaciones servicio;
	private final ServicioTrabajadores servicioTrabajadores;

	public EquipoProyectoController(ServicioAsignaciones servicio, ServicioTrabajadores servicioTrabajadores) {
		this.servicio = servicio;
		this.servicioTrabajadores = servicioTrabajadores;
	}

	/**
	 * RF-009, HU-10 C01: asigna uno o varios desarrolladores.
	 *
	 * <p>Devuelve 200 con el detalle de asignados y rechazados, en lugar de
	 * fallar en bloque: HU-10 C03 rechaza al desarrollador inhabilitado concreto,
	 * no al lote.
	 */
	@PostMapping
	public ResultadoAsignacionEquipoResponse asignarDesarrolladores(@PathVariable Long proyectoId,
			@Valid @RequestBody AsignacionEquipoRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		Trabajador lider = servicioTrabajadores.obtener(autenticado.getTrabajadorId());
		ResultadoLote resultado = servicio.asignarEquipo(proyectoId, peticion.desarrolladorIds(), lider);
		return new ResultadoAsignacionEquipoResponse(
				resultado.asignados().stream().map(AsignacionResponse::de).toList(),
				resultado.rechazados());
	}

	/** HU-10 C05: consulta el equipo asignado al proyecto. */
	@GetMapping
	public List<AsignacionResponse> consultarEquipo(@PathVariable Long proyectoId) {
		return servicio.equipoDeProyecto(proyectoId).stream().map(AsignacionResponse::de).toList();
	}

}

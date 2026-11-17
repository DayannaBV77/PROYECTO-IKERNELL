package com.PROYECTO.IKERNELL.backend.asignaciones;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ContextoProyectoRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ContextoProyectoResponse;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/**
 * Endpoints para consultar y cambiar el contexto de proyecto y rol activo de la sesión.
 */
@RestController
@RequestMapping("/api/contexto-proyecto")
public class ContextoProyectoController {

	private final ServicioContextoProyecto servicioContexto;

	public ContextoProyectoController(ServicioContextoProyecto servicioContexto) {
		this.servicioContexto = servicioContexto;
	}

	/** Consulta el contexto de proyecto y rol activo de la sesión. */
	@GetMapping("/activo")
	public ContextoProyectoResponse obtenerContexto(
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return servicioContexto.obtenerContextoActual(autenticado);
	}

	/** Cambia el proyecto y rol activo en la sesión. */
	@PostMapping("/activo")
	public ContextoProyectoResponse cambiarContexto(
			@Valid @RequestBody ContextoProyectoRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado,
			HttpServletRequest request,
			HttpServletResponse response) {
		return servicioContexto.cambiarContexto(peticion, autenticado, request, response);
	}

	/** Limpia el contexto de proyecto activo volviendo al modo base. */
	@DeleteMapping("/activo")
	public ContextoProyectoResponse limpiarContexto(
			@AuthenticationPrincipal TrabajadorAutenticado autenticado,
			HttpServletRequest request,
			HttpServletResponse response) {
		return servicioContexto.limpiarContexto(autenticado, request, response);
	}

}

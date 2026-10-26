package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.ErrorProyectoResponse;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.InterrupcionProyectoResponse;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.RegistroErrorRequest;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.RegistroInterrupcionRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Errores e interrupciones de un proyecto (RF-023, RF-024).
 *
 * <p>Las operaciones de registro NO llevan restriccion por rol: el permiso lo
 * comprueba el servicio exigiendo una asignacion activa como desarrollador en
 * ese proyecto (nivel 2). Asi el coordinador y el lider quedan excluidos
 * (HU-17 C05, HU-18 C05) pero un lider asignado como desarrollador si puede
 * registrar alli (RN-05).
 *
 * <p>Las consultas si se reservan al lider, que es quien revisa estos hechos
 * segun HU-18 C04.
 */
@RestController
@RequestMapping("/api")
public class IncidenciaController {

	private final ServicioIncidencias servicio;

	public IncidenciaController(ServicioIncidencias servicio) {
		this.servicio = servicio;
	}

	// D-36: la fase que RN-10 exige indicar es una etapa del proyecto, asi que ya
	// no hay catalogo de fases que publicar aqui. El desarrollador escoge entre
	// las etapas de su proyecto, que entrega el modulo de proyectos
	// (GET /api/proyectos/{id}/etapas).

	/** RF-023, HU-17 C01: registra un error del proyecto. */
	@PostMapping("/proyectos/{proyectoId}/errores")
	@ResponseStatus(HttpStatus.CREATED)
	public ErrorProyectoResponse registrarError(@PathVariable Long proyectoId,
			@Valid @RequestBody RegistroErrorRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return ErrorProyectoResponse.de(
				servicio.registrarError(proyectoId, peticion, autenticado.getTrabajadorId()));
	}

	/** RF-024, HU-18 C01: registra una interrupcion del proyecto. */
	@PostMapping("/proyectos/{proyectoId}/interrupciones")
	@ResponseStatus(HttpStatus.CREATED)
	public InterrupcionProyectoResponse registrarInterrupcion(@PathVariable Long proyectoId,
			@Valid @RequestBody RegistroInterrupcionRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return InterrupcionProyectoResponse.de(
				servicio.registrarInterrupcion(proyectoId, peticion, autenticado.getTrabajadorId()));
	}

	/** HU-18 C04: el lider consulta las interrupciones registradas del proyecto. */
	@GetMapping("/proyectos/{proyectoId}/interrupciones")
	@PreAuthorize("hasRole('LIDER')")
	public ListaResponse<InterrupcionProyectoResponse> interrupciones(@PathVariable Long proyectoId) {
		List<InterrupcionProyectoResponse> lista = servicio.interrupcionesDeProyecto(proyectoId)
				.stream().map(InterrupcionProyectoResponse::de).toList();
		return ListaResponse.de(lista, "El proyecto no tiene interrupciones registradas.");
	}

	/**
	 * Errores registrados del proyecto.
	 *
	 * <p>PROPUESTA: ningun RF define quien consulta los errores ni existe un
	 * reporte de errores equivalente al de interrupciones (RF-017). Sin esta
	 * consulta, lo que HU-17 manda documentar no seria recuperable por nadie.
	 */
	@GetMapping("/proyectos/{proyectoId}/errores")
	@PreAuthorize("hasRole('LIDER')")
	public ListaResponse<ErrorProyectoResponse> errores(@PathVariable Long proyectoId) {
		List<ErrorProyectoResponse> lista = servicio.erroresDeProyecto(proyectoId)
				.stream().map(ErrorProyectoResponse::de).toList();
		return ListaResponse.de(lista, "El proyecto no tiene errores registrados.");
	}

}

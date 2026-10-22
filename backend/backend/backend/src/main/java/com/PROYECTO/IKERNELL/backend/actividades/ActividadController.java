package com.PROYECTO.IKERNELL.backend.actividades;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.actividades.dto.ActividadResponse;
import com.PROYECTO.IKERNELL.backend.actividades.dto.CriteriosBusquedaActividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.ModificacionActividadRequest;
import com.PROYECTO.IKERNELL.backend.actividades.dto.RegistroActividadRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.PaginaResponse;

import jakarta.validation.Valid;

/**
 * Registro, busqueda y modificacion de actividades (RF-019, RF-020, RF-021).
 *
 * <p>Reservado al lider de proyectos, el actor que declaran los tres
 * requerimientos. RN-07 queda garantizada por construccion: solo el lider crea
 * actividades, de modo que un desarrollador nunca puede ejecutar algo que no
 * haya registrado antes su lider.
 *
 * <p>PENDIENTE A-02: no se comprueba que sea el lider del proyecto concreto.
 */
@RestController
@RequestMapping("/api/actividades")
@PreAuthorize("hasRole('LIDER')")
public class ActividadController {

	private static final int TAMANO_MAXIMO_PAGINA = 100;

	private final ServicioActividades servicio;

	public ActividadController(ServicioActividades servicio) {
		this.servicio = servicio;
	}

	/**
	 * RF-019, HU-13 C01: registra la actividad en una etapa del proyecto.
	 *
	 * <p>Si el desarrollador no esta asignado al proyecto responde 409 con la
	 * advertencia; se repite con {@code confirmado=true} para continuar (D-24).
	 */
	@PostMapping("/proyecto/{proyectoId}")
	@ResponseStatus(HttpStatus.CREATED)
	public ActividadResponse registrar(@PathVariable Long proyectoId,
			@Valid @RequestBody RegistroActividadRequest peticion,
			@RequestParam(defaultValue = "false") boolean confirmado) {
		return ActividadResponse.de(servicio.registrar(proyectoId, peticion, confirmado));
	}

	/** RF-020, HU-13 C03 y C04. */
	@GetMapping
	public PaginaResponse<ActividadResponse> buscar(
			@RequestParam(required = false) Long identificador,
			@RequestParam(required = false) Long proyectoId,
			@RequestParam(required = false) Long etapaId,
			@RequestParam(required = false) Long desarrolladorId,
			@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "20") int tamano) {

		CriteriosBusquedaActividad criterios = new CriteriosBusquedaActividad(
				identificador, proyectoId, etapaId, desarrolladorId);
		PageRequest paginacion = PageRequest.of(
				Math.max(pagina, 0),
				Math.min(Math.max(tamano, 1), TAMANO_MAXIMO_PAGINA),
				Sort.by(Sort.Direction.DESC, "id"));

		Page<ActividadResponse> resultado = servicio.buscar(criterios, paginacion).map(ActividadResponse::de);
		return PaginaResponse.de(resultado, "No hay actividades que coincidan con los criterios indicados.");
	}

	/** RF-020: abre el detalle de la actividad para revisarla (HU-13 C03). */
	@GetMapping("/{id}")
	public ActividadResponse obtener(@PathVariable Long id) {
		return ActividadResponse.de(servicio.obtener(id));
	}

	/** RF-021, HU-13 C05. */
	@PutMapping("/{id}")
	public ActividadResponse modificar(@PathVariable Long id,
			@Valid @RequestBody ModificacionActividadRequest peticion) {
		return ActividadResponse.de(servicio.modificar(id, peticion));
	}

}

package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.CriteriosBusquedaProyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.EstadoProyectoResponse;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.ModificacionProyectoRequest;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.ProyectoResponse;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.ProyectoResumenResponse;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.RegistroProyectoRequest;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.shared.dto.PaginaResponse;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.validation.Valid;

/**
 * Gestion de proyectos (RF-008, RF-013 a RF-016).
 *
 * <p>Reservado al lider de proyectos, que es el actor que el catalogo asigna a
 * estos requerimientos (nivel 1 de autorizacion).
 *
 * <p>PENDIENTE A-01: HU-08 C05, HU-12 C05 y los criterios de los reportes
 * ejemplifican el rechazo con un desarrollador, pero no dicen si el coordinador
 * queda tambien excluido. Se aplica el actor declarado.
 *
 * <p>PENDIENTE A-02: no se comprueba que el lider sea el responsable DEL
 * proyecto concreto. Ese nivel 2 queda deshabilitado hasta que se confirme si un
 * lider puede gestionar proyectos de otro lider.
 */
@RestController
@RequestMapping("/api/proyectos")
@PreAuthorize("hasRole('LIDER')")
public class ProyectoController {

	private static final int TAMANO_MAXIMO_PAGINA = 100;

	private final ServicioProyectos servicio;
	private final TrabajadorRepository trabajadores;

	public ProyectoController(ServicioProyectos servicio, TrabajadorRepository trabajadores) {
		this.servicio = servicio;
		this.trabajadores = trabajadores;
	}

	/** RF-008, HU-08 C01: registra el proyecto y devuelve su identificador. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProyectoResponse registrar(@Valid @RequestBody RegistroProyectoRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		Trabajador lider = (autenticado != null)
				? trabajadores.findById(autenticado.getTrabajadorId()).orElse(null)
				: null;
		return ProyectoResponse.de(servicio.registrar(peticion, lider));
	}

	/** RF-013, HU-09 C01 y C02. */
	@GetMapping
	public PaginaResponse<ProyectoResumenResponse> buscar(
			@RequestParam(required = false) Long identificador,
			@RequestParam(required = false) String nombre,
			@RequestParam(required = false) EstadoHabilitacion estado,
			@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "20") int tamano) {

		CriteriosBusquedaProyecto criterios = new CriteriosBusquedaProyecto(identificador, nombre, estado);
		PageRequest paginacion = PageRequest.of(
				Math.max(pagina, 0),
				Math.min(Math.max(tamano, 1), TAMANO_MAXIMO_PAGINA),
				Sort.by("nombre"));

		Page<ProyectoResumenResponse> resultado = servicio.buscar(criterios, paginacion)
				.map(ProyectoResumenResponse::de);
		return PaginaResponse.de(resultado, "No hay proyectos que coincidan con los criterios indicados.");
	}

	/** RF-013: abre el detalle desde la lista de resultados (HU-09 C01). */
	@GetMapping("/{id}")
	public ProyectoResponse obtener(@PathVariable Long id) {
		return ProyectoResponse.de(servicio.obtener(id));
	}

	/** RF-014, HU-09 C03. */
	@PutMapping("/{id}")
	public ProyectoResponse modificar(@PathVariable Long id,
			@Valid @RequestBody ModificacionProyectoRequest peticion) {
		return ProyectoResponse.de(servicio.modificar(id, peticion));
	}

	/**
	 * Advertencias previas a la inhabilitacion (HU-09 C05).
	 *
	 * <p>Permite a la interfaz mostrarlas antes de pedir la confirmacion.
	 */
	@GetMapping("/{id}/inhabilitacion/advertencias")
	public List<String> advertenciasDeInhabilitacion(@PathVariable Long id) {
		return servicio.advertenciasAntesDeInhabilitar(id);
	}

	/**
	 * RF-015, HU-09 C05: inhabilita conservando el historial.
	 *
	 * <p>Con advertencias pendientes y {@code confirmado=false} responde 409 con
	 * la lista y no modifica nada, de modo que la confirmacion no se pueda omitir
	 * ni siquiera llamando directamente a la API.
	 */
	@PostMapping("/{id}/inhabilitacion")
	public ProyectoResponse inhabilitar(@PathVariable Long id,
			@RequestParam(defaultValue = "false") boolean confirmado) {
		return ProyectoResponse.de(servicio.inhabilitar(id, confirmado));
	}

	/** RF-016, HU-12: estado registrado y datos de avance disponibles. */
	@GetMapping("/{id}/estado")
	public EstadoProyectoResponse consultarEstado(@PathVariable Long id) {
		return servicio.consultarEstado(id);
	}

}

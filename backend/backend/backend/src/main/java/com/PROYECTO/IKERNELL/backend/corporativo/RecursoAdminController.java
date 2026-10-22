package com.PROYECTO.IKERNELL.backend.corporativo;

import java.util.List;

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

import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.RecursoResumenResponse;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.RegistroRecursoRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Administracion de la biblioteca de programas y de los tutoriales.
 *
 * <p><b>CONTROLADOR PROPUESTO.</b> Ningun RF lo describe: RF-029 deja a la
 * empresa "la forma de busqueda, descarga, versiones y permisos" y RF-030 "la
 * administracion, clasificacion, formato y actualizacion". Sin el, la biblioteca
 * y los tutoriales estarian permanentemente vacios.
 *
 * <p>PENDIENTE D-26: se reserva al coordinador por el mismo criterio que la
 * administracion del contenido publico, y la empresa debe confirmar quien
 * administra estos recursos.
 */
@RestController
@RequestMapping("/api/admin/recursos")
@PreAuthorize("hasRole('COORDINADOR')")
public class RecursoAdminController {

	private final ServicioRecursosInternos servicio;

	public RecursoAdminController(ServicioRecursosInternos servicio) {
		this.servicio = servicio;
	}

	/** Recursos de un tipo, incluyendo los borradores sin publicar. */
	@GetMapping
	public ListaResponse<RecursoResumenResponse> listar(@RequestParam TipoRecurso tipo) {
		List<RecursoResumenResponse> lista = servicio.listarCompleto(tipo).stream()
				.map(RecursoResumenResponse::administrativa).toList();
		return ListaResponse.de(lista, "Aun no hay recursos registrados de este tipo.");
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public RecursoResumenResponse crear(@Valid @RequestBody RegistroRecursoRequest peticion) {
		return RecursoResumenResponse.administrativa(servicio.crear(peticion));
	}

	@PutMapping("/{id}")
	public RecursoResumenResponse actualizar(@PathVariable Long id,
			@Valid @RequestBody RegistroRecursoRequest peticion) {
		return RecursoResumenResponse.administrativa(servicio.actualizar(id, peticion));
	}

	/** Publica o retira el recurso, sin borrarlo (coherente con RN-02). */
	@PostMapping("/{id}/publicacion")
	public RecursoResumenResponse cambiarPublicacion(@PathVariable Long id,
			@RequestParam boolean publicada) {
		return RecursoResumenResponse.administrativa(servicio.cambiarPublicacion(id, publicada));
	}

}

package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.proyectos.dto.EtapaResponse;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.RegistroEtapaRequest;

import jakarta.validation.Valid;

/**
 * Gestion de las etapas de un proyecto (RF-010, RF-011, RF-012).
 *
 * <p>Anidado bajo el proyecto porque la etapa no existe sin el (RF-010), lo que
 * hace imposible registrar una etapa sin indicar a que proyecto pertenece.
 *
 * <p>Reservado al lider de proyectos (nivel 1). Igual que en proyectos, el nivel
 * 2 no se aplica hasta resolver A-02.
 */
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/etapas")
@PreAuthorize("hasRole('LIDER')")
public class EtapaController {

	private final ServicioEtapas servicio;

	public EtapaController(ServicioEtapas servicio) {
		this.servicio = servicio;
	}

	/** RF-010, HU-11 C01. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public EtapaResponse registrar(@PathVariable Long proyectoId,
			@Valid @RequestBody RegistroEtapaRequest peticion) {
		return EtapaResponse.de(servicio.registrar(proyectoId, peticion));
	}

	/** Lista de etapas del proyecto, origen de la seleccion de HU-11. */
	@GetMapping
	public List<EtapaResponse> listar(@PathVariable Long proyectoId) {
		return servicio.listar(proyectoId).stream().map(EtapaResponse::de).toList();
	}

	@GetMapping("/{etapaId}")
	public EtapaResponse obtener(@PathVariable Long proyectoId, @PathVariable Long etapaId) {
		return EtapaResponse.de(servicio.obtener(proyectoId, etapaId));
	}

	/** RF-011, HU-11 C03. */
	@PutMapping("/{etapaId}")
	public EtapaResponse modificar(@PathVariable Long proyectoId, @PathVariable Long etapaId,
			@Valid @RequestBody RegistroEtapaRequest peticion) {
		return EtapaResponse.de(servicio.modificar(proyectoId, etapaId, peticion));
	}

	/**
	 * RF-012, HU-11 C04 y C05: elimina la etapa si no tiene registros asociados.
	 *
	 * <p>Es la unica operacion de borrado real del sistema, y solo porque RF-012
	 * la pide explicitamente; el resto del modelo usa inhabilitacion (RN-02).
	 */
	@DeleteMapping("/{etapaId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Long proyectoId, @PathVariable Long etapaId) {
		servicio.eliminar(proyectoId, etapaId);
	}

}

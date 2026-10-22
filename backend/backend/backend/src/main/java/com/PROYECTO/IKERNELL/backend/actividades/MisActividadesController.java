package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.actividades.dto.ActividadResponse;
import com.PROYECTO.IKERNELL.backend.actividades.dto.EjecucionResponse;
import com.PROYECTO.IKERNELL.backend.actividades.dto.RegistroEjecucionRequest;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Consulta y ejecucion de las actividades propias (RF-022, HU-16).
 *
 * <p>No lleva restriccion por rol, y es deliberado. El permiso no depende del
 * tipo global del trabajador sino de que la actividad este asignada a quien la
 * pide (RN-06), que es el <b>nivel 2</b> de autorizacion. Asi un lider asignado
 * como desarrollador en otro proyecto ejecuta sus actividades alli "igual que
 * cualquier desarrollador" (HU-16 C05, RN-05), lo que resuelve C-06.
 *
 * <p>Basta con estar autenticado, condicion que ya impone la configuracion de
 * seguridad para todo lo que no sea publico.
 */
@RestController
@RequestMapping("/api/mis-actividades")
public class MisActividadesController {

	private final ServicioActividades servicio;

	public MisActividadesController(ServicioActividades servicio) {
		this.servicio = servicio;
	}

	/**
	 * HU-16 C01 y C04: las actividades asignadas al trabajador autenticado.
	 *
	 * <p>Cuando no tiene ninguna, devuelve el aviso en lugar de una lista vacia
	 * a secas (RN-14).
	 */
	@GetMapping
	public ListaResponse<ActividadResponse> misActividades(
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		List<ActividadResponse> actividades = servicio.misActividades(autenticado.getTrabajadorId())
				.stream().map(ActividadResponse::de).toList();
		return ListaResponse.de(actividades, "No tiene actividades asignadas.");
	}

	/** RF-022, HU-16 C02 y C03: registra la ejecucion de una actividad propia. */
	@PostMapping("/{actividadId}/ejecucion")
	@ResponseStatus(HttpStatus.CREATED)
	public EjecucionResponse registrarEjecucion(@PathVariable Long actividadId,
			@Valid @RequestBody RegistroEjecucionRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return EjecucionResponse.de(
				servicio.registrarEjecucion(actividadId, autenticado.getTrabajadorId(), peticion));
	}

}

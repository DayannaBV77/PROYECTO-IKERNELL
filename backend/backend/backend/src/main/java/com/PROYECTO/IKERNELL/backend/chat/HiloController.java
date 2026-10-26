package com.PROYECTO.IKERNELL.backend.chat;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.chat.dto.HiloResponse;
import com.PROYECTO.IKERNELL.backend.chat.dto.MensajeResponse;
import com.PROYECTO.IKERNELL.backend.chat.dto.RegistroHiloRequest;
import com.PROYECTO.IKERNELL.backend.chat.dto.RegistroMensajeRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Hilos de conversacion por proyecto y etapa (RF-037, HU-22).
 *
 * <p>No lleva restriccion por rol, y es deliberado: el permiso no depende del
 * tipo global del trabajador sino de su asignacion activa en el proyecto, que es
 * el <b>nivel 2</b> y lo resuelve el servicio. HU-22 habla de "el trabajador
 * asignado a un proyecto", sin distinguir si es desarrollador o lider.
 *
 * <p>Los hilos cuelgan del proyecto porque no existen sin el; los mensajes
 * cuelgan del hilo por la misma razon. Asi el identificador del proyecto no
 * puede faltar ni contradecir al del hilo.
 *
 * <p>NO atiende RF-028 (chat corporativo libre: conversaciones individuales,
 * grupos, disponibilidad), que sigue sin definir por D-12.
 */
@RestController
@RequestMapping("/api")
public class HiloController {

	private final ServicioHilos servicio;

	public HiloController(ServicioHilos servicio) {
		this.servicio = servicio;
	}

	/**
	 * HU-22 C01 y C03: hilos disponibles del proyecto.
	 *
	 * <p>Con {@code etapaId} se limita a los de esa etapa; sin el llegan todos los
	 * del proyecto, incluidos los de sus etapas.
	 */
	@GetMapping("/proyectos/{proyectoId}/hilos")
	public ListaResponse<HiloResponse> hilos(@PathVariable Long proyectoId,
			@RequestParam(required = false) Long etapaId,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		List<HiloResponse> lista = servicio
				.hilosDeProyecto(proyectoId, etapaId, autenticado.getTrabajadorId())
				.stream().map(HiloResponse::de).toList();
		return ListaResponse.de(lista,
				"Este proyecto todavia no tiene conversaciones registradas.");
	}

	/** RF-037, HU-22 C03: crea un hilo del proyecto o de una de sus etapas. */
	@PostMapping("/proyectos/{proyectoId}/hilos")
	@ResponseStatus(HttpStatus.CREATED)
	public HiloResponse crearHilo(@PathVariable Long proyectoId,
			@Valid @RequestBody RegistroHiloRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return HiloResponse.de(servicio.crearHilo(proyectoId, peticion, autenticado.getTrabajadorId()));
	}

	/** Datos del hilo, para abrirlo desde la lista. */
	@GetMapping("/hilos/{hiloId}")
	public HiloResponse hilo(@PathVariable Long hiloId,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return HiloResponse.de(servicio.obtenerHilo(hiloId, autenticado.getTrabajadorId()));
	}

	/**
	 * HU-22 C05: mensajes registrados del hilo, con su autor y su fecha.
	 *
	 * <p>Consultarlos marca el hilo como leido hasta el ultimo mensaje entregado,
	 * de modo que el contador de no leidos refleja lo que queda por ver.
	 */
	@GetMapping("/hilos/{hiloId}/mensajes")
	public ListaResponse<MensajeResponse> mensajes(@PathVariable Long hiloId,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		List<MensajeResponse> lista = servicio.mensajesDe(hiloId, autenticado.getTrabajadorId())
				.stream().map(MensajeResponse::de).toList();
		return ListaResponse.de(lista, "Este hilo todavia no tiene mensajes.");
	}

	/** RF-037, HU-22 C02: envia un mensaje al hilo. */
	@PostMapping("/hilos/{hiloId}/mensajes")
	@ResponseStatus(HttpStatus.CREATED)
	public MensajeResponse enviarMensaje(@PathVariable Long hiloId,
			@Valid @RequestBody RegistroMensajeRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return MensajeResponse.de(
				servicio.enviarMensaje(hiloId, peticion, autenticado.getTrabajadorId()));
	}

}

package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

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
import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;
import com.PROYECTO.IKERNELL.backend.publico.dto.ConsultaResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.ContenidoResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroContenidoRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Administracion del contenido publico y de las consultas recibidas.
 *
 * <p><b>ESTE CONTROLADOR COMPLETO ES UNA PROPUESTA.</b> Ningun requerimiento lo
 * describe. RF-032 a RF-036 definen unicamente como se MUESTRA el contenido, y
 * RF-032 lo admite de forma textual: "el proceso para actualizarlo debe
 * definirse con la empresa". Lo mismo con las consultas: HU-02 T2 deja abierto
 * "quien recibira y atendera las consultas".
 *
 * <p>Sin estos endpoints, el contenido solo podria entrar manipulando la base de
 * datos y las consultas recibidas no serian legibles por nadie.
 *
 * <p>PENDIENTE D-26: se reserva al coordinador por ser el rol mas
 * administrativo de los tres, pero la empresa debe confirmar quien administra
 * esta informacion. Si designa otro responsable, el cambio es la anotacion de
 * esta clase.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('COORDINADOR')")
public class ContenidoAdminController {

	private final ServicioContenidoPublico servicioContenido;
	private final ServicioConsultas servicioConsultas;

	public ContenidoAdminController(ServicioContenidoPublico servicioContenido,
			ServicioConsultas servicioConsultas) {
		this.servicioContenido = servicioContenido;
		this.servicioConsultas = servicioConsultas;
	}

	/** Contenido de una seccion incluyendo los borradores sin publicar. */
	@GetMapping("/contenido")
	public ListaResponse<ContenidoResponse> listar(@RequestParam TipoContenido tipo) {
		List<ContenidoResponse> lista = servicioContenido.seccionCompleta(tipo).stream()
				.map(ContenidoResponse::administrativa).toList();
		return ListaResponse.de(lista, "Esta seccion aun no tiene contenido registrado.");
	}

	/** Crea contenido. Nace sin publicar, para que nada aparezca por descuido. */
	@PostMapping("/contenido")
	@ResponseStatus(HttpStatus.CREATED)
	public ContenidoResponse crear(@Valid @RequestBody RegistroContenidoRequest peticion) {
		return ContenidoResponse.administrativa(servicioContenido.crear(peticion));
	}

	@PutMapping("/contenido/{id}")
	public ContenidoResponse actualizar(@PathVariable Long id,
			@Valid @RequestBody RegistroContenidoRequest peticion) {
		return ContenidoResponse.administrativa(servicioContenido.actualizar(id, peticion));
	}

	/**
	 * Publica o retira una pieza de contenido.
	 *
	 * <p>No hay operacion de borrado: retirar de la pagina se hace despublicando,
	 * coherente con RN-02, que en el resto del sistema conserva lo registrado y
	 * solo cambia su estado.
	 */
	@PostMapping("/contenido/{id}/publicacion")
	public ContenidoResponse cambiarPublicacion(@PathVariable Long id,
			@RequestParam boolean publicada) {
		return ContenidoResponse.administrativa(servicioContenido.cambiarPublicacion(id, publicada));
	}

	/** Consultas recibidas por el formulario publico (RF-035). */
	@GetMapping("/consultas")
	public ListaResponse<ConsultaResponse> consultas(@RequestParam(required = false) Boolean atendida) {
		List<ConsultaResponse> lista = servicioConsultas.recibidas(atendida).stream()
				.map(ConsultaResponse::de).toList();
		return ListaResponse.de(lista, "No hay consultas recibidas.");
	}

	/** Marca una consulta como atendida y deja constancia de quien la atendio. */
	@PostMapping("/consultas/{id}/atencion")
	public ConsultaResponse marcarAtendida(@PathVariable Long id,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return ConsultaResponse.de(
				servicioConsultas.marcarAtendida(id, autenticado.getTrabajadorId()));
	}

}

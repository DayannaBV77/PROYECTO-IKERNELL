package com.PROYECTO.IKERNELL.backend.publico;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;
import com.PROYECTO.IKERNELL.backend.publico.dto.ConfirmacionEnvioResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.ContenidoResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroConsultaRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

import jakarta.validation.Valid;

/**
 * Pagina informativa publica (RF-026, RF-032 a RF-036, HU-01 y HU-02).
 *
 * <p>Todo este controlador es de acceso anonimo: cuelga de {@code /api/publico},
 * la unica ruta que la configuracion de seguridad abre sin autenticacion. Es el
 * requisito de HU-01 C01: "el sistema me deja ver la pagina sin pedirme usuario,
 * contrasena ni registro".
 *
 * <p>No expone ninguna lectura de las consultas enviadas, por exigencia de
 * HU-02 C05.
 */
@RestController
@RequestMapping("/api/publico")
public class InformacionEmpresarialController {

	private final ServicioContenidoPublico servicioContenido;
	private final ServicioConsultas servicioConsultas;

	public InformacionEmpresarialController(ServicioContenidoPublico servicioContenido,
			ServicioConsultas servicioConsultas) {
		this.servicioContenido = servicioContenido;
		this.servicioConsultas = servicioConsultas;
	}

	/**
	 * RF-026, HU-01 C01: la informacion empresarial completa, en un solo lugar.
	 *
	 * <p>Devuelve siempre las seis secciones; las que no tienen contenido llegan
	 * con su aviso (HU-01 C02).
	 */
	@GetMapping("/informacion-empresarial")
	public Map<TipoContenido, ListaResponse<ContenidoResponse>> informacionEmpresarial() {
		return servicioContenido.informacionEmpresarial();
	}

	/**
	 * Una seccion concreta (RF-032 a RF-036, HU-01 C02 a C04).
	 *
	 * @param busqueda termino opcional de busqueda (RF-034)
	 */
	@GetMapping("/secciones/{tipo}")
	public ListaResponse<ContenidoResponse> seccion(@PathVariable TipoContenido tipo,
			@RequestParam(required = false) String busqueda) {
		return servicioContenido.seccionPublica(tipo, busqueda);
	}

	/**
	 * RF-035, HU-02: envia una consulta sin iniciar sesion.
	 *
	 * <p>Responde solo con la confirmacion de HU-02 C02; no devuelve la consulta
	 * registrada ni su identificador.
	 */
	@PostMapping("/consultas")
	@ResponseStatus(HttpStatus.CREATED)
	public ConfirmacionEnvioResponse enviarConsulta(@Valid @RequestBody RegistroConsultaRequest peticion) {
		servicioConsultas.registrar(peticion);
		return ConfirmacionEnvioResponse.recibida();
	}

}

package com.PROYECTO.IKERNELL.backend.corporativo;

import java.util.List;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.AccesoCorreoResponse;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.RecursoDetalleResponse;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.RecursoResumenResponse;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

/**
 * Servicios corporativos para trabajadores autenticados (RF-029, RF-030, RF-031).
 *
 * <p>No lleva restriccion por rol: HU-21 y HU-20 los ofrecen a "trabajador con
 * la sesion iniciada (coordinador de proyectos, lider de proyectos o
 * desarrollador)", es decir a los tres tipos. Basta la autenticacion, que la
 * configuracion de seguridad ya exige para todo lo que no sea publico (HU-01 C05).
 *
 * <p>NO incluye el chat corporativo (RF-028): D-12 deja sin definir sus
 * funciones y si se implementa dentro del aplicativo o con un servicio externo.
 */
@RestController
@RequestMapping("/api/corporativo")
public class ServiciosCorporativosController {

	private final ServicioRecursosInternos servicio;
	private final ServicioAccesoCorreo servicioCorreo;

	public ServiciosCorporativosController(ServicioRecursosInternos servicio,
			ServicioAccesoCorreo servicioCorreo) {
		this.servicio = servicio;
		this.servicioCorreo = servicioCorreo;
	}

	/** RF-029, HU-21 C01, C04 y C05: biblioteca de programas. */
	@GetMapping("/programas")
	public ListaResponse<RecursoResumenResponse> programas(
			@RequestParam(required = false) String busqueda) {
		return listar(TipoRecurso.PROGRAMA, busqueda,
				"La biblioteca de programas aun no tiene contenido publicado.");
	}

	/** RF-029, HU-21 C02: detalle del programa con su enlace autorizado. */
	@GetMapping("/programas/{id}")
	public RecursoDetalleResponse programa(@PathVariable Long id) {
		return RecursoDetalleResponse.de(servicio.obtenerPublicado(id, TipoRecurso.PROGRAMA));
	}

	/** RF-030, HU-21 C03, C04 y C05: tutoriales de programacion. */
	@GetMapping("/tutoriales")
	public ListaResponse<RecursoResumenResponse> tutoriales(
			@RequestParam(required = false) String busqueda) {
		return listar(TipoRecurso.TUTORIAL, busqueda,
				"Aun no hay tutoriales de programacion publicados.");
	}

	/** RF-030, HU-21 C03: contenido del tutorial. */
	@GetMapping("/tutoriales/{id}")
	public RecursoDetalleResponse tutorial(@PathVariable Long id) {
		return RecursoDetalleResponse.de(servicio.obtenerPublicado(id, TipoRecurso.TUTORIAL));
	}

	/**
	 * RF-031, HU-20 C04 y C05: acceso al correo electronico corporativo.
	 *
	 * <p>La decision vive en {@link ServicioAccesoCorreo}, porque el panel «Mi
	 * Dia» (RF-038) necesita el mismo dato y duplicarla aqui habria dejado dos
	 * sitios que decidir cuando D-13 se resuelva.
	 */
	@GetMapping("/correo")
	public AccesoCorreoResponse correo() {
		return servicioCorreo.acceso();
	}

	private ListaResponse<RecursoResumenResponse> listar(TipoRecurso tipo, String busqueda,
			String avisoSinContenido) {
		List<RecursoResumenResponse> lista = servicio.listar(tipo, busqueda).stream()
				.map(RecursoResumenResponse::de).toList();
		String aviso = StringUtils.hasText(busqueda)
				? "No hay resultados para la busqueda indicada."
				: avisoSinContenido;
		return ListaResponse.de(lista, aviso);
	}

}

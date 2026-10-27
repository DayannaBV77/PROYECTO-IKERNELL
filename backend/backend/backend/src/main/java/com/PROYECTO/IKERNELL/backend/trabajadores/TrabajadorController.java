package com.PROYECTO.IKERNELL.backend.trabajadores;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores.FotografiaGuardada;
import com.PROYECTO.IKERNELL.backend.shared.dto.PaginaResponse;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.CriteriosBusquedaTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.ModificacionTrabajadorRequest;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.RegistroTrabajadorRequest;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.TrabajadorResponse;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.TrabajadorResumenResponse;

import jakarta.validation.Valid;

/**
 * Gestion de trabajadores (RF-001, RF-002, RF-004, RF-005, RF-007).
 *
 * <p>Todo el controlador esta reservado al coordinador de proyectos: es el actor
 * que el catalogo asigna a estos cinco requerimientos y RNF-001 exige restringir
 * las funciones de gestion segun el rol. Es el <b>nivel 1</b> de autorizacion;
 * estas operaciones no dependen de ningun proyecto, asi que no interviene el
 * nivel 2.
 *
 * <p>Queda abierta la ambiguedad A-03: RF-004 dice "abrir el perfil seleccionado
 * segun los permisos del usuario", lo que sugiere que otros roles tambien
 * consultan trabajadores. Mientras no se confirme, se aplica el actor declarado.
 */
@RestController
@RequestMapping("/api/trabajadores")
@PreAuthorize("hasRole('COORDINADOR')")
public class TrabajadorController {

	/** Tope de pagina para que un cliente no pueda pedir la tabla entera (RNF-005). */
	private static final int TAMANO_MAXIMO_PAGINA = 100;

	private final ServicioTrabajadores servicio;

	public TrabajadorController(ServicioTrabajadores servicio) {
		this.servicio = servicio;
	}

	/** RF-001, HU-04 C01: registra el perfil y confirma el resultado. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TrabajadorResponse registrar(@Valid @RequestBody RegistroTrabajadorRequest peticion) {
		return respuesta(servicio.registrar(peticion));
	}

	/**
	 * RF-004, HU-05 C01 y C02: busca por uno o varios criterios.
	 *
	 * <p>Cuando no hay coincidencias, la respuesta trae el aviso en
	 * {@code mensaje} en lugar de una lista vacia a secas (RN-14).
	 */
	@GetMapping
	public PaginaResponse<TrabajadorResumenResponse> buscar(
			@RequestParam(required = false) String identificacion,
			@RequestParam(required = false) String nombre,
			@RequestParam(required = false) String apellido,
			@RequestParam(required = false) String profesion,
			@RequestParam(required = false) String especialidadDesarrollo,
			@RequestParam(required = false) TipoTrabajador tipoTrabajador,
			@RequestParam(required = false) EstadoHabilitacion estado,
			@RequestParam(defaultValue = "0") int pagina,
			@RequestParam(defaultValue = "20") int tamano) {

		CriteriosBusquedaTrabajador criterios = new CriteriosBusquedaTrabajador(
				identificacion, nombre, apellido, profesion, especialidadDesarrollo, tipoTrabajador, estado);

		PageRequest paginacion = PageRequest.of(
				Math.max(pagina, 0),
				Math.min(Math.max(tamano, 1), TAMANO_MAXIMO_PAGINA),
				Sort.by("apellido", "nombre"));

		Page<TrabajadorResumenResponse> resultado = servicio.buscar(criterios, paginacion)
				.map(TrabajadorResumenResponse::de);
		return PaginaResponse.de(resultado, "No hay trabajadores que coincidan con los criterios indicados.");
	}

	/** RF-004: abre el perfil elegido en la lista de resultados (HU-05 C01). */
	@GetMapping("/{id}")
	public TrabajadorResponse obtener(@PathVariable Long id) {
		return respuesta(servicio.obtener(id));
	}

	/**
	 * RF-005, HU-05 C03: modifica los campos autorizados.
	 *
	 * <p>La identificacion no es editable y no tiene representacion en la peticion.
	 */
	@PutMapping("/{id}")
	public TrabajadorResponse modificar(@PathVariable Long id,
			@Valid @RequestBody ModificacionTrabajadorRequest peticion) {
		return respuesta(servicio.modificar(id, peticion));
	}

	/**
	 * RF-007, HU-05 C05: inhabilita conservando el historial.
	 *
	 * <p>Es un POST sobre un sub-recurso y no un DELETE a proposito: no se borra
	 * nada (RN-02). El paso de confirmacion que pide el criterio corresponde a la
	 * interfaz; el servidor solo registra el cambio de estado.
	 */
	@PostMapping("/{id}/inhabilitacion")
	public TrabajadorResponse inhabilitar(@PathVariable Long id) {
		return respuesta(servicio.inhabilitar(id));
	}

	/**
	 * RF-002, HU-04 C04: devuelve la fotografia del perfil.
	 *
	 * <p>El criterio no se cumple solo adjuntando la imagen: pide que "se pueda
	 * ver en el" perfil, y para eso hace falta poder recuperarla.
	 *
	 * <p>Se sirve con el tipo que se valido al guardarla y sin cache compartida:
	 * es un dato personal de un trabajador, no un recurso publico, y la respuesta
	 * depende de quien pregunta.
	 *
	 * <p>Un perfil sin fotografia responde 404 con su mensaje, no una imagen
	 * vacia: el cliente ya sabe por {@code tieneFotografia} si debe pedirla.
	 */
	@GetMapping("/{id}/fotografia")
	public ResponseEntity<Resource> fotografia(@PathVariable Long id) {
		FotografiaGuardada fotografia = servicio.fotografiaDe(id);

		ResponseEntity.BodyBuilder respuesta = ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(fotografia.contentType()))
				.cacheControl(CacheControl.noStore().cachePrivate());
		if (fotografia.tamanoBytes() != null) {
			respuesta = respuesta.contentLength(fotografia.tamanoBytes());
		}
		return respuesta.body(fotografia.contenido());
	}

	/**
	 * RF-002, HU-04 C04: adjunta la fotografia a un perfil existente.
	 *
	 * <p>Endpoint aparte del registro para cubrir los dos momentos que admite el
	 * requerimiento -"durante su registro o despues"- con una sola operacion: el
	 * cliente la invoca inmediatamente despues de registrar, o mas tarde sobre un
	 * perfil ya creado.
	 */
	@PostMapping("/{id}/fotografia")
	public TrabajadorResponse adjuntarFotografia(@PathVariable Long id,
			@RequestPart("fotografia") MultipartFile fotografia) {
		return respuesta(servicio.adjuntarFotografia(id, fotografia));
	}

	private TrabajadorResponse respuesta(Trabajador trabajador) {
		return TrabajadorResponse.de(trabajador, servicio.habilidadesDe(trabajador.getId()));
	}
}

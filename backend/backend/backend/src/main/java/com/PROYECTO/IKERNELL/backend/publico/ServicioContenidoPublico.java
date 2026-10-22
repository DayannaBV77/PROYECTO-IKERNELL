package com.PROYECTO.IKERNELL.backend.publico;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.PROYECTO.IKERNELL.backend.publico.domain.ContenidoPublico;
import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;
import com.PROYECTO.IKERNELL.backend.publico.dto.ContenidoResponse;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroContenidoRequest;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/**
 * Informacion empresarial publica (RF-026, RF-032 a RF-036).
 *
 * <p>Las consultas publicas y las de administracion estan separadas: las
 * primeras filtran por contenido publicado y las segundas no. Mantenerlas
 * aparte evita que un descuido deje ver borradores en la pagina publica.
 */
@Service
public class ServicioContenidoPublico {

	/** Aviso por seccion cuando no hay nada publicado (HU-01 C02, HU-21 C04). */
	private static final Map<TipoContenido, String> AVISOS_SIN_CONTENIDO = Map.of(
			TipoContenido.LINEAMIENTO, "La empresa aun no ha publicado sus lineamientos.",
			TipoContenido.PORTAFOLIO_SERVICIO, "La empresa aun no ha publicado su portafolio de servicios.",
			TipoContenido.NOTICIA, "Aun no hay noticias publicadas.",
			TipoContenido.PREGUNTA_FRECUENTE, "Aun no hay preguntas frecuentes publicadas.",
			TipoContenido.ENLACE_INTERES, "Aun no hay enlaces de interes publicados.",
			TipoContenido.INFORMACION_CONTACTO, "Aun no hay informacion de contacto publicada.");

	private final ContenidoPublicoRepository contenidos;

	public ServicioContenidoPublico(ContenidoPublicoRepository contenidos) {
		this.contenidos = contenidos;
	}

	/**
	 * RF-026, HU-01 C01: toda la informacion empresarial publica.
	 *
	 * <p>Devuelve siempre las SEIS secciones, incluso vacias con su aviso. Es lo
	 * que garantiza el criterio: el interesado "ve, o puede llegar con un clic, a
	 * las seis partes de la informacion empresarial". Si una seccion solo
	 * apareciera cuando tiene contenido, el visitante no sabria que existe.
	 */
	@Transactional(readOnly = true)
	public Map<TipoContenido, ListaResponse<ContenidoResponse>> informacionEmpresarial() {
		Map<TipoContenido, ListaResponse<ContenidoResponse>> secciones = new LinkedHashMap<>();
		for (TipoContenido tipo : TipoContenido.values()) {
			secciones.put(tipo, seccionPublica(tipo, null));
		}
		return secciones;
	}

	/**
	 * Una seccion de la pagina publica (RF-032 a RF-036).
	 *
	 * @param busqueda termino opcional; RF-034 lo contempla para las preguntas
	 *                 frecuentes y HU-21 C05 para otras secciones
	 */
	@Transactional(readOnly = true)
	public ListaResponse<ContenidoResponse> seccionPublica(TipoContenido tipo, String busqueda) {
		List<ContenidoPublico> encontrados = StringUtils.hasText(busqueda)
				? contenidos.findByTipoAndPublicadaTrueAndTituloContainingIgnoreCaseOrderByOrdenAscIdDesc(
						tipo, busqueda.trim())
				: contenidos.findByTipoAndPublicadaTrueOrderByOrdenAscFechaDescIdDesc(tipo);

		List<ContenidoResponse> lista = encontrados.stream().map(ContenidoResponse::publica).toList();
		String aviso = StringUtils.hasText(busqueda)
				? "No hay resultados para la busqueda indicada."
				: AVISOS_SIN_CONTENIDO.get(tipo);
		return ListaResponse.de(lista, aviso);
	}

	// ------------------------------------------------------------ Administracion

	/**
	 * Contenido de una seccion incluyendo los borradores.
	 *
	 * <p>PROPUESTA: ningun RF define la administracion de este contenido.
	 */
	@Transactional(readOnly = true)
	public List<ContenidoPublico> seccionCompleta(TipoContenido tipo) {
		return contenidos.findByTipoOrderByOrdenAscFechaDescIdDesc(tipo);
	}

	@Transactional(readOnly = true)
	public ContenidoPublico obtener(Long id) {
		return contenidos.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe el contenido con el id " + id + "."));
	}

	/** Crea una pieza de contenido, sin publicar hasta que se publique expresamente. */
	@Transactional
	public ContenidoPublico crear(RegistroContenidoRequest peticion) {
		validarSegunTipo(peticion);
		return contenidos.save(new ContenidoPublico(peticion.tipo(), peticion.titulo(), peticion.cuerpo(),
				peticion.enlace(), peticion.fecha(), peticion.orden()));
	}

	/**
	 * Edita el contenido.
	 *
	 * <p>El tipo no se puede cambiar: cada tipo usa las columnas de forma
	 * distinta, y convertir un enlace de interes en una pregunta frecuente dejaria
	 * los datos sin sentido.
	 */
	@Transactional
	public ContenidoPublico actualizar(Long id, RegistroContenidoRequest peticion) {
		ContenidoPublico contenido = obtener(id);
		if (peticion.tipo() != contenido.getTipo()) {
			throw new ReglaNegocioException("El tipo de contenido no se puede modificar.");
		}
		validarSegunTipo(peticion);
		contenido.actualizar(peticion.titulo(), peticion.cuerpo(), peticion.enlace(),
				peticion.fecha(), peticion.orden());
		return contenidos.save(contenido);
	}

	@Transactional
	public ContenidoPublico cambiarPublicacion(Long id, boolean publicada) {
		ContenidoPublico contenido = obtener(id);
		contenido.cambiarPublicacion(publicada);
		return contenidos.save(contenido);
	}

	/** Reglas que dependen del tipo y no se pueden expresar campo a campo. */
	private void validarSegunTipo(RegistroContenidoRequest peticion) {
		if (peticion.tipo().exigeEnlace() && !StringUtils.hasText(peticion.enlace())) {
			throw new ReglaNegocioException(
					"Un enlace de interes necesita la direccion del sitio al que dirige.");
		}
		if (peticion.tipo().exigeCuerpo() && !StringUtils.hasText(peticion.cuerpo())) {
			throw new ReglaNegocioException("Una pregunta frecuente necesita su respuesta.");
		}
	}

}

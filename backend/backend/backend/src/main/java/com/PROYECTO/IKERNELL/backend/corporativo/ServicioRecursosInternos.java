package com.PROYECTO.IKERNELL.backend.corporativo;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.RecursoInterno;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.RegistroRecursoRequest;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/**
 * Biblioteca de programas y tutoriales de programacion (RF-029, RF-030).
 *
 * <p>Las consultas del trabajador y las de administracion estan separadas: las
 * primeras filtran por publicado y las segundas no, igual que en el contenido
 * publico.
 */
@Service
public class ServicioRecursosInternos {

	private final RecursoInternoRepository recursos;

	public ServicioRecursosInternos(RecursoInternoRepository recursos) {
		this.recursos = recursos;
	}

	/**
	 * Lista de programas o tutoriales publicados (HU-21 C01, C03 y C05).
	 *
	 * <p>PENDIENTE D-27: devuelve todo lo publicado a cualquier trabajador
	 * autenticado. RF-029 deja los permisos por definir, asi que no se filtra por
	 * trabajador; cuando la empresa los defina, este es el punto donde aplicarlos.
	 */
	@Transactional(readOnly = true)
	public List<RecursoInterno> listar(TipoRecurso tipo, String busqueda) {
		String texto = StringUtils.hasText(busqueda) ? busqueda.trim() : null;
		return texto != null && !texto.isBlank()
				? recursos.buscarPublicadosPorTexto(tipo, texto)
				: recursos.findByTipoAndPublicadaTrueOrderByOrdenAscTituloAsc(tipo);
	}

	/**
	 * Detalle de un recurso publicado (HU-21 C02).
	 *
	 * <p>Exige que el tipo coincida con la ruta, de modo que un tutorial no pueda
	 * consultarse como si fuera un programa. Un recurso no publicado responde
	 * igual que uno inexistente: un borrador no debe ser descubrible.
	 */
	@Transactional(readOnly = true)
	public RecursoInterno obtenerPublicado(Long id, TipoRecurso tipo) {
		return recursos.findByIdAndTipoAndPublicadaTrue(id, tipo)
				.orElseThrow(() -> new RecursoNoEncontradoException("El recurso solicitado no esta disponible."));
	}

	// ------------------------------------------------------------ Administracion

	@Transactional(readOnly = true)
	public List<RecursoInterno> listarCompleto(TipoRecurso tipo) {
		return recursos.findByTipoOrderByOrdenAscTituloAsc(tipo);
	}

	@Transactional(readOnly = true)
	public RecursoInterno obtener(Long id) {
		return recursos.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe el recurso con el id " + id + "."));
	}

	@Transactional
	public RecursoInterno crear(RegistroRecursoRequest peticion) {
		validarSegunTipo(peticion);
		return recursos.save(new RecursoInterno(peticion.tipo(), peticion.titulo(), peticion.descripcion(),
				peticion.categoria(), peticion.version(), peticion.contenido(), peticion.enlace(),
				peticion.orden()));
	}

	@Transactional
	public RecursoInterno actualizar(Long id, RegistroRecursoRequest peticion) {
		RecursoInterno recurso = obtener(id);
		if (peticion.tipo() != recurso.getTipo()) {
			throw new ReglaNegocioException("El tipo del recurso no se puede modificar.");
		}
		validarSegunTipo(peticion);
		recurso.actualizar(peticion.titulo(), peticion.descripcion(), peticion.categoria(),
				peticion.version(), peticion.contenido(), peticion.enlace(), peticion.orden());
		return recursos.save(recurso);
	}

	@Transactional
	public RecursoInterno cambiarPublicacion(Long id, boolean publicada) {
		RecursoInterno recurso = obtener(id);
		recurso.cambiarPublicacion(publicada);
		return recursos.save(recurso);
	}

	@Transactional
	public void eliminar(Long id) {
		RecursoInterno recurso = obtener(id);
		recursos.delete(recurso);
	}

	/**
	 * Reglas que dependen del tipo.
	 *
	 * <p>Un programa sin enlace no cumple HU-21 C02, que exige mostrar "los
	 * enlaces o recursos a los que tengo autorizacion de acceso". Un tutorial
	 * necesita contenido propio o un enlace donde leerlo, porque HU-21 C03 pide
	 * poder "abrir cualquiera para ver su contenido".
	 */
	private void validarSegunTipo(RegistroRecursoRequest peticion) {
		if (peticion.tipo() == TipoRecurso.PROGRAMA && !StringUtils.hasText(peticion.enlace())) {
			throw new ReglaNegocioException(
					"Un programa de la biblioteca necesita el enlace al recurso autorizado.");
		}
		if (peticion.tipo() == TipoRecurso.TUTORIAL
				&& !StringUtils.hasText(peticion.contenido()) && !StringUtils.hasText(peticion.enlace())) {
			throw new ReglaNegocioException("Un tutorial necesita su contenido o un enlace donde consultarlo.");
		}
	}

}

package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.publico.domain.ContenidoPublico;
import com.PROYECTO.IKERNELL.backend.publico.domain.TipoContenido;

public interface ContenidoPublicoRepository extends JpaRepository<ContenidoPublico, Long> {

	/** Vista publica: solo lo publicado (HU-01 C02 y C03, RF-034). */
	List<ContenidoPublico> findByTipoAndPublicadaTrueOrderByOrdenAscFechaDescIdDesc(TipoContenido tipo);

	/**
	 * Vista de administracion: incluye lo no publicado.
	 *
	 * <p>Separada de la consulta publica a proposito, para que un descuido en la
	 * capa de administracion no pueda filtrar borradores a la pagina publica.
	 */
	List<ContenidoPublico> findByTipoOrderByOrdenAscFechaDescIdDesc(TipoContenido tipo);

	/** Busqueda dentro de una seccion; RF-034 la contempla para preguntas frecuentes. */
	List<ContenidoPublico> findByTipoAndPublicadaTrueAndTituloContainingIgnoreCaseOrderByOrdenAscIdDesc(
			TipoContenido tipo, String titulo);

}

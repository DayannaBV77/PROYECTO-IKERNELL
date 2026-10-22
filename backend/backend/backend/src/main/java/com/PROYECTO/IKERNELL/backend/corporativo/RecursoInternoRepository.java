package com.PROYECTO.IKERNELL.backend.corporativo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.RecursoInterno;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;

public interface RecursoInternoRepository extends JpaRepository<RecursoInterno, Long> {

	/** Vista del trabajador: solo lo publicado (HU-21 C01 y C03). */
	List<RecursoInterno> findByTipoAndPublicadaTrueOrderByOrdenAscTituloAsc(TipoRecurso tipo);

	/** Busqueda de HU-21 C05, sobre el titulo y la categoria. */
	List<RecursoInterno> findByTipoAndPublicadaTrueAndTituloContainingIgnoreCaseOrderByOrdenAscTituloAsc(
			TipoRecurso tipo, String titulo);

	/** Un recurso publicado concreto, para el detalle de HU-21 C02. */
	Optional<RecursoInterno> findByIdAndTipoAndPublicadaTrue(Long id, TipoRecurso tipo);

	/** Vista de administracion: incluye los borradores. */
	List<RecursoInterno> findByTipoOrderByOrdenAscTituloAsc(TipoRecurso tipo);

}

package com.PROYECTO.IKERNELL.backend.corporativo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.PROYECTO.IKERNELL.backend.corporativo.domain.RecursoInterno;
import com.PROYECTO.IKERNELL.backend.corporativo.domain.TipoRecurso;

public interface RecursoInternoRepository extends JpaRepository<RecursoInterno, Long> {

	/** Vista del trabajador: solo lo publicado (HU-21 C01 y C03). */
	List<RecursoInterno> findByTipoAndPublicadaTrueOrderByOrdenAscTituloAsc(TipoRecurso tipo);

	/**
	 * Busqueda de HU-21 C05.
	 *
	 * <p>La consulta incluye titulo, descripcion y categoria para que el
	 * trabajador pueda encontrar tutoriales por palabras clave y lenguaje.
	 */
	@Query("""
			select r from RecursoInterno r
			where r.tipo = :tipo
			  and r.publicada = true
			  and (
			      lower(r.titulo) like lower(concat('%', :texto, '%'))
			      or lower(coalesce(r.descripcion, '')) like lower(concat('%', :texto, '%'))
			      or lower(coalesce(r.categoria, '')) like lower(concat('%', :texto, '%'))
			  )
			order by r.orden asc, r.titulo asc
		""")
	List<RecursoInterno> buscarPublicadosPorTexto(TipoRecurso tipo, String texto);

	/** Un recurso publicado concreto, para el detalle de HU-21 C02. */
	Optional<RecursoInterno> findByIdAndTipoAndPublicadaTrue(Long id, TipoRecurso tipo);

	/** Vista de administracion: incluye los borradores. */
	List<RecursoInterno> findByTipoOrderByOrdenAscTituloAsc(TipoRecurso tipo);

}

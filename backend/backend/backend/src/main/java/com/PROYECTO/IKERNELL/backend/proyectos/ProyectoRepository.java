package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

import jakarta.persistence.LockModeType;

public interface ProyectoRepository
		extends JpaRepository<Proyecto, Long>, JpaSpecificationExecutor<Proyecto> {

	@Override
	@EntityGraph(attributePaths = "liderResponsable")
	Page<Proyecto> findAll(Specification<Proyecto> especificacion, Pageable paginacion);

	@EntityGraph(attributePaths = "liderResponsable")
	@Query("select p from Proyecto p where p.id = :id")
	Optional<Proyecto> findConLiderResponsable(@Param("id") Long id);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select p from Proyecto p where p.id = :id")
	Optional<Proyecto> findByIdParaAsignacion(@Param("id") Long id);

	/**
	 * Proyectos en un estado concreto, ordenados por nombre.
	 *
	 * <p>Sostiene la lista de proyectos a los que se puede asignar un trabajador
	 * (RF-003, HU-06 C01). No pasa por {@code ProyectoSpecifications} porque no
	 * combina criterios opcionales: es siempre el mismo.
	 */
	List<Proyecto> findByEstadoHabilitacionOrderByNombreAsc(EstadoHabilitacion estado);

	/**
	 * Proyectos autorizados para el reporte externo (RF-025, HU-19).
	 *
	 * <p>El filtro es la marca del proyecto, no el tipo del trabajador: que un
	 * lider pueda generar el reporte no significa que todos los proyectos
	 * puedan salir de la empresa.
	 */
	List<Proyecto> findByReporteExternoAutorizadoTrueOrderByNombreAsc();

}

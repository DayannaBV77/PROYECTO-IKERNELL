package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

public interface ProyectoRepository
		extends JpaRepository<Proyecto, Long>, JpaSpecificationExecutor<Proyecto> {

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

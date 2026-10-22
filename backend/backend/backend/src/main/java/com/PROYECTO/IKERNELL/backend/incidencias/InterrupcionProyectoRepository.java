package com.PROYECTO.IKERNELL.backend.incidencias;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;

public interface InterrupcionProyectoRepository extends JpaRepository<InterrupcionProyecto, Long> {

	List<InterrupcionProyecto> findByProyectoIdOrderByFechaDesc(Long proyectoId);

	/** Prepara el filtro por periodo que pedira el reporte de RF-017. */
	List<InterrupcionProyecto> findByProyectoIdAndFechaBetweenOrderByFechaDesc(
			Long proyectoId, LocalDate desde, LocalDate hasta);

	long countByProyectoId(Long proyectoId);

}

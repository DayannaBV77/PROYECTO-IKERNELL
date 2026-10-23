package com.PROYECTO.IKERNELL.backend.incidencias;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;

/*
 * Las consultas de lectura traen cargados el proyecto y la fase. Ambos son LAZY
 * y spring.jpa.open-in-view esta desactivado: la respuesta se arma en el
 * controlador, ya fuera de la sesion, y lee el nombre de los dos. Sin estas
 * cargas la peticion falla entera con LazyInitializationException.
 */
public interface InterrupcionProyectoRepository extends JpaRepository<InterrupcionProyecto, Long> {

	@EntityGraph(attributePaths = { "proyecto", "fase" })
	List<InterrupcionProyecto> findByProyectoIdOrderByFechaDesc(Long proyectoId);

	/** Prepara el filtro por periodo que pedira el reporte de RF-017. */
	@EntityGraph(attributePaths = { "proyecto", "fase" })
	List<InterrupcionProyecto> findByProyectoIdAndFechaBetweenOrderByFechaDesc(
			Long proyectoId, LocalDate desde, LocalDate hasta);

	long countByProyectoId(Long proyectoId);

}

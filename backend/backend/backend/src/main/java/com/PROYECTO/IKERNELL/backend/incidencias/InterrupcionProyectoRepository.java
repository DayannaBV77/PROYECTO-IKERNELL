package com.PROYECTO.IKERNELL.backend.incidencias;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;

/*
 * Las consultas de lectura traen cargados el proyecto y la etapa. Ambos son LAZY
 * y spring.jpa.open-in-view esta desactivado: la respuesta se arma en el
 * controlador, ya fuera de la sesion, y lee el nombre de los dos. Sin estas
 * cargas la peticion falla entera con LazyInitializationException.
 *
 * La etapa puede ser nula en los registros previos a D-36; @EntityGraph lo
 * admite y genera un left join.
 */
public interface InterrupcionProyectoRepository extends JpaRepository<InterrupcionProyecto, Long> {

	@EntityGraph(attributePaths = { "proyecto", "etapa" })
	List<InterrupcionProyecto> findByProyectoIdOrderByFechaDesc(Long proyectoId);

	/** Prepara el filtro por periodo que pedira el reporte de RF-017. */
	@EntityGraph(attributePaths = { "proyecto", "etapa" })
	List<InterrupcionProyecto> findByProyectoIdAndFechaBetweenOrderByFechaDesc(
			Long proyectoId, LocalDate desde, LocalDate hasta);

	long countByProyectoId(Long proyectoId);

	/** RN-08: una etapa con incidencias registradas no se elimina (RF-012, HU-11 C05). */
	long countByEtapaId(Long etapaId);

}

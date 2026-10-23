package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;

/*
 * Las consultas que devuelven actividades traen cargadas la etapa, el proyecto
 * de esa etapa y el desarrollador. No es una optimizacion: las tres son LAZY y
 * spring.jpa.open-in-view esta desactivado, de modo que la sesion se cierra al
 * salir del servicio. ActividadResponse lee el nombre del proyecto -que alcanza
 * a traves de la etapa-, el de la etapa y el del desarrollador ya en el
 * controlador, asi que sin estas cargas la peticion falla entera con
 * LazyInitializationException.
 */
public interface ActividadRepository
		extends JpaRepository<Actividad, Long>, JpaSpecificationExecutor<Actividad> {

	@Override
	@EntityGraph(attributePaths = { "etapa", "etapa.proyecto", "desarrollador" })
	Optional<Actividad> findById(Long id);

	@Override
	@EntityGraph(attributePaths = { "etapa", "etapa.proyecto", "desarrollador" })
	Page<Actividad> findAll(Specification<Actividad> especificacion, Pageable paginacion);

	/** HU-16 C01 y C04: actividades asignadas al desarrollador que consulta. */
	@EntityGraph(attributePaths = { "etapa", "etapa.proyecto", "desarrollador" })
	List<Actividad> findByDesarrolladorIdOrderByIdDesc(Long desarrolladorId);

	Optional<Actividad> findByIdAndDesarrolladorId(Long id, Long desarrolladorId);

	/** RF-006: actividades de un desarrollador dentro de un proyecto (HU-07 C01). */
	@EntityGraph(attributePaths = { "etapa", "etapa.proyecto", "desarrollador" })
	List<Actividad> findByDesarrolladorIdAndEtapaProyectoIdOrderByIdDesc(Long desarrolladorId, Long proyectoId);

	/** Hace efectiva RN-08 al eliminar una etapa (RF-012, HU-11 C05). */
	long countByEtapaId(Long etapaId);

	/** Dato disponible para la consulta de estado de RF-016. */
	long countByEtapaProyectoId(Long proyectoId);

}

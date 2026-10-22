package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;

public interface ActividadRepository
		extends JpaRepository<Actividad, Long>, JpaSpecificationExecutor<Actividad> {

	/** HU-16 C01 y C04: actividades asignadas al desarrollador que consulta. */
	List<Actividad> findByDesarrolladorIdOrderByIdDesc(Long desarrolladorId);

	Optional<Actividad> findByIdAndDesarrolladorId(Long id, Long desarrolladorId);

	/** RF-006: actividades de un desarrollador dentro de un proyecto (HU-07 C01). */
	List<Actividad> findByDesarrolladorIdAndEtapaProyectoIdOrderByIdDesc(Long desarrolladorId, Long proyectoId);

	/** Hace efectiva RN-08 al eliminar una etapa (RF-012, HU-11 C05). */
	long countByEtapaId(Long etapaId);

	/** Dato disponible para la consulta de estado de RF-016. */
	long countByEtapaProyectoId(Long proyectoId);

}

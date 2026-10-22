package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;

public interface EtapaRepository extends JpaRepository<Etapa, Long> {

	List<Etapa> findByProyectoIdOrderByOrdenAscNombreAsc(Long proyectoId);

	/** Soporta el conteo de datos disponibles de RF-016. */
	long countByProyectoId(Long proyectoId);

	boolean existsByProyectoIdAndNombreIgnoreCase(Long proyectoId, String nombre);

	Optional<Etapa> findByIdAndProyectoId(Long id, Long proyectoId);

}

package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;

public interface EtapaRepository extends JpaRepository<Etapa, Long> {

	List<Etapa> findByProyectoIdOrderByOrdenAscNombreAsc(Long proyectoId);

	/** Soporta el conteo de datos disponibles de RF-016. */
	long countByProyectoId(Long proyectoId);

	boolean existsByProyectoIdAndNombreIgnoreCase(Long proyectoId, String nombre);

	/**
	 * Trae la etapa con su proyecto cargado.
	 *
	 * <p>Quien registra una actividad construye la respuesta con el nombre del
	 * proyecto, que se alcanza a traves de la etapa. Con el proyecto en LAZY y
	 * open-in-view desactivado, ese nombre se leeria ya fuera de la sesion.
	 */
	@EntityGraph(attributePaths = "proyecto")
	Optional<Etapa> findByIdAndProyectoId(Long id, Long proyectoId);

}

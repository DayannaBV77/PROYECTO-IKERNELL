package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.ErrorProyecto;

public interface ErrorProyectoRepository extends JpaRepository<ErrorProyecto, Long> {

	List<ErrorProyecto> findByProyectoIdOrderByIdDesc(Long proyectoId);

	long countByProyectoId(Long proyectoId);

}

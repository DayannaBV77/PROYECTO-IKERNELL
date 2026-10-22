package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.FaseProyecto;

public interface FaseProyectoRepository extends JpaRepository<FaseProyecto, Long> {

	List<FaseProyecto> findByActivaTrueOrderByOrdenAsc();

}

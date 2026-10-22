package com.PROYECTO.IKERNELL.backend.proyectos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;

public interface ProyectoRepository
		extends JpaRepository<Proyecto, Long>, JpaSpecificationExecutor<Proyecto> {
}

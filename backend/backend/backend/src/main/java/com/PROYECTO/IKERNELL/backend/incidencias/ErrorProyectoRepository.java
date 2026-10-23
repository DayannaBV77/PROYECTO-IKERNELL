package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.incidencias.domain.ErrorProyecto;

/*
 * Las consultas de lectura traen cargados el proyecto y la fase. Ambos son LAZY
 * y spring.jpa.open-in-view esta desactivado: la respuesta se arma en el
 * controlador, ya fuera de la sesion, y lee el nombre de los dos. Sin estas
 * cargas la peticion falla entera con LazyInitializationException.
 */
public interface ErrorProyectoRepository extends JpaRepository<ErrorProyecto, Long> {

	@EntityGraph(attributePaths = { "proyecto", "fase" })
	List<ErrorProyecto> findByProyectoIdOrderByIdDesc(Long proyectoId);

	long countByProyectoId(Long proyectoId);

}

package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;
import com.PROYECTO.IKERNELL.backend.publico.domain.EstadoConsulta;

/*
 * Las consultas de lectura traen cargadas las respuestas y el trabajador que
 * atendio la consulta. Ambas son LAZY y spring.jpa.open-in-view esta
 * desactivado: la respuesta se arma en el controlador, ya fuera de la sesion, y
 * lee el historial y el nombre del coordinador. Sin estas cargas la peticion
 * falla entera con LazyInitializationException.
 *
 * El trabajador de cada respuesta tambien es LAZY y se lee al armar el
 * historial, por eso se incluye en la ruta. Es una sola coleccion, asi que el
 * join no cae en MultipleBagFetchException.
 */
public interface ConsultaPublicaRepository extends JpaRepository<ConsultaPublica, Long> {

	@Override
	@EntityGraph(attributePaths = { "respuestas", "respuestas.trabajador", "atendidaPor" })
	Optional<ConsultaPublica> findById(Long id);

	@EntityGraph(attributePaths = { "respuestas", "respuestas.trabajador", "atendidaPor" })
	List<ConsultaPublica> findByEstadoOrderByRecibidaEnDesc(EstadoConsulta estado);

	@EntityGraph(attributePaths = { "respuestas", "respuestas.trabajador", "atendidaPor" })
	List<ConsultaPublica> findByAtendidaOrderByRecibidaEnDesc(boolean atendida);

	@EntityGraph(attributePaths = { "respuestas", "respuestas.trabajador", "atendidaPor" })
	List<ConsultaPublica> findAllByOrderByRecibidaEnDesc();

}

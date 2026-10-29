package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.publico.domain.RespuestaConsulta;

/*
 * El historial se arma en el controlador, fuera de la sesion (open-in-view esta
 * desactivado), y para cada respuesta lee el trabajador que la redacto. Es LAZY:
 * sin esta carga la peticion falla con LazyInitializationException.
 */
public interface RespuestaConsultaRepository extends JpaRepository<RespuestaConsulta, Long> {

	@EntityGraph(attributePaths = { "consulta", "trabajador" })
	List<RespuestaConsulta> findByConsultaIdOrderByFechaRespuestaAsc(Long consultaId);

}

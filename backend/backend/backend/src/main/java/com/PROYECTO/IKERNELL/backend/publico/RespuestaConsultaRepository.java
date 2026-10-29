package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.publico.domain.RespuestaConsulta;

public interface RespuestaConsultaRepository extends JpaRepository<RespuestaConsulta, Long> {

	List<RespuestaConsulta> findByConsultaIdOrderByFechaRespuestaAsc(Long consultaId);

}


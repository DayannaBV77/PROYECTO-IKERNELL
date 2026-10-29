package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;
import com.PROYECTO.IKERNELL.backend.publico.domain.EstadoConsulta;

public interface ConsultaPublicaRepository extends JpaRepository<ConsultaPublica, Long> {

	List<ConsultaPublica> findByEstadoOrderByRecibidaEnDesc(EstadoConsulta estado);

	List<ConsultaPublica> findByAtendidaOrderByRecibidaEnDesc(boolean atendida);

	List<ConsultaPublica> findAllByOrderByRecibidaEnDesc();

}

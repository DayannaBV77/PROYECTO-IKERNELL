package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;

public interface ConsultaPublicaRepository extends JpaRepository<ConsultaPublica, Long> {

	List<ConsultaPublica> findByAtendidaOrderByRecibidaEnDesc(boolean atendida);

	List<ConsultaPublica> findAllByOrderByRecibidaEnDesc();

}

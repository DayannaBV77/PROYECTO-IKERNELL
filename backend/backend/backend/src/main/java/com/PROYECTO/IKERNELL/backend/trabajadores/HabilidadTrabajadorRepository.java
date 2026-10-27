package com.PROYECTO.IKERNELL.backend.trabajadores;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.HabilidadTrabajador;

public interface HabilidadTrabajadorRepository extends JpaRepository<HabilidadTrabajador, Long> {

	List<HabilidadTrabajador> findByTrabajador_IdOrderByCategoriaAscNombreAsc(Long trabajadorId);

	void deleteByTrabajador_Id(Long trabajadorId);
}

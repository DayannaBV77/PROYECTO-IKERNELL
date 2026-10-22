package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;

public interface EjecucionActividadRepository extends JpaRepository<EjecucionActividad, Long> {

	List<EjecucionActividad> findByActividadIdOrderByIniciadaEnDesc(Long actividadId);

	/**
	 * Ejecuciones de varias actividades en una sola consulta.
	 *
	 * <p>Evita una consulta por actividad al armar el reporte de desempeno, que
	 * es justo el tipo de recorrido que RNF-005 pide no hacer: "las consultas
	 * deben recuperar unicamente la informacion necesaria para la operacion".
	 */
	List<EjecucionActividad> findByActividadIdInOrderByIniciadaEnDesc(Collection<Long> actividadIds);

}

package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

	/**
	 * De un lote de actividades, las que ya tienen alguna ejecucion finalizada.
	 *
	 * <p>DECISION D-31: es lo que define "pendiente" para el panel de RF-038. No
	 * se usa {@code actividad.estado} porque su dominio sigue sin definir (D-04)
	 * y ninguna operacion lo escribe; la ejecucion finalizada, en cambio, es un
	 * dato real que el propio desarrollador registra (RF-022, HU-16 C02).
	 *
	 * <p>Una consulta para todo el lote, no una por actividad (RNF-005).
	 */
	@Query("""
			select distinct e.actividad.id from EjecucionActividad e
			where e.actividad.id in :actividadIds
			  and e.finalizadaEn is not null
			""")
	List<Long> idsConEjecucionFinalizada(@Param("actividadIds") Collection<Long> actividadIds);

}

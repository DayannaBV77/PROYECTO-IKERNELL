package com.PROYECTO.IKERNELL.backend.chat;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.chat.domain.HiloConversacion;

/*
 * Las consultas de lectura traen cargados el proyecto, la etapa y quien creo el
 * hilo. Los tres son LAZY y spring.jpa.open-in-view esta desactivado: la
 * respuesta se arma en el controlador, ya fuera de la sesion, y lee el nombre de
 * los tres. Sin estas cargas la peticion falla con LazyInitializationException.
 *
 * La etapa puede ser nula -un hilo de proyecto no la tiene-; @EntityGraph lo
 * admite y genera un left join.
 */
public interface HiloRepository extends JpaRepository<HiloConversacion, Long> {

	@Override
	@EntityGraph(attributePaths = { "proyecto", "etapa", "creadoPor" })
	Optional<HiloConversacion> findById(Long id);

	/** HU-22 C01: hilos disponibles para un proyecto, los suyos y los de sus etapas. */
	@EntityGraph(attributePaths = { "proyecto", "etapa", "creadoPor" })
	List<HiloConversacion> findByProyectoIdOrderByCreadoEnDesc(Long proyectoId);

	/** HU-22 C03: hilos de una etapa concreta del proyecto. */
	@EntityGraph(attributePaths = { "proyecto", "etapa", "creadoPor" })
	List<HiloConversacion> findByProyectoIdAndEtapaIdOrderByCreadoEnDesc(Long proyectoId, Long etapaId);

	/** RN-08: una etapa con hilos asociados no se elimina (RF-012, HU-11 C05). */
	long countByEtapaId(Long etapaId);

}

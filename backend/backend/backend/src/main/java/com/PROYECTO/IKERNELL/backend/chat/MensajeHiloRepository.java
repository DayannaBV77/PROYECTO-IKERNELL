package com.PROYECTO.IKERNELL.backend.chat;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.chat.domain.MensajeHilo;

/*
 * El autor y el hilo se traen cargados porque la respuesta lee el nombre del
 * autor (HU-22 C02) y el identificador del hilo ya en el controlador, fuera de
 * la sesion de persistencia: con spring.jpa.open-in-view desactivado, un proxy
 * sin inicializar hace fallar la peticion entera.
 */
public interface MensajeHiloRepository extends JpaRepository<MensajeHilo, Long> {

	/** HU-22 C05: mensajes del hilo, en el orden en que se enviaron. */
	@EntityGraph(attributePaths = { "autor", "hilo" })
	List<MensajeHilo> findByHiloIdOrderByEnviadoEnAsc(Long hiloId);

	long countByHiloId(Long hiloId);

	/**
	 * Mensajes del hilo que no escribio el trabajador indicado.
	 *
	 * <p>Los propios no cuentan como no leidos: nadie necesita un aviso de lo que
	 * acaba de escribir.
	 */
	long countByHiloIdAndAutorIdNot(Long hiloId, Long autorId);

	/** Los mismos, posteriores al instante hasta el que el trabajador habia leido. */
	long countByHiloIdAndAutorIdNotAndEnviadoEnAfter(Long hiloId, Long autorId, LocalDateTime desde);

}

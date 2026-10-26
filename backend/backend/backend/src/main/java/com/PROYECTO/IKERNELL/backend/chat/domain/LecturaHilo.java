package com.PROYECTO.IKERNELL.backend.chat.domain;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Hasta donde ha leido un trabajador en un hilo.
 *
 * <p>Es lo que hace computable el "no leido" que RF-038 pide mostrar en el panel
 * del desarrollador. Guarda un INSTANTE y no una marca por mensaje: basta para
 * responder que hay despues de lo ya visto, y no crece con el numero de
 * mensajes.
 *
 * <p>Un trabajador sin registro en un hilo no ha leido nada de el, de modo que
 * la ausencia de fila es un estado valido y no un dato que falte.
 *
 * <p>El instante se trunca a MICROSEGUNDOS por el mismo motivo que la fecha de
 * un mensaje: una columna TIMESTAMP redondea los nanosegundos al guardar, y la
 * comparacion "posterior a lo leido" solo es fiable si los dos valores tienen la
 * precision con la que se almacenan.
 */
@Entity
@Table(name = "lectura_hilo")
public class LecturaHilo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "hilo_id", nullable = false)
	private HiloConversacion hilo;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "trabajador_id", nullable = false)
	private Trabajador trabajador;

	@Column(name = "leido_hasta", nullable = false)
	private LocalDateTime leidoHasta;

	protected LecturaHilo() {
		// requerido por JPA
	}

	public LecturaHilo(HiloConversacion hilo, Trabajador trabajador, LocalDateTime leidoHasta) {
		this.hilo = hilo;
		this.trabajador = trabajador;
		this.leidoHasta = leidoHasta.truncatedTo(ChronoUnit.MICROS);
	}

	public void marcarLeidoHasta(LocalDateTime instante) {
		this.leidoHasta = instante.truncatedTo(ChronoUnit.MICROS);
	}

	public Long getId() {
		return id;
	}

	public HiloConversacion getHilo() {
		return hilo;
	}

	public Trabajador getTrabajador() {
		return trabajador;
	}

	public LocalDateTime getLeidoHasta() {
		return leidoHasta;
	}

}

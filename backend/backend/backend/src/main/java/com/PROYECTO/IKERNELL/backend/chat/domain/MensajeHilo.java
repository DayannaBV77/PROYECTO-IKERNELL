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
 * Mensaje enviado dentro de un hilo (RF-037, HU-22 C02).
 *
 * <p>HU-22 C02 fija los tres datos: el mensaje queda asociado al hilo, con el
 * autor identificado y la fecha de envio. La fecha la pone la entidad y no el
 * cliente: es el momento en que el servidor lo acepta.
 *
 * <p>La fecha se trunca a MICROSEGUNDOS, y no es un detalle cosmetico.
 * {@code LocalDateTime.now()} tiene precision de nanosegundos, pero una columna
 * TIMESTAMP guarda microsegundos -tanto en PostgreSQL como en H2- y al guardar
 * REDONDEA. Sin truncar, el valor que vuelve de la base puede ser mayor que el
 * que se comparo, y entonces un mensaje que acaba de darse por leido seguiria
 * contando como no leido. Truncar hace que el valor viaje de ida y vuelta sin
 * cambiar.
 */
@Entity
@Table(name = "mensaje_hilo")
public class MensajeHilo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "hilo_id", nullable = false)
	private HiloConversacion hilo;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "autor_id", nullable = false)
	private Trabajador autor;

	@Column(nullable = false, length = 4000)
	private String cuerpo;

	@Column(name = "enviado_en", nullable = false)
	private LocalDateTime enviadoEn;

	protected MensajeHilo() {
		// requerido por JPA
	}

	public MensajeHilo(HiloConversacion hilo, Trabajador autor, String cuerpo) {
		this.hilo = hilo;
		this.autor = autor;
		this.cuerpo = cuerpo;
		this.enviadoEn = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
	}

	public Long getId() {
		return id;
	}

	public HiloConversacion getHilo() {
		return hilo;
	}

	public Trabajador getAutor() {
		return autor;
	}

	public String getCuerpo() {
		return cuerpo;
	}

	public LocalDateTime getEnviadoEn() {
		return enviadoEn;
	}

}

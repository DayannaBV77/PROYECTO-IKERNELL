package com.PROYECTO.IKERNELL.backend.actividades.domain;

import java.time.LocalDateTime;

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
 * Registro de la ejecucion de una actividad (RF-022, HU-16 C02).
 *
 * <p>Entidad propia y no un campo en la actividad (decision sobre A-04): HU-16
 * pide "dejar registrado el trabajo que realizo" y el reporte de desempeno de
 * HU-07 necesitara ese historial.
 */
@Entity
@Table(name = "ejecucion_actividad")
public class EjecucionActividad {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "actividad_id", nullable = false)
	private Actividad actividad;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "ejecutada_por_id", nullable = false)
	private Trabajador ejecutadaPor;

	@Column(name = "iniciada_en", nullable = false)
	private LocalDateTime iniciadaEn;

	@Column(name = "finalizada_en")
	private LocalDateTime finalizadaEn;

	@Column(length = 2000)
	private String observaciones;

	protected EjecucionActividad() {
		// requerido por JPA
	}

	public EjecucionActividad(Actividad actividad, Trabajador ejecutadaPor, String observaciones) {
		this.actividad = actividad;
		this.ejecutadaPor = ejecutadaPor;
		this.observaciones = observaciones;
		this.iniciadaEn = LocalDateTime.now();
	}

	public void finalizar() {
		this.finalizadaEn = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Actividad getActividad() {
		return actividad;
	}

	public Trabajador getEjecutadaPor() {
		return ejecutadaPor;
	}

	public LocalDateTime getIniciadaEn() {
		return iniciadaEn;
	}

	public LocalDateTime getFinalizadaEn() {
		return finalizadaEn;
	}

	public String getObservaciones() {
		return observaciones;
	}

}

package com.PROYECTO.IKERNELL.backend.asignaciones.domain;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Relacion trabajador-proyecto (RF-003 y RF-009).
 *
 * <p>Decision S-01: una sola entidad para los dos requerimientos. RF-003 (el
 * coordinador asigna un trabajador) y RF-009 (el lider asigna desarrolladores)
 * crean exactamente la misma relacion; lo que cambia es quien puede crearla y
 * con que rol. Duplicar la tabla habria permitido que las dos se contradijeran.
 *
 * <p>Esta entidad es la que hace posible el <b>nivel 2</b> de autorizacion: los
 * permisos sobre un proyecto concreto se derivan de la asignacion activa, no del
 * tipo global del trabajador.
 */
@Entity
@Table(name = "asignacion")
public class Asignacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "trabajador_id", nullable = false)
	private Trabajador trabajador;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "proyecto_id", nullable = false)
	private Proyecto proyecto;

	@Enumerated(EnumType.STRING)
	@Column(name = "rol_en_proyecto", nullable = false, length = 15)
	private RolEnProyecto rolEnProyecto;

	@Column(nullable = false)
	private boolean activa = true;

	/** Quien registro la asignacion: distingue el flujo de RF-003 del de RF-009. */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "asignada_por_id", nullable = false)
	private Trabajador asignadaPor;

	@Column(name = "fecha_asignacion", nullable = false)
	private LocalDate fechaAsignacion;

	protected Asignacion() {
		// requerido por JPA
	}

	public Asignacion(Trabajador trabajador, Proyecto proyecto, RolEnProyecto rolEnProyecto,
			Trabajador asignadaPor) {
		this.trabajador = trabajador;
		this.proyecto = proyecto;
		this.rolEnProyecto = rolEnProyecto;
		this.asignadaPor = asignadaPor;
		this.activa = true;
		this.fechaAsignacion = LocalDate.now();
	}

	public Long getId() {
		return id;
	}

	public Trabajador getTrabajador() {
		return trabajador;
	}

	public Proyecto getProyecto() {
		return proyecto;
	}

	public RolEnProyecto getRolEnProyecto() {
		return rolEnProyecto;
	}

	public boolean estaActiva() {
		return activa;
	}

	public Trabajador getAsignadaPor() {
		return asignadaPor;
	}

	public LocalDate getFechaAsignacion() {
		return fechaAsignacion;
	}

}

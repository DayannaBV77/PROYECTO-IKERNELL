package com.PROYECTO.IKERNELL.backend.actividades.domain;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
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
 * Actividad que un desarrollador debe realizar dentro de un proyecto
 * (RF-019 a RF-022).
 *
 * <p>El proyecto no es un atributo propio: se obtiene de la etapa. Asi es
 * imposible que una actividad diga pertenecer a un proyecto distinto del de su
 * etapa.
 *
 * <p>No hay setter para {@code desarrollador}: RF-021 manda conservar la
 * asociacion con el desarrollador al modificar la actividad, y HU-13 C05 lo
 * confirma. Cambiarlo requeriria una regla de negocio que todavia no existe.
 *
 * <p>{@code prioridad} y {@code fechaPlanificada} los anade RF-038, que las
 * enumera entre sus entradas y exige mostrar "las actividades pendientes del dia
 * ordenadas por prioridad". RF-019 no las pide al registrar, de modo que las dos
 * admiten nulo: las actividades registradas antes no las tienen y no se les
 * puede inventar un valor.
 */
@Entity
@Table(name = "actividad")
public class Actividad {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "etapa_id", nullable = false)
	private Etapa etapa;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "desarrollador_id", nullable = false)
	private Trabajador desarrollador;

	@Column(nullable = false, length = 2000)
	private String descripcion;

	/**
	 * Estado operativo de la actividad. Reservado para D-04: hoy ninguna
	 * operacion lo escribe, porque los estados posibles no estan definidos.
	 */
	@Column(length = 20)
	private String estado;

	/**
	 * Prioridad con que se planifico. Nula mientras el lider no la indique;
	 * valores PROPUESTOS en {@link PrioridadActividad} (D-29).
	 */
	@Enumerated(EnumType.STRING)
	@Column(length = 10)
	private PrioridadActividad prioridad;

	/** Dia para el que se planifica. Es lo que responde "las del dia" de RF-038. */
	@Column(name = "fecha_planificada")
	private LocalDate fechaPlanificada;

	protected Actividad() {
		// requerido por JPA
	}

	public Actividad(Etapa etapa, Trabajador desarrollador, String descripcion,
			PrioridadActividad prioridad, LocalDate fechaPlanificada) {
		this.etapa = etapa;
		this.desarrollador = desarrollador;
		this.descripcion = descripcion;
		this.prioridad = prioridad;
		this.fechaPlanificada = fechaPlanificada;
	}

	/** RN-06: solo el desarrollador asignado puede ejecutarla (HU-16 C03). */
	public boolean estaAsignadaA(Long trabajadorId) {
		return desarrollador.getId().equals(trabajadorId);
	}

	/** Proyecto al que pertenece, derivado de la etapa. */
	public Proyecto getProyecto() {
		return etapa.getProyecto();
	}

	public Long getId() {
		return id;
	}

	public Etapa getEtapa() {
		return etapa;
	}

	/** Solo admite etapas del mismo proyecto; lo valida el servicio. */
	public void setEtapa(Etapa etapa) {
		this.etapa = etapa;
	}

	public Trabajador getDesarrollador() {
		return desarrollador;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public String getEstado() {
		return estado;
	}

	public PrioridadActividad getPrioridad() {
		return prioridad;
	}

	public void setPrioridad(PrioridadActividad prioridad) {
		this.prioridad = prioridad;
	}

	public LocalDate getFechaPlanificada() {
		return fechaPlanificada;
	}

	public void setFechaPlanificada(LocalDate fechaPlanificada) {
		this.fechaPlanificada = fechaPlanificada;
	}

}

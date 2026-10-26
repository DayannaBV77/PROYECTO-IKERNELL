package com.PROYECTO.IKERNELL.backend.proyectos.domain;

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
 * Etapa de un proyecto (RF-010, RF-011, RF-012).
 *
 * <p>La etapa no existe sin proyecto y la relacion no cambia al modificarla
 * (HU-11 C03: "la etapa sigue asociada al mismo proyecto"), por eso no hay
 * setter para {@code proyecto}.
 *
 * <p>RESUELTO D-36: la "fase del proyecto" de los errores y las interrupciones
 * (RF-023, RF-024) ES esta misma etapa. Esa decision revirtio la D-05, que habia
 * resuelto lo contrario y creaba un catalogo de fases aparte, retirado en V9.
 * Desde entonces las dos entidades de incidencias apuntan aqui, y el servicio
 * exige que la etapa sea una del proyecto de la propia incidencia.
 *
 * <p>Tambien apuntan aqui las actividades (RF-019) y los hilos de conversacion
 * (RF-037), de modo que son cuatro las entidades que impiden eliminar una etapa
 * con registros asociados (RN-08).
 */
@Entity
@Table(name = "etapa")
public class Etapa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "proyecto_id", nullable = false)
	private Proyecto proyecto;

	@Column(nullable = false, length = 150)
	private String nombre;

	@Column(length = 2000)
	private String descripcion;

	/** Orden de ejecucion. Propuesta sin respaldo documental; ver D-03. */
	@Column(name = "orden")
	private Integer orden;

	protected Etapa() {
		// requerido por JPA
	}

	public Etapa(Proyecto proyecto, String nombre, String descripcion, Integer orden) {
		this.proyecto = proyecto;
		this.nombre = nombre;
		this.descripcion = descripcion;
		this.orden = orden;
	}

	public Long getId() {
		return id;
	}

	public Proyecto getProyecto() {
		return proyecto;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public Integer getOrden() {
		return orden;
	}

	public void setOrden(Integer orden) {
		this.orden = orden;
	}

}

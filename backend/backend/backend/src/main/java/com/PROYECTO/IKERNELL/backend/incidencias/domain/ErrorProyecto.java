package com.PROYECTO.IKERNELL.backend.incidencias.domain;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
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
 * Error encontrado en un proyecto (RF-023, HU-17).
 *
 * <p>RN-10: el minimo obligatorio es el tipo de error y la fase en que se
 * encontro. La descripcion y la fecha quedan opcionales mientras la empresa no
 * las declare obligatorias (HU-17 C04).
 *
 * <p>La fase apunta al catalogo {@code FaseProyecto}, no a una etapa: son
 * conceptos distintos.
 */
@Entity
@Table(name = "error_proyecto")
public class ErrorProyecto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "proyecto_id", nullable = false)
	private Proyecto proyecto;

	@Column(name = "tipo_error", nullable = false, length = 50)
	private String tipoError;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "fase_id", nullable = false)
	private FaseProyecto fase;

	@Column(length = 2000)
	private String descripcion;

	private LocalDate fecha;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "registrado_por_id", nullable = false)
	private Trabajador registradoPor;

	protected ErrorProyecto() {
		// requerido por JPA
	}

	public ErrorProyecto(Proyecto proyecto, String tipoError, FaseProyecto fase, String descripcion,
			LocalDate fecha, Trabajador registradoPor) {
		this.proyecto = proyecto;
		this.tipoError = tipoError;
		this.fase = fase;
		this.descripcion = descripcion;
		this.fecha = fecha;
		this.registradoPor = registradoPor;
	}

	public Long getId() {
		return id;
	}

	public Proyecto getProyecto() {
		return proyecto;
	}

	public String getTipoError() {
		return tipoError;
	}

	public FaseProyecto getFase() {
		return fase;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public Trabajador getRegistradoPor() {
		return registradoPor;
	}

}

package com.PROYECTO.IKERNELL.backend.incidencias.domain;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
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
 * <p>D-36: la fase en que se encontro el error ES una etapa del proyecto, y
 * debe pertenecer al proyecto del propio error. Esa correspondencia no cabe en
 * una restriccion de columna, asi que la valida el servicio.
 *
 * <p>{@code etapa} admite nulo y {@code faseHistorica} existe por los registros
 * anteriores a D-36, que apuntaban a un catalogo de fases hoy retirado y cuyo
 * nombre no se puede remapear a una etapa sin inventar la correspondencia
 * (D-37). Toda incidencia tiene uno de los dos; las nuevas, siempre la etapa.
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

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "etapa_id")
	private Etapa etapa;

	/** Nombre de la fase del catalogo retirado; solo en registros previos a D-36. */
	@Column(name = "fase_historica", length = 80)
	private String faseHistorica;

	@Column(length = 2000)
	private String descripcion;

	private LocalDate fecha;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "registrado_por_id", nullable = false)
	private Trabajador registradoPor;

	protected ErrorProyecto() {
		// requerido por JPA
	}

	public ErrorProyecto(Proyecto proyecto, String tipoError, Etapa etapa, String descripcion,
			LocalDate fecha, Trabajador registradoPor) {
		this.proyecto = proyecto;
		this.tipoError = tipoError;
		this.etapa = etapa;
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

	public Etapa getEtapa() {
		return etapa;
	}

	/** Solo tiene valor en los registros previos a D-36 (ver {@link #getEtapa()}). */
	public String getFaseHistorica() {
		return faseHistorica;
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

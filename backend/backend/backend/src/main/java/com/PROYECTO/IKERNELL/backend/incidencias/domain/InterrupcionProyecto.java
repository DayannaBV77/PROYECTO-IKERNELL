package com.PROYECTO.IKERNELL.backend.incidencias.domain;

import java.math.BigDecimal;
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
 * Interrupcion que afecto el desarrollo de un proyecto (RF-024, HU-18).
 *
 * <p>RN-10: los cuatro datos son obligatorios -tipo, fecha, duracion y fase-,
 * confirmado por HU-18 C01 y C02. A diferencia del error, aqui la fecha si es
 * obligatoria.
 *
 * <p>D-36: la fase en que ocurrio ES una etapa del proyecto, y debe pertenecer
 * al proyecto de la propia interrupcion; lo valida el servicio, porque no cabe
 * en una restriccion de columna. {@code etapa} admite nulo y existe
 * {@code faseHistorica} por los registros previos a D-36, que apuntaban al
 * catalogo de fases ya retirado (D-37). Las interrupciones nuevas exigen etapa.
 */
@Entity
@Table(name = "interrupcion_proyecto")
public class InterrupcionProyecto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "proyecto_id", nullable = false)
	private Proyecto proyecto;

	@Column(name = "tipo_interrupcion", nullable = false, length = 50)
	private String tipoInterrupcion;

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(name = "duracion_valor", nullable = false, precision = 8, scale = 2)
	private BigDecimal duracionValor;

	@Enumerated(EnumType.STRING)
	@Column(name = "duracion_unidad", nullable = false, length = 10)
	private UnidadDuracion duracionUnidad;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "etapa_id")
	private Etapa etapa;

	/** Nombre de la fase del catalogo retirado; solo en registros previos a D-36. */
	@Column(name = "fase_historica", length = 80)
	private String faseHistorica;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "registrado_por_id", nullable = false)
	private Trabajador registradoPor;

	protected InterrupcionProyecto() {
		// requerido por JPA
	}

	public InterrupcionProyecto(Proyecto proyecto, String tipoInterrupcion, LocalDate fecha,
			BigDecimal duracionValor, UnidadDuracion duracionUnidad, Etapa etapa,
			Trabajador registradoPor) {
		this.proyecto = proyecto;
		this.tipoInterrupcion = tipoInterrupcion;
		this.fecha = fecha;
		this.duracionValor = duracionValor;
		this.duracionUnidad = duracionUnidad;
		this.etapa = etapa;
		this.registradoPor = registradoPor;
	}

	public Long getId() {
		return id;
	}

	public Proyecto getProyecto() {
		return proyecto;
	}

	public String getTipoInterrupcion() {
		return tipoInterrupcion;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public BigDecimal getDuracionValor() {
		return duracionValor;
	}

	public UnidadDuracion getDuracionUnidad() {
		return duracionUnidad;
	}

	public Etapa getEtapa() {
		return etapa;
	}

	/** Solo tiene valor en los registros previos a D-36 (ver {@link #getEtapa()}). */
	public String getFaseHistorica() {
		return faseHistorica;
	}

	public Trabajador getRegistradoPor() {
		return registradoPor;
	}

}

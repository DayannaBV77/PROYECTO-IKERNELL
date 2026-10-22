package com.PROYECTO.IKERNELL.backend.incidencias.domain;

import java.math.BigDecimal;
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
 * Interrupcion que afecto el desarrollo de un proyecto (RF-024, HU-18).
 *
 * <p>RN-10: los cuatro datos son obligatorios -tipo, fecha, duracion y fase-,
 * confirmado por HU-18 C01 y C02. A diferencia del error, aqui la fecha si es
 * obligatoria.
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

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "fase_id", nullable = false)
	private FaseProyecto fase;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "registrado_por_id", nullable = false)
	private Trabajador registradoPor;

	protected InterrupcionProyecto() {
		// requerido por JPA
	}

	public InterrupcionProyecto(Proyecto proyecto, String tipoInterrupcion, LocalDate fecha,
			BigDecimal duracionValor, UnidadDuracion duracionUnidad, FaseProyecto fase,
			Trabajador registradoPor) {
		this.proyecto = proyecto;
		this.tipoInterrupcion = tipoInterrupcion;
		this.fecha = fecha;
		this.duracionValor = duracionValor;
		this.duracionUnidad = duracionUnidad;
		this.fase = fase;
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

	public FaseProyecto getFase() {
		return fase;
	}

	public Trabajador getRegistradoPor() {
		return registradoPor;
	}

}

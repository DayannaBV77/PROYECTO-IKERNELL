package com.PROYECTO.IKERNELL.backend.midia.domain;

import java.time.LocalDate;
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
 * Tarea o recordatorio personal del panel «Mi Dia» (RF-038).
 *
 * <p>No es una actividad: no pertenece a un proyecto ni a una etapa, y solo la
 * ve y la administra el trabajador que la creo. Las actividades del sistema
 * siguen viviendo en {@code Actividad} y su estado se deriva de las ejecuciones
 * (D-31); esta entidad cubre el checklist propio que RF-038 no detallaba.
 *
 * <p>La fecha permite que el panel muestre solo las del dia sin borrar las de
 * dias anteriores: una tarea vieja no desaparece del historial, simplemente deja
 * de aparecer en el panel de hoy.
 */
@Entity
@Table(name = "tarea_mi_dia")
public class TareaMiDia {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "trabajador_id", nullable = false)
	private Trabajador trabajador;

	@Column(nullable = false, length = 500)
	private String descripcion;

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(nullable = false)
	private boolean completada;

	@Column(name = "creada_en", nullable = false)
	private LocalDateTime creadaEn;

	protected TareaMiDia() {
		// requerido por JPA
	}

	public TareaMiDia(Trabajador trabajador, String descripcion, LocalDate fecha) {
		this.trabajador = trabajador;
		this.descripcion = descripcion;
		this.fecha = fecha;
		this.completada = false;
		this.creadaEn = LocalDateTime.now();
	}

	/** Alterna el estado del checklist sin tocar la fecha de creacion. */
	public void cambiarEstado(boolean completada) {
		this.completada = completada;
	}

	public Long getId() {
		return id;
	}

	public Trabajador getTrabajador() {
		return trabajador;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public boolean isCompletada() {
		return completada;
	}

	public LocalDateTime getCreadaEn() {
		return creadaEn;
	}

}

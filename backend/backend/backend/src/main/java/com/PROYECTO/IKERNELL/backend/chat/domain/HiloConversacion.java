package com.PROYECTO.IKERNELL.backend.chat.domain;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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
 * Hilo de conversacion vinculado a un proyecto o a una de sus etapas
 * (RF-037, HU-22).
 *
 * <p>El proyecto es obligatorio y la etapa opcional: HU-22 C01 habla de "los
 * hilos disponibles para ese proyecto" y C03 de un hilo "asociado a esa etapa",
 * de modo que las dos formas existen. Cuando hay etapa, debe ser una del mismo
 * proyecto; eso no cabe en una restriccion de columna y lo valida el servicio.
 *
 * <p>A diferencia de {@code Actividad}, el proyecto SI es un atributo propio y
 * no se deriva de la etapa: un hilo de proyecto no tiene etapa de la que
 * derivarlo.
 *
 * <p>No hay operacion de cerrar ni archivar un hilo, porque ningun
 * requerimiento la pide.
 */
@Entity
@Table(name = "hilo_conversacion")
public class HiloConversacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "proyecto_id", nullable = false)
	private Proyecto proyecto;

	/** Nulo en un hilo de proyecto; con valor, una etapa de ese mismo proyecto. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "etapa_id")
	private Etapa etapa;

	@Column(nullable = false, length = 250)
	private String titulo;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "creado_por_id", nullable = false)
	private Trabajador creadoPor;

	@Column(name = "creado_en", nullable = false)
	private LocalDateTime creadoEn;

	protected HiloConversacion() {
		// requerido por JPA
	}

	public HiloConversacion(Proyecto proyecto, Etapa etapa, String titulo, Trabajador creadoPor) {
		this.proyecto = proyecto;
		this.etapa = etapa;
		this.titulo = titulo;
		this.creadoPor = creadoPor;
		// Truncado a microsegundos, igual que las demas marcas de tiempo del modulo.
		this.creadoEn = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
	}

	public Long getId() {
		return id;
	}

	public Proyecto getProyecto() {
		return proyecto;
	}

	public Etapa getEtapa() {
		return etapa;
	}

	public String getTitulo() {
		return titulo;
	}

	public Trabajador getCreadoPor() {
		return creadoPor;
	}

	public LocalDateTime getCreadoEn() {
		return creadoEn;
	}

}

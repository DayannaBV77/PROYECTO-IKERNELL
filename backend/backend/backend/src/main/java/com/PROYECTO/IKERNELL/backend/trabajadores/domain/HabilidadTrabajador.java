package com.PROYECTO.IKERNELL.backend.trabajadores.domain;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "trabajador_habilidad", uniqueConstraints = @UniqueConstraint(
		name = "uk_trabajador_habilidad", columnNames = { "trabajador_id", "categoria", "nombre" }))
public class HabilidadTrabajador {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "trabajador_id", nullable = false)
	private Trabajador trabajador;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private CategoriaHabilidad categoria;

	@Column(nullable = false, length = 50)
	private String nombre;

	protected HabilidadTrabajador() {
	}

	public HabilidadTrabajador(Trabajador trabajador, CategoriaHabilidad categoria, String nombre) {
		this.trabajador = trabajador;
		this.categoria = categoria;
		this.nombre = nombre;
	}

	public Long getId() {
		return id;
	}

	public CategoriaHabilidad getCategoria() {
		return categoria;
	}

	public String getNombre() {
		return nombre;
	}
}

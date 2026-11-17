package com.PROYECTO.IKERNELL.backend.asignaciones.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "rol")
public class Rol {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "nombre_rol", nullable = false, unique = true, length = 50)
	private String nombreRol;

	protected Rol() {
	}

	public Long getId() {
		return id;
	}

	public String getNombreRol() {
		return nombreRol;
	}

	public RolEnProyecto comoRolEnProyecto() {
		return RolEnProyecto.desdeNombreCatalogo(nombreRol);
	}
}

package com.PROYECTO.IKERNELL.backend.incidencias.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Fase del ciclo de vida del proyecto (RF-023, RF-024).
 *
 * <p>Catalogo de referencia transversal. No es lo mismo que una
 * {@code Etapa}: la etapa pertenece a un proyecto y la gestiona su lider,
 * mientras que la fase es comun a todos los proyectos y el desarrollador solo
 * la elige para indicar donde encontro un error o donde ocurrio una
 * interrupcion.
 *
 * <p>Solo de lectura: ningun requerimiento define quien administra el catalogo.
 * Se marca {@code activa = false} en lugar de borrar, para no dejar sin
 * referencia las incidencias ya registradas.
 */
@Entity
@Table(name = "fase_proyecto")
public class FaseProyecto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 80)
	private String nombre;

	@Column(nullable = false)
	private Integer orden;

	@Column(nullable = false)
	private boolean activa = true;

	protected FaseProyecto() {
		// requerido por JPA
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public Integer getOrden() {
		return orden;
	}

	public boolean estaActiva() {
		return activa;
	}

}

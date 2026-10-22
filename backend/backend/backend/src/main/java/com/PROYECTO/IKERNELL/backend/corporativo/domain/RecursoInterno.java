package com.PROYECTO.IKERNELL.backend.corporativo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Programa de la biblioteca o tutorial de programacion (RF-029, RF-030).
 *
 * <p>Reservado a los trabajadores autenticados. Vive en su propia tabla, aparte
 * del contenido publico, para que no exista ninguna via por la que un visitante
 * anonimo pueda alcanzarlo (HU-01 C05).
 *
 * <p>Nace sin publicar, igual que el contenido publico: HU-21 C04 contempla
 * explicitamente que una seccion "todavia no tenga contenido publicado".
 */
@Entity
@Table(name = "recurso_interno")
public class RecursoInterno {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TipoRecurso tipo;

	@Column(nullable = false, length = 250)
	private String titulo;

	@Column(length = 2000)
	private String descripcion;

	/** Clasificacion pendiente de acordar (D-27); sirve a los filtros de HU-21 C05. */
	@Column(length = 100)
	private String categoria;

	/** Version del programa. RF-029 la menciona sin definir como se maneja. */
	@Column(length = 50)
	private String version;

	/** Cuerpo del tutorial (HU-21 C03: "abrir cualquiera para ver su contenido"). */
	@Column(length = 16000)
	private String contenido;

	/** Enlace o recurso autorizado (HU-21 C02). */
	@Column(length = 500)
	private String enlace;

	private Integer orden;

	@Column(nullable = false)
	private boolean publicada = false;

	protected RecursoInterno() {
		// requerido por JPA
	}

	public RecursoInterno(TipoRecurso tipo, String titulo, String descripcion, String categoria,
			String version, String contenido, String enlace, Integer orden) {
		this.tipo = tipo;
		this.titulo = titulo;
		this.descripcion = descripcion;
		this.categoria = categoria;
		this.version = version;
		this.contenido = contenido;
		this.enlace = enlace;
		this.orden = orden;
		this.publicada = false;
	}

	public void actualizar(String titulo, String descripcion, String categoria, String version,
			String contenido, String enlace, Integer orden) {
		this.titulo = titulo;
		this.descripcion = descripcion;
		this.categoria = categoria;
		this.version = version;
		this.contenido = contenido;
		this.enlace = enlace;
		this.orden = orden;
	}

	public void cambiarPublicacion(boolean publicada) {
		this.publicada = publicada;
	}

	public Long getId() {
		return id;
	}

	public TipoRecurso getTipo() {
		return tipo;
	}

	public String getTitulo() {
		return titulo;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public String getCategoria() {
		return categoria;
	}

	public String getVersion() {
		return version;
	}

	public String getContenido() {
		return contenido;
	}

	public String getEnlace() {
		return enlace;
	}

	public Integer getOrden() {
		return orden;
	}

	public boolean estaPublicada() {
		return publicada;
	}

}

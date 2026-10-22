package com.PROYECTO.IKERNELL.backend.publico.domain;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Una pieza de informacion empresarial publica (RF-032 a RF-036).
 *
 * <p>El significado de {@code titulo}, {@code cuerpo} y {@code enlace} depende
 * del tipo; la migracion V6 documenta la correspondencia. Por ejemplo, en una
 * pregunta frecuente el titulo es la pregunta y el cuerpo la respuesta.
 *
 * <p>Nace sin publicar: HU-01 C02 y C03 y RF-034 exigen mostrar unicamente
 * contenido publicado por la empresa, de modo que lo seguro por omision es que
 * nada se vea hasta que alguien lo publique expresamente.
 */
@Entity
@Table(name = "contenido_publico")
public class ContenidoPublico {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private TipoContenido tipo;

	@Column(nullable = false, length = 250)
	private String titulo;

	@Column(length = 8000)
	private String cuerpo;

	@Column(length = 500)
	private String enlace;

	private LocalDate fecha;

	private Integer orden;

	@Column(nullable = false)
	private boolean publicada = false;

	protected ContenidoPublico() {
		// requerido por JPA
	}

	public ContenidoPublico(TipoContenido tipo, String titulo, String cuerpo, String enlace,
			LocalDate fecha, Integer orden) {
		this.tipo = tipo;
		this.titulo = titulo;
		this.cuerpo = cuerpo;
		this.enlace = enlace;
		this.fecha = fecha;
		this.orden = orden;
		this.publicada = false;
	}

	public void actualizar(String titulo, String cuerpo, String enlace, LocalDate fecha, Integer orden) {
		this.titulo = titulo;
		this.cuerpo = cuerpo;
		this.enlace = enlace;
		this.fecha = fecha;
		this.orden = orden;
	}

	/**
	 * Publica o retira el contenido de la pagina publica.
	 *
	 * <p>Despublicar en lugar de borrar mantiene la coherencia con RN-02: el
	 * sistema conserva lo registrado y cambia su visibilidad.
	 */
	public void cambiarPublicacion(boolean publicada) {
		this.publicada = publicada;
	}

	public Long getId() {
		return id;
	}

	public TipoContenido getTipo() {
		return tipo;
	}

	public String getTitulo() {
		return titulo;
	}

	public String getCuerpo() {
		return cuerpo;
	}

	public String getEnlace() {
		return enlace;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public Integer getOrden() {
		return orden;
	}

	public boolean estaPublicada() {
		return publicada;
	}

}

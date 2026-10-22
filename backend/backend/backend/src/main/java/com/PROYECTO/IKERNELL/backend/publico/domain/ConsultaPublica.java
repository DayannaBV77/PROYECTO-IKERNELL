package com.PROYECTO.IKERNELL.backend.publico.domain;

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
 * Consulta enviada por un interesado desde el formulario publico (RF-035, HU-02).
 *
 * <p>No tiene ninguna via de lectura publica, y eso es el requisito, no un
 * descuido: HU-02 C05 exige que la consulta "no aparezca en ninguna parte
 * visible" para otros visitantes.
 */
@Entity
@Table(name = "consulta_publica")
public class ConsultaPublica {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 4000)
	private String pregunta;

	@Column(name = "nombre_contacto", length = 150)
	private String nombreContacto;

	@Column(name = "correo_contacto", length = 150)
	private String correoContacto;

	@Column(name = "telefono_contacto", length = 50)
	private String telefonoContacto;

	@Column(name = "recibida_en", nullable = false)
	private LocalDateTime recibidaEn;

	@Column(nullable = false)
	private boolean atendida = false;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "atendida_por_id")
	private Trabajador atendidaPor;

	protected ConsultaPublica() {
		// requerido por JPA
	}

	public ConsultaPublica(String pregunta, String nombreContacto, String correoContacto,
			String telefonoContacto) {
		this.pregunta = pregunta;
		this.nombreContacto = nombreContacto;
		this.correoContacto = correoContacto;
		this.telefonoContacto = telefonoContacto;
		this.recibidaEn = LocalDateTime.now();
		this.atendida = false;
	}

	public void marcarAtendida(Trabajador trabajador) {
		this.atendida = true;
		this.atendidaPor = trabajador;
	}

	public Long getId() {
		return id;
	}

	public String getPregunta() {
		return pregunta;
	}

	public String getNombreContacto() {
		return nombreContacto;
	}

	public String getCorreoContacto() {
		return correoContacto;
	}

	public String getTelefonoContacto() {
		return telefonoContacto;
	}

	public LocalDateTime getRecibidaEn() {
		return recibidaEn;
	}

	public boolean estaAtendida() {
		return atendida;
	}

	public Trabajador getAtendidaPor() {
		return atendidaPor;
	}

}

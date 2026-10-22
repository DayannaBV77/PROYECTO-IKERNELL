package com.PROYECTO.IKERNELL.backend.auth.domain;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 * Credenciales de acceso de un trabajador (RF-027).
 *
 * <p>Separada de {@code Trabajador} por decision D-01, que distingue los datos
 * del perfil de los mecanismos de autenticacion.
 *
 * <p>PROPUESTA pendiente de validacion: el identificador de acceso es el correo
 * corporativo. Ningun documento lo define; HU-03 T1 lo deja como acuerdo
 * pendiente con la empresa ("acordar que credenciales usaran los trabajadores").
 *
 * <p>La entidad no tiene estado propio: el inicio de sesion valida
 * {@code trabajador.estado}, de modo que RN-03 se aplica en un solo lugar y no
 * puede haber dos banderas en contradiccion.
 */
@Entity
@Table(name = "cuenta_acceso")
public class CuentaAcceso {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.EAGER, optional = false)
	@JoinColumn(name = "trabajador_id", nullable = false, unique = true)
	private Trabajador trabajador;

	@Column(name = "correo_corporativo", nullable = false, unique = true, length = 150)
	private String correoCorporativo;

	/** Hash BCrypt. Nunca se almacena la contrasena en claro (RNF-001). */
	@Column(name = "password_hash", nullable = false, length = 100)
	private String passwordHash;

	@Column(name = "ultimo_acceso_en")
	private LocalDateTime ultimoAccesoEn;

	protected CuentaAcceso() {
		// requerido por JPA
	}

	public CuentaAcceso(Trabajador trabajador, String correoCorporativo, String passwordHash) {
		this.trabajador = trabajador;
		this.correoCorporativo = correoCorporativo;
		this.passwordHash = passwordHash;
	}

	public void registrarAcceso(LocalDateTime momento) {
		this.ultimoAccesoEn = momento;
	}

	public void cambiarPasswordHash(String nuevoHash) {
		this.passwordHash = nuevoHash;
	}

	public Long getId() {
		return id;
	}

	public Trabajador getTrabajador() {
		return trabajador;
	}

	public String getCorreoCorporativo() {
		return correoCorporativo;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public LocalDateTime getUltimoAccesoEn() {
		return ultimoAccesoEn;
	}

}

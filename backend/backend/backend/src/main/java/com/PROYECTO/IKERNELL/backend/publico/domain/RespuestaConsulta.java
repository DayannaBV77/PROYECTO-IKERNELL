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
 * Respuesta redactada por un coordinador para atender una consulta pública (RF-035, HU-02).
 *
 * <p>Mantiene la trazabilidad completa de la conversación: fecha y hora de la redacción,
 * trabajador responsable, texto exacto de la respuesta, indicador de notificación por correo
 * y detalle de error si el servicio de correo falló.
 */
@Entity
@Table(name = "respuesta_consulta")
public class RespuestaConsulta {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "consulta_id", nullable = false)
	private ConsultaPublica consulta;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "trabajador_id", nullable = false)
	private Trabajador trabajador;

	@Column(nullable = false, length = 4000)
	private String contenido;

	@Column(name = "fecha_respuesta", nullable = false)
	private LocalDateTime fechaRespuesta;

	@Column(name = "enviada_por_correo", nullable = false)
	private boolean enviadaPorCorreo = false;

	@Column(name = "detalle_error", length = 1000)
	private String detalleError;

	protected RespuestaConsulta() {
		// Requerido por JPA
	}

	public RespuestaConsulta(ConsultaPublica consulta, Trabajador trabajador, String contenido) {
		this.consulta = consulta;
		this.trabajador = trabajador;
		this.contenido = contenido;
		this.fechaRespuesta = LocalDateTime.now();
		this.enviadaPorCorreo = false;
	}

	public Long getId() {
		return id;
	}

	public ConsultaPublica getConsulta() {
		return consulta;
	}

	public Trabajador getTrabajador() {
		return trabajador;
	}

	public String getContenido() {
		return contenido;
	}

	public LocalDateTime getFechaRespuesta() {
		return fechaRespuesta;
	}

	public boolean isEnviadaPorCorreo() {
		return enviadaPorCorreo;
	}

	public void setEnviadaPorCorreo(boolean enviadaPorCorreo) {
		this.enviadaPorCorreo = enviadaPorCorreo;
	}

	public String getDetalleError() {
		return detalleError;
	}

	public void setDetalleError(String detalleError) {
		this.detalleError = detalleError;
	}

	public void actualizarFechaRespuesta(LocalDateTime fecha) {
		this.fechaRespuesta = fecha;
	}
}


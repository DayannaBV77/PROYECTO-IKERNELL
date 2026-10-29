package com.PROYECTO.IKERNELL.backend.publico.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/**
 * Consulta enviada por un interesado desde el formulario publico (RF-035, HU-02).
 *
 * <p>No tiene ninguna via de lectura publica, y eso es el requisito, no un
 * descuido: HU-02 C05 exige que la consulta "no aparezca en ninguna parte
 * visible" para otros visitantes.
 *
 * <p>Su gestion interna incluye el seguimiento de estados (PENDIENTE, EN_GESTION,
 * RESPONDIDA, ERROR_NOTIFICACION) y el historial de respuestas redactadas por
 * los trabajadores (rol de coordinador).
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

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private EstadoConsulta estado = EstadoConsulta.PENDIENTE;

	@Column(name = "fecha_respuesta")
	private LocalDateTime fechaRespuesta;

	@OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	@OrderBy("fechaRespuesta ASC")
	private List<RespuestaConsulta> respuestas = new ArrayList<>();

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
		this.estado = EstadoConsulta.PENDIENTE;
	}

	/** Pasa la consulta a estado EN_GESTION si se encontraba pendiente. */
	public void pasarAEnGestion() {
		if (this.estado == EstadoConsulta.PENDIENTE) {
			this.estado = EstadoConsulta.EN_GESTION;
		}
	}

	/**
	 * Registra una respuesta redactada que se notificó exitosamente por correo electrónico.
	 * Marca la consulta como atendida y respondida.
	 */
	public void registrarRespuestaExitosa(RespuestaConsulta respuesta, Trabajador trabajador) {
		respuesta.setEnviadaPorCorreo(true);
		respuesta.setDetalleError(null);
		if (!this.respuestas.contains(respuesta)) {
			this.respuestas.add(respuesta);
		}
		this.atendida = true;
		this.atendidaPor = trabajador;
		this.estado = EstadoConsulta.RESPONDIDA;
		this.fechaRespuesta = respuesta.getFechaRespuesta();
	}

	/**
	 * Registra una respuesta cuya redacción se conservó pero falló la notificación por correo.
	 * La consulta NO se marca como respondida ni desaparece; queda en ERROR_NOTIFICACION.
	 */
	public void registrarRespuestaFallida(RespuestaConsulta respuesta, String error) {
		respuesta.setEnviadaPorCorreo(false);
		respuesta.setDetalleError(error);
		if (!this.respuestas.contains(respuesta)) {
			this.respuestas.add(respuesta);
		}
		this.atendida = false;
		this.estado = EstadoConsulta.ERROR_NOTIFICACION;
	}

	/**
	 * Marca la consulta como atendida manualmente (compatibilidad con la API previa).
	 */
	public void marcarAtendida(Trabajador trabajador) {
		this.atendida = true;
		this.atendidaPor = trabajador;
		this.estado = EstadoConsulta.RESPONDIDA;
		if (this.fechaRespuesta == null) {
			this.fechaRespuesta = LocalDateTime.now();
		}
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

	public EstadoConsulta getEstado() {
		return estado;
	}

	public LocalDateTime getFechaRespuesta() {
		return fechaRespuesta;
	}

	public List<RespuestaConsulta> getRespuestas() {
		return Collections.unmodifiableList(respuestas);
	}
}

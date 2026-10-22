package com.PROYECTO.IKERNELL.backend.auditoria.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Una entrada de la bitacora de operaciones (RNF-003).
 *
 * <p>Registra las peticiones que ESCRIBEN y las que terminan en error. Las
 * consultas de solo lectura se quedan en el log de consola: guardarlas haria
 * crecer la bitacora mas rapido que los datos del negocio sin aportar
 * trazabilidad.
 *
 * <p>No guarda el cuerpo de la peticion a proposito. Ese cuerpo lleva
 * contrasenas en el login y datos personales en RF-001, y una bitacora no debe
 * volverse una segunda copia sin proteger de esos datos.
 */
@Entity
@Table(name = "registro_operacion")
public class RegistroOperacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "ocurrida_en", nullable = false)
	private LocalDateTime ocurridaEn;

	@Column(nullable = false, length = 10)
	private String metodo;

	@Column(nullable = false, length = 500)
	private String ruta;

	@Column(name = "codigo_http", nullable = false)
	private int codigoHttp;

	@Column(nullable = false)
	private boolean exitosa;

	@Column(name = "duracion_ms", nullable = false)
	private long duracionMs;

	/**
	 * Nulo cuando la operacion ocurre sin sesion: el propio login y el
	 * formulario publico de consultas (RF-035).
	 *
	 * <p>Deliberadamente NO es una relacion JPA a Trabajador. Si algun dia se
	 * depura un trabajador, su rastro en la bitacora debe sobrevivir.
	 */
	@Column(name = "trabajador_id")
	private Long trabajadorId;

	@Column(length = 150)
	private String correo;

	/** Solo en los fallos: el mensaje de negocio, no la traza de la excepcion. */
	@Column(name = "detalle_error", length = 2000)
	private String detalleError;

	protected RegistroOperacion() {
		// Requerido por JPA.
	}

	public RegistroOperacion(LocalDateTime ocurridaEn, String metodo, String ruta, int codigoHttp,
			long duracionMs, Long trabajadorId, String correo, String detalleError) {
		this.ocurridaEn = ocurridaEn;
		this.metodo = metodo;
		this.ruta = ruta;
		this.codigoHttp = codigoHttp;
		// Un 4xx es un fallo de la operacion igual que un 5xx: la diferencia esta
		// en de quien es la culpa, no en si el dato se registro o no.
		this.exitosa = codigoHttp < 400;
		this.duracionMs = duracionMs;
		this.trabajadorId = trabajadorId;
		this.correo = correo;
		this.detalleError = detalleError;
	}

	public Long getId() {
		return id;
	}

	public LocalDateTime getOcurridaEn() {
		return ocurridaEn;
	}

	public String getMetodo() {
		return metodo;
	}

	public String getRuta() {
		return ruta;
	}

	public int getCodigoHttp() {
		return codigoHttp;
	}

	public boolean esExitosa() {
		return exitosa;
	}

	public long getDuracionMs() {
		return duracionMs;
	}

	public Long getTrabajadorId() {
		return trabajadorId;
	}

	public String getCorreo() {
		return correo;
	}

	public String getDetalleError() {
		return detalleError;
	}

}

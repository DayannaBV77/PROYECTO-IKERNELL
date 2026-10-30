package com.PROYECTO.IKERNELL.backend.reportes.externo.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Un intento de generar el reporte externo (RF-025, HU-19).
 *
 * <p>Se guarda tanto el exito como el fallo: HU-19 C04 exige que un error no
 * entregue un archivo incompleto, y para poder demostrar que no se entrego hace
 * falta que el intento quede registrado. La bitacora generica
 * ({@code registro_operacion}) anota la peticion HTTP, pero no que proyectos se
 * incluyeron, con que formato ni cuantos registros salieron; eso es lo que
 * aporta esta entidad.
 *
 * <p>No guarda el contenido del archivo ni datos personales de los
 * trabajadores. La auditoria responde "que se genero y bajo que condiciones",
 * no se convierte en una segunda copia de los datos exportados.
 */
@Entity
@Table(name = "auditoria_reporte_externo")
public class AuditoriaReporteExterno {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "ocurrida_en", nullable = false)
	private LocalDateTime ocurridaEn;

	@Column(name = "trabajador_id")
	private Long trabajadorId;

	@Column(length = 150)
	private String correo;

	/**
	 * Proyectos pedidos, separados por comas. Nulo significa "todos los
	 * autorizados", que es distinto de una lista vacia.
	 */
	@Column(name = "proyectos_solicitados", length = 2000)
	private String proyectosSolicitados;

	/** Proyectos que realmente entraron al archivo. */
	@Column(name = "proyectos_incluidos", length = 2000)
	private String proyectosIncluidos;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private ResultadoAuditoriaReporteExterno resultado;

	@Column(length = 20)
	private String formato;

	@Column(length = 30)
	private String codificacion;

	@Column(name = "nombre_archivo", length = 255)
	private String nombreArchivo;

	@Column(name = "total_registros")
	private Integer totalRegistros;

	@Column(name = "duracion_ms", nullable = false)
	private long duracionMs;

	@Column(name = "mensaje_error", length = 2000)
	private String mensajeError;

	protected AuditoriaReporteExterno() {
		// requerido por JPA
	}

	public AuditoriaReporteExterno(LocalDateTime ocurridaEn, Long trabajadorId, String correo,
			String proyectosSolicitados, String proyectosIncluidos,
			ResultadoAuditoriaReporteExterno resultado, String formato, String codificacion,
			String nombreArchivo, Integer totalRegistros, long duracionMs, String mensajeError) {
		this.ocurridaEn = ocurridaEn;
		this.trabajadorId = trabajadorId;
		this.correo = correo;
		this.proyectosSolicitados = proyectosSolicitados;
		this.proyectosIncluidos = proyectosIncluidos;
		this.resultado = resultado;
		this.formato = formato;
		this.codificacion = codificacion;
		this.nombreArchivo = nombreArchivo;
		this.totalRegistros = totalRegistros;
		this.duracionMs = duracionMs;
		this.mensajeError = mensajeError;
	}

	public Long getId() {
		return id;
	}

	public LocalDateTime getOcurridaEn() {
		return ocurridaEn;
	}

	public Long getTrabajadorId() {
		return trabajadorId;
	}

	public String getCorreo() {
		return correo;
	}

	public String getProyectosSolicitados() {
		return proyectosSolicitados;
	}

	public String getProyectosIncluidos() {
		return proyectosIncluidos;
	}

	public ResultadoAuditoriaReporteExterno getResultado() {
		return resultado;
	}

	public String getFormato() {
		return formato;
	}

	public String getCodificacion() {
		return codificacion;
	}

	public String getNombreArchivo() {
		return nombreArchivo;
	}

	public Integer getTotalRegistros() {
		return totalRegistros;
	}

	public long getDuracionMs() {
		return duracionMs;
	}

	public String getMensajeError() {
		return mensajeError;
	}

}

package com.PROYECTO.IKERNELL.backend.trabajadores.domain;

import java.time.LocalDate;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Perfil personal y profesional de un trabajador (RF-001, RF-002, RF-007).
 *
 * <p>Por decision D-01 esta entidad no contiene credenciales: el correo de
 * acceso y la contrasena viven en {@code CuentaAcceso}. La identificacion se
 * conserva aqui como dato personal (CONFIRMADO, Caso de Estudio p.2), no como
 * credencial de acceso.
 */
@Entity
@Table(name = "trabajador", uniqueConstraints = {
		@UniqueConstraint(name = "uk_trabajador_tipo_identificacion_identificacion", columnNames = {
				"tipo_identificacion", "identificacion" })
})
public class Trabajador {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(name = "tipo_identificacion", nullable = false, length = 30)
	private TipoIdentificacion tipoIdentificacion = TipoIdentificacion.CEDULA_CIUDADANIA;

	/** Unica en el sistema por tipo de identificacion (RN-01). Almacenada como VARCHAR. */
	@Column(nullable = false, length = 20)
	private String identificacion;

	@Column(nullable = false, length = 100)
	private String nombre;

	@Column(nullable = false, length = 100)
	private String apellido;

	@Column(name = "fecha_nacimiento", nullable = false)
	private LocalDate fechaNacimiento;

	@Column(nullable = false, length = 200)
	private String direccion;

	@Column(nullable = false, length = 100)
	private String profesion;

	@Column(name = "especialidad_desarrollo", nullable = false, length = 100)
	private String especialidadDesarrollo;

	@Enumerated(EnumType.STRING)
	@Column(name = "tipo_trabajador", nullable = false, length = 15)
	private TipoTrabajador tipoTrabajador;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 15)
	private EstadoHabilitacion estado = EstadoHabilitacion.HABILITADO;

	/** Nulo mientras el perfil no tenga fotografia (HU-04 C05). */
	@Column(name = "foto_ruta", length = 500)
	private String fotoRuta;

	@Column(name = "foto_content_type", length = 100)
	private String fotoContentType;

	@Column(name = "foto_tamano_bytes")
	private Long fotoTamanoBytes;

	protected Trabajador() {
		// requerido por JPA
	}

	public Trabajador(String identificacion, String nombre, String apellido, LocalDate fechaNacimiento,
			String direccion, String profesion, String especialidadDesarrollo, TipoTrabajador tipoTrabajador) {
		this(TipoIdentificacion.CEDULA_CIUDADANIA, identificacion, nombre, apellido, fechaNacimiento, direccion, profesion, especialidadDesarrollo, tipoTrabajador);
	}

	public Trabajador(TipoIdentificacion tipoIdentificacion, String identificacion, String nombre, String apellido, LocalDate fechaNacimiento,
			String direccion, String profesion, String especialidadDesarrollo, TipoTrabajador tipoTrabajador) {
		this.tipoIdentificacion = tipoIdentificacion != null ? tipoIdentificacion : TipoIdentificacion.CEDULA_CIUDADANIA;
		this.identificacion = identificacion;
		this.nombre = nombre;
		this.apellido = apellido;
		this.fechaNacimiento = fechaNacimiento;
		this.direccion = direccion;
		this.profesion = profesion;
		this.especialidadDesarrollo = especialidadDesarrollo;
		this.tipoTrabajador = tipoTrabajador;
		this.estado = EstadoHabilitacion.HABILITADO;
	}

	/**
	 * Cambia el estado a inhabilitado conservando todo el historial (RN-02).
	 * No borra ningun registro asociado.
	 */
	public void inhabilitar() {
		this.estado = EstadoHabilitacion.INHABILITADO;
	}

	/**
	 * Reactiva un trabajador inhabilitado para que pueda operar nuevamente (RF-007).
	 */
	public void habilitar() {
		this.estado = EstadoHabilitacion.HABILITADO;
	}

	/** RN-03: condicion para iniciar sesion y para recibir nuevas asignaciones. */
	public boolean estaHabilitado() {
		return estado.esHabilitado();
	}

	public String nombreCompleto() {
		return nombre + " " + apellido;
	}

	public Long getId() {
		return id;
	}

	public TipoIdentificacion getTipoIdentificacion() {
		return tipoIdentificacion;
	}

	public void setTipoIdentificacion(TipoIdentificacion tipoIdentificacion) {
		this.tipoIdentificacion = tipoIdentificacion;
	}

	public String getIdentificacion() {
		return identificacion;
	}

	public String getNombre() {
		return nombre;
	}

	public String getApellido() {
		return apellido;
	}

	public LocalDate getFechaNacimiento() {
		return fechaNacimiento;
	}

	public String getDireccion() {
		return direccion;
	}

	public void setDireccion(String direccion) {
		this.direccion = direccion;
	}

	public String getProfesion() {
		return profesion;
	}

	public void setProfesion(String profesion) {
		this.profesion = profesion;
	}

	public String getEspecialidadDesarrollo() {
		return especialidadDesarrollo;
	}

	public void setEspecialidadDesarrollo(String especialidadDesarrollo) {
		this.especialidadDesarrollo = especialidadDesarrollo;
	}

	public TipoTrabajador getTipoTrabajador() {
		return tipoTrabajador;
	}

	public void setTipoTrabajador(TipoTrabajador tipoTrabajador) {
		this.tipoTrabajador = tipoTrabajador;
	}

	public EstadoHabilitacion getEstado() {
		return estado;
	}

	public String getFotoRuta() {
		return fotoRuta;
	}

	public String getFotoContentType() {
		return fotoContentType;
	}

	public Long getFotoTamanoBytes() {
		return fotoTamanoBytes;
	}

	public void asignarFotografia(String ruta, String contentType, long tamanoBytes) {
		this.fotoRuta = ruta;
		this.fotoContentType = contentType;
		this.fotoTamanoBytes = tamanoBytes;
	}

}

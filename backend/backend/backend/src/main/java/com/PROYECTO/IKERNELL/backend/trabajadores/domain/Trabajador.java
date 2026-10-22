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

/**
 * Perfil personal y profesional de un trabajador (RF-001, RF-002, RF-007).
 *
 * <p>Por decision D-01 esta entidad no contiene credenciales: el correo de
 * acceso y la contrasena viven en {@code CuentaAcceso}. La identificacion se
 * conserva aqui como dato personal (CONFIRMADO, Caso de Estudio p.2), no como
 * credencial de acceso.
 */
@Entity
@Table(name = "trabajador")
public class Trabajador {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Unica en el sistema (RN-01: RF-001, RF-005, HU-04 C03, RNF-003). */
	@Column(nullable = false, unique = true, length = 20)
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

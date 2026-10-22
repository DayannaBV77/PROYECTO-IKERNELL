package com.PROYECTO.IKERNELL.backend.proyectos.domain;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

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
import jakarta.persistence.Table;

/**
 * Proyecto de la empresa (RF-008, RF-014, RF-015, RF-016).
 *
 * <p>El {@code id} generado es el "identificador unico" que pide RN-09: HU-08
 * C03 solo exige que cada proyecto tenga el suyo y que ninguno se repita.
 *
 * <p>Separa deliberadamente dos nociones de estado (decision C-04):
 * {@code estadoHabilitacion}, confirmado y de dominio cerrado, y
 * {@code estadoOperativo}, cuyos valores debe definir la empresa (D-03). El
 * avance no es un atributo: se calcula al consultarlo.
 */
@Entity
@Table(name = "proyecto")
public class Proyecto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String nombre;

	@Column(length = 2000)
	private String descripcion;

	@Enumerated(EnumType.STRING)
	@Column(name = "estado_habilitacion", nullable = false, length = 15)
	private EstadoHabilitacion estadoHabilitacion = EstadoHabilitacion.HABILITADO;

	/**
	 * Estado operativo registrado. Es {@code String} y no un enum porque los
	 * valores posibles siguen sin definirse (D-03); convertirlo en enum ahora
	 * seria inventar el dominio.
	 */
	@Column(name = "estado_operativo", length = 30)
	private String estadoOperativo;

	/**
	 * Lider que registro el proyecto. Dato capturado pero todavia sin efecto en
	 * la autorizacion, porque A-02 no esta resuelta.
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "lider_responsable_id")
	private Trabajador liderResponsable;

	protected Proyecto() {
		// requerido por JPA
	}

	public Proyecto(String nombre, String descripcion, Trabajador liderResponsable) {
		this.nombre = nombre;
		this.descripcion = descripcion;
		this.liderResponsable = liderResponsable;
		// HU-08 C04: el proyecto recien registrado queda habilitado y disponible
		// para asignarle desarrolladores y registrar sus etapas.
		this.estadoHabilitacion = EstadoHabilitacion.HABILITADO;
	}

	/** RF-015, HU-09 C05: cambia el estado conservando todos los registros historicos. */
	public void inhabilitar() {
		this.estadoHabilitacion = EstadoHabilitacion.INHABILITADO;
	}

	/** RN-04: condicion para recibir asignaciones de trabajadores. */
	public boolean estaHabilitado() {
		return estadoHabilitacion.esHabilitado();
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public EstadoHabilitacion getEstadoHabilitacion() {
		return estadoHabilitacion;
	}

	public String getEstadoOperativo() {
		return estadoOperativo;
	}

	public void setEstadoOperativo(String estadoOperativo) {
		this.estadoOperativo = estadoOperativo;
	}

	public Trabajador getLiderResponsable() {
		return liderResponsable;
	}

}

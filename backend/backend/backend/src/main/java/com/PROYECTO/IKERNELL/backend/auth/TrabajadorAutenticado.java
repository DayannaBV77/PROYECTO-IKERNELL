package com.PROYECTO.IKERNELL.backend.auth;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Principal autenticado. Expone la identidad del trabajador y las autoridades
 * activas para Spring Security.
 *
 * <p>El rol operativo se deriva del contexto del proyecto activo seleccionado
 * (nivel 2), garantizando que un trabajador con rol LIDER en un proyecto y
 * DESARROLLADOR en otro sólo ejerza las funciones autorizadas para el proyecto
 * en el que está trabajando actualmente (RN-05).
 */
public class TrabajadorAutenticado implements UserDetails {

	private final Long trabajadorId;
	private final String correoCorporativo;
	private final String passwordHash;
	private final String nombreCompleto;
	private final TipoTrabajador tipoTrabajador;
	private final boolean habilitado;
	private final Long proyectoActivoId;
	private final String proyectoActivoNombre;
	private final RolEnProyecto rolActivo;

	public TrabajadorAutenticado(CuentaAcceso cuenta) {
		this(cuenta, null, null, null);
	}

	public TrabajadorAutenticado(CuentaAcceso cuenta, Long proyectoActivoId, String proyectoActivoNombre,
			RolEnProyecto rolActivo) {
		this.trabajadorId = cuenta.getTrabajador().getId();
		this.correoCorporativo = cuenta.getCorreoCorporativo();
		this.passwordHash = cuenta.getPasswordHash();
		this.nombreCompleto = cuenta.getTrabajador().nombreCompleto();
		this.tipoTrabajador = cuenta.getTrabajador().getTipoTrabajador();
		this.habilitado = cuenta.getTrabajador().estaHabilitado();
		this.proyectoActivoId = proyectoActivoId;
		this.proyectoActivoNombre = proyectoActivoNombre;
		this.rolActivo = rolActivo;
	}

	private TrabajadorAutenticado(Long trabajadorId, String correoCorporativo, String passwordHash,
			String nombreCompleto, TipoTrabajador tipoTrabajador, boolean habilitado,
			Long proyectoActivoId, String proyectoActivoNombre, RolEnProyecto rolActivo) {
		this.trabajadorId = trabajadorId;
		this.correoCorporativo = correoCorporativo;
		this.passwordHash = passwordHash;
		this.nombreCompleto = nombreCompleto;
		this.tipoTrabajador = tipoTrabajador;
		this.habilitado = habilitado;
		this.proyectoActivoId = proyectoActivoId;
		this.proyectoActivoNombre = proyectoActivoNombre;
		this.rolActivo = rolActivo;
	}

	public TrabajadorAutenticado conContextoProyecto(Long nuevoProyectoId, String nuevoProyectoNombre,
			RolEnProyecto nuevoRol) {
		return new TrabajadorAutenticado(trabajadorId, correoCorporativo, passwordHash, nombreCompleto,
				tipoTrabajador, habilitado, nuevoProyectoId, nuevoProyectoNombre, nuevoRol);
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		Set<GrantedAuthority> autoridades = new LinkedHashSet<>();
		if (tipoTrabajador == TipoTrabajador.COORDINADOR) {
			autoridades.add(new SimpleGrantedAuthority(tipoTrabajador.nombreRol()));
		}
		if (rolActivo != null) {
			autoridades.add(new SimpleGrantedAuthority("ROLE_" + rolActivo.name()));
		}
		else if (tipoTrabajador != TipoTrabajador.COORDINADOR) {
			autoridades.add(new SimpleGrantedAuthority(tipoTrabajador.nombreRol()));
		}
		return List.copyOf(autoridades);
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return correoCorporativo;
	}

	/**
	 * RN-03: el trabajador inhabilitado no puede entrar. Se deriva de
	 * {@code trabajador.estado}, no de una bandera propia de la cuenta.
	 */
	@Override
	public boolean isEnabled() {
		return habilitado;
	}

	public Long getTrabajadorId() {
		return trabajadorId;
	}

	public String getNombreCompleto() {
		return nombreCompleto;
	}

	public TipoTrabajador getTipoTrabajador() {
		return tipoTrabajador;
	}

	public Long getProyectoActivoId() {
		return proyectoActivoId;
	}

	public String getProyectoActivoNombre() {
		return proyectoActivoNombre;
	}

	public RolEnProyecto getRolActivo() {
		return rolActivo;
	}

}

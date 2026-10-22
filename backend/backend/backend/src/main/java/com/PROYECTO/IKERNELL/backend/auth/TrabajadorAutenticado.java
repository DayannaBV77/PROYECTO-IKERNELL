package com.PROYECTO.IKERNELL.backend.auth;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/**
 * Principal autenticado. Expone el <b>nivel 1</b> de autorizacion: el tipo
 * global del trabajador convertido en autoridad de Spring Security (RNF-001).
 *
 * <p>El <b>nivel 2</b> (permiso sobre un proyecto concreto) no se resuelve aqui
 * sino consultando la asignacion activa, porque un lider puede estar asignado
 * como desarrollador en otro proyecto (RN-05, Caso de Estudio p.3).
 */
public class TrabajadorAutenticado implements UserDetails {

	private final Long trabajadorId;
	private final String correoCorporativo;
	private final String passwordHash;
	private final String nombreCompleto;
	private final TipoTrabajador tipoTrabajador;
	private final boolean habilitado;

	public TrabajadorAutenticado(CuentaAcceso cuenta) {
		this.trabajadorId = cuenta.getTrabajador().getId();
		this.correoCorporativo = cuenta.getCorreoCorporativo();
		this.passwordHash = cuenta.getPasswordHash();
		this.nombreCompleto = cuenta.getTrabajador().nombreCompleto();
		this.tipoTrabajador = cuenta.getTrabajador().getTipoTrabajador();
		this.habilitado = cuenta.getTrabajador().estaHabilitado();
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority(tipoTrabajador.nombreRol()));
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

}

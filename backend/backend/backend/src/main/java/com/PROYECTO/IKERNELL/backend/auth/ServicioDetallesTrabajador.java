package com.PROYECTO.IKERNELL.backend.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;

/**
 * Carga las credenciales para el inicio de sesion de RF-027.
 *
 * <p>No distingue entre "correo inexistente" y "cuenta inhabilitada": ambas
 * situaciones terminan en el mismo mensaje generico de acceso denegado, segun
 * RN-11 (HU-03 C03 y C04 exigen el mismo mensaje, sin revelar cual dato fallo).
 */
@Service
public class ServicioDetallesTrabajador implements UserDetailsService {

	private final CuentaAccesoRepository cuentas;

	public ServicioDetallesTrabajador(CuentaAccesoRepository cuentas) {
		this.cuentas = cuentas;
	}

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String correoCorporativo) throws UsernameNotFoundException {
		CuentaAcceso cuenta = cuentas.findByCorreoCorporativo(correoCorporativo)
				.orElseThrow(() -> new UsernameNotFoundException("Acceso denegado."));
		return new TrabajadorAutenticado(cuenta);
	}

}

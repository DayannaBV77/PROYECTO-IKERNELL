package com.PROYECTO.IKERNELL.backend.support;

import java.time.LocalDate;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Construye principales autenticados reales para las pruebas.
 *
 * <p>{@code @WithMockUser} no sirve cuando el controlador necesita el
 * {@code TrabajadorAutenticado}, por ejemplo para registrar al lider
 * responsable de un proyecto: inyectaria un principal de otro tipo y el dato
 * llegaria nulo, con lo que la prueba pasaria sin comprobar nada.
 */
public final class AutenticacionDePrueba {

	private AutenticacionDePrueba() {
	}

	/** Crea un trabajador con su cuenta y devuelve la autenticacion correspondiente. */
	public static Authentication comoTrabajador(TrabajadorRepository trabajadores, CuentaAccesoRepository cuentas,
			String identificacion, String correo, TipoTrabajador tipo) {
		Trabajador trabajador = trabajadores.saveAndFlush(new Trabajador(
				identificacion, "Nombre", "Apellido", LocalDate.of(1990, 1, 1),
				"Calle 1", "Ingenieria de sistemas", "Backend", tipo));
		CuentaAcceso cuenta = cuentas.saveAndFlush(new CuentaAcceso(trabajador, correo, "$2a$10$hashDePrueba"));

		TrabajadorAutenticado principal = new TrabajadorAutenticado(cuenta);
		return new UsernamePasswordAuthenticationToken(principal, "n/a", principal.getAuthorities());
	}

}

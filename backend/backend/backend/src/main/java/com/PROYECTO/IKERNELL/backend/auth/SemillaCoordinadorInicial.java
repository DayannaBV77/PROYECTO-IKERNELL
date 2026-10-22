package com.PROYECTO.IKERNELL.backend.auth;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Crea el primer coordinador para poder entrar al sistema en desarrollo.
 *
 * <p>Resuelve un vacio real del catalogo: RF-001 exige que sea el coordinador
 * quien registre trabajadores, pero ningun requerimiento dice quien registra al
 * primer coordinador. Esta clase es una solucion <b>provisional de desarrollo</b>,
 * no un requisito, y por eso esta limitada al perfil {@code dev}: nunca se
 * ejecuta en pruebas ni en produccion.
 *
 * <p>Queda pendiente de la empresa (D-18) como se aprovisiona realmente la
 * primera cuenta y con que contrasena inicial.
 */
@Component
@Profile("dev")
public class SemillaCoordinadorInicial implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(SemillaCoordinadorInicial.class);

	private final TrabajadorRepository trabajadores;
	private final CuentaAccesoRepository cuentas;
	private final PasswordEncoder passwordEncoder;
	private final String correo;
	private final String password;

	public SemillaCoordinadorInicial(TrabajadorRepository trabajadores, CuentaAccesoRepository cuentas,
			PasswordEncoder passwordEncoder,
			@Value("${ikernell.semilla.coordinador.correo}") String correo,
			@Value("${ikernell.semilla.coordinador.password}") String password) {
		this.trabajadores = trabajadores;
		this.cuentas = cuentas;
		this.passwordEncoder = passwordEncoder;
		this.correo = correo;
		this.password = password;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (trabajadores.existsByTipoTrabajador(TipoTrabajador.COORDINADOR)) {
			return;
		}

		Trabajador coordinador = new Trabajador(
				"1000000001",
				"Coordinador",
				"Inicial",
				LocalDate.of(1990, 1, 1),
				"Sede principal IKernell",
				"Ingenieria de sistemas",
				"Gestion de proyectos",
				TipoTrabajador.COORDINADOR);
		trabajadores.save(coordinador);
		cuentas.save(new CuentaAcceso(coordinador, correo, passwordEncoder.encode(password)));

		log.warn("Perfil dev: creado coordinador inicial '{}'. Solo para desarrollo; ver decision D-18.", correo);
	}

}

package com.PROYECTO.IKERNELL.backend.auth;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Operaciones de persistencia asociadas al inicio de sesion (RF-027). */
@Service
public class ServicioAutenticacion {

	private final CuentaAccesoRepository cuentas;

	public ServicioAutenticacion(CuentaAccesoRepository cuentas) {
		this.cuentas = cuentas;
	}

	/**
	 * Registra el momento del ultimo acceso correcto.
	 *
	 * <p>No es un requisito del catalogo; es trazabilidad minima propuesta. Si la
	 * cuenta ya no existe se ignora en silencio: el login acaba de validarla y no
	 * hay motivo para hacer fallar una sesion correcta por esto.
	 */
	@Transactional
	public void registrarUltimoAcceso(String correoCorporativo) {
		cuentas.findByCorreoCorporativo(correoCorporativo)
				.ifPresent(cuenta -> cuenta.registrarAcceso(LocalDateTime.now()));
	}

}

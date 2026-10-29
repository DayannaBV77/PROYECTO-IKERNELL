package com.PROYECTO.IKERNELL.backend.corporativo;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

@Service
public class ServicioProvisionamientoCorreo {

	private static final Pattern ACENTOS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

	private final CuentaAccesoRepository cuentas;
	private final PasswordEncoder passwordEncoder;
	private final String dominio;
	private final String proveedorUrl;

	public ServicioProvisionamientoCorreo(CuentaAccesoRepository cuentas,
			PasswordEncoder passwordEncoder,
			@Value("${ikernell.correo.dominio:ikernell.com}") String dominio,
			@Value("${ikernell.correo.url:}") String proveedorUrl) {
		this.cuentas = cuentas;
		this.passwordEncoder = passwordEncoder;
		this.dominio = normalizarDominio(dominio);
		this.proveedorUrl = proveedorUrl;
	}

	@Transactional
	public CorreoProvisionado provisionarPara(Trabajador trabajador) {
		String correo = generarCorreoDisponible(trabajador);
		String passwordTemporal = generarPasswordTemporal(trabajador);
		cuentas.save(new CuentaAcceso(trabajador, correo, passwordEncoder.encode(passwordTemporal)));

		String estado = StringUtils.hasText(proveedorUrl)
				? "CREADA_EN_PROVEEDOR_AUTORIZADO"
				: "CREADA_LOCALMENTE_SIMULADA";
		String proveedor = StringUtils.hasText(proveedorUrl) ? "OUTLOOK_GMAIL_EMPRESARIAL" : "SIMULADO";
		return new CorreoProvisionado(correo, passwordTemporal, estado, proveedor);
	}

	private String generarCorreoDisponible(Trabajador trabajador) {
		String base = baseCorreo(trabajador);
		String sugerido = base + "@" + dominio;
		if (!cuentas.existsByCorreoCorporativo(sugerido)) {
			return sugerido;
		}

		for (int intento = 2; intento < 1000; intento++) {
			String candidato = base + intento + "@" + dominio;
			if (!cuentas.existsByCorreoCorporativo(candidato)) {
				return candidato;
			}
		}
		throw new ReglaNegocioException("No fue posible asignar una direccion de correo corporativo disponible para este trabajador.");
	}

	private String baseCorreo(Trabajador trabajador) {
		String nombre = normalizarTexto(trabajador.getNombre());
		String apellido = normalizarTexto(trabajador.getApellido());
		String base = (nombre + "." + apellido).replaceAll("\\.+", ".");
		return base.length() > 30 ? base.substring(0, 30).replaceAll("\\.$", "") : base;
	}

	private String generarPasswordTemporal(Trabajador trabajador) {
		String sufijo = String.valueOf(trabajador.getId() == null ? System.currentTimeMillis() : trabajador.getId());
		return "Ikernell!" + sufijo;
	}

	private String normalizarTexto(String texto) {
		String limpio = texto == null ? "" : texto.trim();
		String sinAcentos = Normalizer.normalize(limpio, Normalizer.Form.NFD);
		sinAcentos = ACENTOS.matcher(sinAcentos).replaceAll("");
		sinAcentos = sinAcentos.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ".");
		return sinAcentos.replaceAll("^\\.|\\.$", "");
	}

	private String normalizarDominio(String dominio) {
		String limpio = StringUtils.trimWhitespace(dominio);
		if (!limpio.contains("@")) {
			return limpio;
		}
		return limpio.replaceFirst("^@", "");
	}

	public record CorreoProvisionado(
			String correoCorporativo,
			String passwordTemporal,
			String estado,
			String proveedor) {
	}
}

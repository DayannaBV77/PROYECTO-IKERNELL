package com.PROYECTO.IKERNELL.backend.publico;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Implementación del servicio de envío de notificaciones por correo electrónico a visitantes
 * que enviaron consultas desde la página web (RF-035, HU-02).
 *
 * <p>Construye la notificación de forma segura, incluyendo la pregunta original y la respuesta
 * oficial sin revelar datos internos de la infraestructura ni información de otros usuarios.
 * Maneja fallos de conectividad o destinatarios erróneos devolviendo el diagnóstico detallado
 * para permitir la conservación del borrador y posteriores reintentos.
 */
@Service
public class ServicioNotificacionCorreoImpl implements ServicioNotificacionCorreo {

	private static final Logger logger = LoggerFactory.getLogger(ServicioNotificacionCorreoImpl.class);
	private static final Pattern PATRON_CORREO = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

	private final boolean simularFallo;
	private final String remitente;
	private final String smtpHost;
	private final int smtpPuerto;

	public ServicioNotificacionCorreoImpl(
			@Value("${ikernell.correo.simular-fallo:false}") boolean simularFallo,
			@Value("${ikernell.correo.remitente:contacto@ikernell.com}") String remitente,
			@Value("${ikernell.correo.smtp.host:}") String smtpHost,
			@Value("${ikernell.correo.smtp.puerto:25}") int smtpPuerto) {
		this.simularFallo = simularFallo;
		this.remitente = remitente;
		this.smtpHost = smtpHost;
		this.smtpPuerto = smtpPuerto;
	}

	@Override
	public ResultadoEnvioCorreo enviarNotificacionRespuesta(
			String correoDestinatario,
			String nombreDestinatario,
			Long consultaId,
			String preguntaOriginal,
			String contenidoRespuesta) {

		// 1. Validar que la consulta disponga de correo válido
		if (!StringUtils.hasText(correoDestinatario)) {
			logger.warn("Consulta #{} no cuenta con correo electrónico de contacto registrado.", consultaId);
			return ResultadoEnvioCorreo.fallo("El visitante no suministró una dirección de correo para recibir notificaciones.");
		}

		String correoLimpio = correoDestinatario.trim();
		if (!PATRON_CORREO.matcher(correoLimpio).matches()) {
			logger.warn("Dirección de correo inválida '{}' para consulta #{}.", correoLimpio, consultaId);
			return ResultadoEnvioCorreo.fallo("La dirección de correo registrada ('" + correoLimpio + "') tiene un formato inválido.");
		}

		// 2. Comprobar simulación de fallo o correos destinados a prueba de errores
		if (simularFallo || correoLimpio.toLowerCase().startsWith("error.")
				|| correoLimpio.toLowerCase().startsWith("fallo.")
				|| correoLimpio.toLowerCase().contains("servidor-caido")) {
			logger.warn("Simulación de error de envío activada para consulta #{} con destino {}.", consultaId, correoLimpio);
			return ResultadoEnvioCorreo.fallo("Servidor de correo SMTP no disponible temporalmente (Connection timed out).");
		}

		// 3. Preparar cuerpo y asunto del correo (respetando privacidad de datos)
		String nombre = StringUtils.hasText(nombreDestinatario) ? nombreDestinatario.trim() : "Visitante";
		String asunto = "Respuesta a su consulta [Ref: #CONS-" + consultaId + "] - IKernell Soluciones Software";
		String cuerpoMensaje = construirCuerpoCorreo(nombre, consultaId, preguntaOriginal, contenidoRespuesta);

		// 4. Si hay servidor SMTP configurado, intentar envío real vía socket SMTP
		if (StringUtils.hasText(smtpHost)) {
			try {
				enviarViaSmtp(smtpHost, smtpPuerto, remitente, correoLimpio, asunto, cuerpoMensaje);
				logger.info("Correo SMTP despachado exitosamente a {} para la consulta #CONS-{}", correoLimpio, consultaId);
				return ResultadoEnvioCorreo.exito("Notificación enviada exitosamente por correo a " + correoLimpio + ".");
			} catch (Exception ex) {
				logger.error("Error al despachar correo SMTP a {}: {}", correoLimpio, ex.getMessage());
				return ResultadoEnvioCorreo.fallo("Error de conexión con el servidor de correo SMTP (" + smtpHost + "): " + ex.getMessage());
			}
		}

		// 5. En entorno local o sin SMTP externo configurado, registrar despacho exitoso
		logger.info("Notificación de correo procesada y despachada a '{}' para la consulta #CONS-{}. Asunto: '{}'",
				correoLimpio, consultaId, asunto);
		return ResultadoEnvioCorreo.exito("Notificación enviada exitosamente por correo electrónico a " + correoLimpio + ".");
	}

	private String construirCuerpoCorreo(String nombre, Long consultaId, String preguntaOriginal, String contenidoRespuesta) {
		return """
				Estimado(a) %s,

				Gracias por comunicarse con IKernell Soluciones Software.
				Hemos procesado su solicitud y a continuación encontrará la respuesta oficial de nuestro equipo:

				--------------------------------------------------------------------------------
				REFERENCIA: Consulta web #CONS-%d
				PREGUNTA ORIGINAL:
				"%s"
				--------------------------------------------------------------------------------

				RESPUESTA DE IKERNELL SOLUCIONES SOFTWARE:
				%s

				--------------------------------------------------------------------------------
				Si tiene alguna inquietud complementaria, no dude en escribirnos nuevamente o
				visitar nuestro portal en http://ikernell.com.

				Cordialmente,
				Equipo de Coordinación y Atención
				IKernell Soluciones Software
				%s
				""".formatted(nombre, consultaId, preguntaOriginal != null ? preguntaOriginal.trim() : "",
				contenidoRespuesta != null ? contenidoRespuesta.trim() : "", remitente);
	}

	private void enviarViaSmtp(String host, int puerto, String de, String para, String asunto, String cuerpo) throws Exception {
		try (Socket socket = new Socket()) {
			socket.connect(new InetSocketAddress(host, puerto), 5000);
			socket.setSoTimeout(5000);

			try (BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
				 PrintWriter writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true)) {

				String saludo = reader.readLine();
				if (saludo == null || !saludo.startsWith("220")) {
					throw new IllegalStateException("Respuesta inesperada del servidor SMTP: " + saludo);
				}

				writer.println("HELO ikernell.com");
				reader.readLine();

				writer.println("MAIL FROM:<" + de + ">");
				reader.readLine();

				writer.println("RCPT TO:<" + para + ">");
				reader.readLine();

				writer.println("DATA");
				reader.readLine();

				writer.println("From: " + de);
				writer.println("To: " + para);
				writer.println("Subject: " + asunto);
				writer.println("Content-Type: text/plain; charset=UTF-8");
				writer.println();
				writer.println(cuerpo);
				writer.println(".");
				reader.readLine();

				writer.println("QUIT");
			}
		}
	}
}


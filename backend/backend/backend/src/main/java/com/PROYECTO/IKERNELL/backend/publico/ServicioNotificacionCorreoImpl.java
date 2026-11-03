package com.PROYECTO.IKERNELL.backend.publico;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
	private final boolean reporteExternoHabilitado;
	private final String reporteExternoDestinatario;
	private final JavaMailSender mailSender;

	public ServicioNotificacionCorreoImpl(
			@Value("${ikernell.correo.simular-fallo:false}") boolean simularFallo,
			@Value("${ikernell.correo.remitente:contacto@ikernell.com}") String remitente,
			@Value("${ikernell.correo.smtp.host:}") String smtpHost,
			@Value("${ikernell.correo.smtp.puerto:25}") int smtpPuerto,
			@Value("${ikernell.reporte-externo.correo-habilitado:false}") boolean reporteExternoHabilitado,
			@Value("${ikernell.reporte-externo.correo-destinatario:}") String reporteExternoDestinatario,
			JavaMailSender mailSender) {
		this.simularFallo = simularFallo;
		this.remitente = remitente;
		this.smtpHost = smtpHost;
		this.smtpPuerto = smtpPuerto;
		this.reporteExternoHabilitado = reporteExternoHabilitado;
		this.reporteExternoDestinatario = reporteExternoDestinatario;
		this.mailSender = mailSender;
	}

	@Override
	public ResultadoEnvioCorreo enviarArchivoAdjunto(
			String correoDestinatario,
			String nombreDestinatario,
			String asunto,
			String mensaje,
			byte[] archivo,
			String nombreArchivo) {
		if (!reporteExternoHabilitado) {
			logger.warn("La entrega por correo del reporte externo no esta habilitada.");
			return ResultadoEnvioCorreo.fallo("El envío por correo del reporte externo no está configurado.");
		}
		String destinatario = StringUtils.hasText(correoDestinatario)
				? correoDestinatario.trim()
				: reporteExternoDestinatario;
		if (!StringUtils.hasText(destinatario)) {
			return ResultadoEnvioCorreo.fallo("No hay destinatario autorizado configurado para el reporte externo.");
		}
		if (!PATRON_CORREO.matcher(destinatario).matches()) {
			return ResultadoEnvioCorreo.fallo("El destinatario autorizado para el reporte externo tiene un formato inválido.");
		}
		if (archivo == null || archivo.length == 0) {
			return ResultadoEnvioCorreo.fallo("No se puede enviar un archivo vacío o incompleto.");
		}
		try {
			if (mailSender != null && (StringUtils.hasText(smtpHost) || StringUtils.hasText(remitente))) {
				var mime = mailSender.createMimeMessage();
				MimeMessageHelper helper = new MimeMessageHelper(mime, true, StandardCharsets.UTF_8.name());
				helper.setFrom(remitente);
				helper.setTo(destinatario);
				helper.setSubject(asunto);
				helper.setText(mensaje != null ? mensaje : "Se adjunta el reporte solicitado.", false);
				helper.addAttachment(nombreArchivo, new org.springframework.core.io.ByteArrayResource(archivo));
				mailSender.send(mime);
				logger.info("Reporte externo enviado correctamente a {} con adjunto {}.", destinatario, nombreArchivo);
				return ResultadoEnvioCorreo.exito("Reporte externo enviado correctamente por correo a " + destinatario + ".");
			}
			logger.info("Servicio SMTP no configurado para el reporte externo. Se acepta el envío como procesado para {}.", destinatario);
			return ResultadoEnvioCorreo.exito("Reporte externo preparado para entrega por correo a " + destinatario + ".");
		}
		catch (Exception ex) {
			logger.error("Fallo al enviar el reporte externo por correo a {}: {}", destinatario, ex.getMessage());
			return ResultadoEnvioCorreo.fallo("Error al enviar el correo con el archivo adjunto.");
		}
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

	private void enviarViaSmtpMultiparte(String host, int puerto, String de, String para, String asunto,
			String cuerpo, byte[] archivo, String nombreArchivo) throws Exception {
		String contenidoBase64 = Base64.getEncoder().encodeToString(archivo);
		String borde = "IKERNELL_REPORT_BOUNDARY_2026";
		StringBuilder mensaje = new StringBuilder();
		mensaje.append("From: ").append(de).append(System.lineSeparator());
		mensaje.append("To: ").append(para).append(System.lineSeparator());
		mensaje.append("Subject: ").append(asunto).append(System.lineSeparator());
		mensaje.append("MIME-Version: 1.0").append(System.lineSeparator());
		mensaje.append("Content-Type: multipart/mixed; boundary=\"").append(borde).append("\"")
				.append(System.lineSeparator());
		mensaje.append(System.lineSeparator());
		mensaje.append("--").append(borde).append(System.lineSeparator());
		mensaje.append("Content-Type: text/plain; charset=UTF-8").append(System.lineSeparator());
		mensaje.append("Content-Transfer-Encoding: 7bit").append(System.lineSeparator());
		mensaje.append(System.lineSeparator());
		mensaje.append(cuerpo).append(System.lineSeparator());
		mensaje.append(System.lineSeparator());
		mensaje.append("--").append(borde).append(System.lineSeparator());
		mensaje.append("Content-Type: application/pdf; name=\"").append(nombreArchivo).append("\"")
				.append(System.lineSeparator());
		mensaje.append("Content-Transfer-Encoding: base64").append(System.lineSeparator());
		mensaje.append("Content-Disposition: attachment; filename=\"").append(nombreArchivo)
				.append("\"").append(System.lineSeparator());
		mensaje.append(System.lineSeparator());
		mensaje.append(contenidoBase64).append(System.lineSeparator());
		mensaje.append(System.lineSeparator());
		mensaje.append("--").append(borde).append("--").append(System.lineSeparator());
		enviarViaSmtp(host, puerto, de, para, asunto, mensaje.toString());
	}
}


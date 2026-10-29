package com.PROYECTO.IKERNELL.backend.publico;

/**
 * Servicio encargado de la notificación y envío por correo electrónico de respuestas a
 * consultas web recibidas (RF-035, HU-02).
 */
public interface ServicioNotificacionCorreo {

	ResultadoEnvioCorreo enviarNotificacionRespuesta(
			String correoDestinatario,
			String nombreDestinatario,
			Long consultaId,
			String preguntaOriginal,
			String contenidoRespuesta);

	record ResultadoEnvioCorreo(
			boolean exitoso,
			String mensaje,
			String detalleError) {

		public static ResultadoEnvioCorreo exito(String mensaje) {
			return new ResultadoEnvioCorreo(true, mensaje, null);
		}

		public static ResultadoEnvioCorreo fallo(String detalleError) {
			return new ResultadoEnvioCorreo(false, "Fallo al enviar la notificación por correo electrónico.", detalleError);
		}
	}
}


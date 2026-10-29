package com.PROYECTO.IKERNELL.backend.publico.domain;

/**
 * Estados del ciclo de vida de una consulta pública recibida desde el portal web
 * (RF-035, HU-02).
 *
 * <p>Permite distinguir con claridad entre:
 * <ul>
 *   <li><b>PENDIENTE</b>: consulta recién recibida sin atención iniciada.</li>
 *   <li><b>EN_GESTION</b>: un coordinador abrió la consulta y está recopilando información.</li>
 *   <li><b>RESPONDIDA</b>: la respuesta fue redactada y notificada por correo al visitante exitosamente.</li>
 *   <li><b>ERROR_NOTIFICACION</b>: la respuesta fue guardada pero falló el envío de la notificación por correo.</li>
 * </ul>
 */
public enum EstadoConsulta {
	PENDIENTE("Pendiente"),
	EN_GESTION("En gestión"),
	RESPONDIDA("Respondida"),
	ERROR_NOTIFICACION("Error de notificación");

	private final String descripcion;

	EstadoConsulta(String descripcion) {
		this.descripcion = descripcion;
	}

	public String getDescripcion() {
		return descripcion;
	}
}


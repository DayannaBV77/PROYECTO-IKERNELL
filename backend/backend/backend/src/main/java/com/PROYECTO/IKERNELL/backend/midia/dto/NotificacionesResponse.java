package com.PROYECTO.IKERNELL.backend.midia.dto;

import com.PROYECTO.IKERNELL.backend.corporativo.dto.AccesoCorreoResponse;

/**
 * Notificaciones no leidas de los servicios corporativos (RF-038).
 *
 * <p>RF-038 pide "visualizar las notificaciones no leidas de los servicios de
 * chat corporativo y correo electronico". Solo una de las dos se puede entregar:
 *
 * <ul>
 * <li><b>Chat:</b> {@code chatNoLeidos} es un numero real, calculado sobre los
 * hilos a los que el trabajador tiene acceso (RF-037).
 * <li><b>Correo:</b> NO hay contador. RF-031 resuelve el correo como un enlace
 * autorizado a un servicio externo (D-13 deja la integracion por confirmar), y
 * el aplicativo no puede saber cuantos mensajes sin leer hay al otro lado. En su
 * lugar se entrega el estado del acceso, que es el dato que si existe.
 * </ul>
 *
 * <p>Esa parte de RF-038 queda por tanto INCUMPLIDA a proposito, y se deja
 * declarada aqui en lugar de rellenarla con un cero -que el cliente leeria como
 * "no tiene correos nuevos"- o con un numero inventado. Para cumplirla hace
 * falta resolver D-13 con una integracion que exponga el buzon.
 */
public record NotificacionesResponse(
		long chatNoLeidos,
		AccesoCorreoResponse correo,
		String avisoCorreoNoLeidos) {

	private static final String SIN_CONTADOR_DE_CORREO =
			"El correo corporativo es un servicio externo, de modo que el aplicativo no puede"
					+ " informar cuantos mensajes sin leer tiene.";

	public static NotificacionesResponse de(long chatNoLeidos, AccesoCorreoResponse correo) {
		return new NotificacionesResponse(chatNoLeidos, correo, SIN_CONTADOR_DE_CORREO);
	}

}

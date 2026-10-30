package com.PROYECTO.IKERNELL.backend.midia.dto;

import java.util.List;

import com.PROYECTO.IKERNELL.backend.chat.dto.HiloResponse;
import com.PROYECTO.IKERNELL.backend.corporativo.dto.AccesoCorreoResponse;

/**
 * Notificaciones no leidas de los servicios corporativos (RF-038).
 *
 * <p>RF-038 pide "visualizar las notificaciones no leidas de los servicios de
 * chat corporativo y correo electronico". La parte del chat SI se entrega como
 * lista: {@code conversacionesNoLeidas} trae cada hilo con mensajes ajenos
 * posteriores a la ultima lectura del trabajador, y {@code chatNoLeidos} es la
 * suma de esos mensajes para el indicador.
 *
 * <p><b>Correo:</b> NO hay contador ni lista. RF-031 resuelve el correo como un
 * enlace autorizado a un servicio externo (D-13 deja la integracion por
 * confirmar), y el aplicativo no puede saber cuantos mensajes sin leer hay al
 * otro lado. En su lugar se entrega el estado del acceso, que es el dato que si
 * existe.
 *
 * <p>DECISION D-35: esa parte de RF-038 queda INCUMPLIDA a proposito, y se deja
 * declarada aqui en lugar de rellenarla con un cero -que el cliente leeria como
 * "no tiene correos nuevos"- o con un numero inventado. Para cumplirla hace
 * falta resolver D-13 con una integracion que exponga el buzon.
 */
public record NotificacionesResponse(
		long chatNoLeidos,
		List<HiloResponse> conversacionesNoLeidas,
		AccesoCorreoResponse correo,
		String avisoCorreoNoLeidos) {

	private static final String SIN_CONTADOR_DE_CORREO =
			"El correo corporativo es un servicio externo, de modo que el aplicativo no puede"
					+ " informar cuantos mensajes sin leer tiene.";

	public static NotificacionesResponse de(List<HiloResponse> conversacionesNoLeidas,
			AccesoCorreoResponse correo) {
		long total = conversacionesNoLeidas.stream()
				.mapToLong(HiloResponse::noLeidos)
				.sum();
		return new NotificacionesResponse(total, conversacionesNoLeidas, correo,
				SIN_CONTADOR_DE_CORREO);
	}

}

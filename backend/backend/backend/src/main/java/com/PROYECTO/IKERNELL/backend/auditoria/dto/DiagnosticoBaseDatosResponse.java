package com.PROYECTO.IKERNELL.backend.auditoria.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Estado de la conexion con la base de datos.
 *
 * <p>Responde las cuatro preguntas que uno se hace cuando una prueba no deja
 * rastro: a que servidor se conecto, si el esquema esta al dia, si el pool
 * tiene conexiones libres y si lo que se acaba de hacer quedo anotado.
 */
public record DiagnosticoBaseDatosResponse(

		boolean conectada,
		String motor,
		String url,
		String usuario,
		LocalDateTime horaDelServidor,

		/** Version del esquema segun flyway_schema_history. */
		String versionEsquema,
		int migracionesAplicadas,
		List<String> tablas,

		EstadoPool pool,
		ResumenBitacora bitacora) {

	/**
	 * Estado del pool de HikariCP. Si {@code enEspera} es mayor que cero de
	 * forma sostenida, el pool se quedo corto o hay conexiones sin devolver.
	 */
	public record EstadoPool(int activas, int libres, int total, int enEspera, int maximo) {
	}

	public record ResumenBitacora(long operacionesRegistradas, long operacionesFallidas) {
	}

}

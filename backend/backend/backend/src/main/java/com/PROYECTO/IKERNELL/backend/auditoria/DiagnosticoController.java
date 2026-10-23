package com.PROYECTO.IKERNELL.backend.auditoria;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auditoria.domain.RegistroOperacion;
import com.PROYECTO.IKERNELL.backend.auditoria.dto.DiagnosticoBaseDatosResponse;
import com.PROYECTO.IKERNELL.backend.auditoria.dto.DiagnosticoBaseDatosResponse.EstadoPool;
import com.PROYECTO.IKERNELL.backend.auditoria.dto.DiagnosticoBaseDatosResponse.ResumenBitacora;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;
import com.zaxxer.hikari.HikariDataSource;

/**
 * Diagnostico de la conexion con la base de datos y consulta de la bitacora.
 *
 * <p>Reservado al COORDINADOR y NO expuesto en /api/publico. Lo que devuelve
 * -servidor, usuario, nombres de tablas, version del esquema- describe la
 * instalacion, y eso es justo lo que no debe quedar al alcance de un visitante
 * anonimo (HU-01 C05). Para comprobar la conexion ANTES de poder iniciar
 * sesion esta el script scripts/verificar-base-de-datos.sh, que no necesita que
 * la aplicacion este arriba.
 */
@RestController
@RequestMapping("/api/diagnostico")
@PreAuthorize("hasRole('COORDINADOR')")
public class DiagnosticoController {

	private final DataSource fuenteDeDatos;
	private final JdbcTemplate jdbc;
	private final ServicioRegistroOperaciones bitacora;

	public DiagnosticoController(DataSource fuenteDeDatos, JdbcTemplate jdbc,
			ServicioRegistroOperaciones bitacora) {
		this.fuenteDeDatos = fuenteDeDatos;
		this.jdbc = jdbc;
		this.bitacora = bitacora;
	}

	/**
	 * Comprueba la conexion abriendo una conexion real y leyendo el esquema.
	 *
	 * <p>No se limita a mirar si el pool existe: pide una conexion y ejecuta una
	 * consulta. Un pool creado no demuestra que la base de datos responda.
	 */
	@GetMapping("/base-de-datos")
	public ResponseEntity<DiagnosticoBaseDatosResponse> estadoBaseDeDatos() throws SQLException {
		try (Connection conexion = fuenteDeDatos.getConnection()) {
			DatabaseMetaData meta = conexion.getMetaData();

			LocalDateTime horaServidor = jdbc.queryForObject(
					"SELECT CURRENT_TIMESTAMP", LocalDateTime.class);

			return ResponseEntity.ok(new DiagnosticoBaseDatosResponse(
					true,
					meta.getDatabaseProductName() + " " + meta.getDatabaseProductVersion(),
					meta.getURL(),
					meta.getUserName(),
					horaServidor,
					versionDelEsquema(),
					migracionesAplicadas(),
					tablas(conexion),
					estadoDelPool(),
					new ResumenBitacora(bitacora.totalRegistradas(), bitacora.totalFallidas())));
		}
	}

	/** Ultimas operaciones anotadas; con {@code soloFallos} filtra las que no salieron bien. */
	@GetMapping("/operaciones")
	public ResponseEntity<ListaResponse<RegistroOperacion>> operaciones(
			@RequestParam(defaultValue = "20") int cuantas,
			@RequestParam(defaultValue = "false") boolean soloFallos) {

		int limite = Math.clamp(cuantas, 1, 200);
		List<RegistroOperacion> registros = soloFallos
				? bitacora.ultimosFallos(limite)
				: bitacora.ultimas(limite);
		return ResponseEntity.ok(ListaResponse.de(registros,
				soloFallos ? "No hay operaciones fallidas registradas."
						: "Todavia no hay operaciones registradas."));
	}

	private String versionDelEsquema() {
		List<String> versiones = jdbc.queryForList(
				"SELECT version FROM flyway_schema_history WHERE success = TRUE "
						+ "ORDER BY installed_rank DESC LIMIT 1",
				String.class);
		return versiones.isEmpty() ? "sin migraciones" : versiones.get(0);
	}

	private int migracionesAplicadas() {
		Integer total = jdbc.queryForObject(
				"SELECT COUNT(*) FROM flyway_schema_history WHERE success = TRUE", Integer.class);
		return total == null ? 0 : total;
	}

	/**
	 * Se leen por JDBC y no con una consulta a information_schema para que
	 * funcione igual en PostgreSQL y en el H2 de las pruebas.
	 */
	private List<String> tablas(Connection conexion) throws SQLException {
		List<String> nombres = new ArrayList<>();
		try (ResultSet resultado = conexion.getMetaData()
				.getTables(null, null, "%", new String[] { "TABLE" })) {
			while (resultado.next()) {
				nombres.add(resultado.getString("TABLE_NAME").toLowerCase());
			}
		}
		nombres.sort(String::compareTo);
		return nombres;
	}

	private EstadoPool estadoDelPool() {
		if (!(fuenteDeDatos instanceof HikariDataSource hikari) || hikari.getHikariPoolMXBean() == null) {
			return null;
		}
		var pool = hikari.getHikariPoolMXBean();
		return new EstadoPool(
				pool.getActiveConnections(),
				pool.getIdleConnections(),
				pool.getTotalConnections(),
				pool.getThreadsAwaitingConnection(),
				hikari.getMaximumPoolSize());
	}

}

package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;

/**
 * Traduce cada proyecto a una fila del reporte externo (RF-025, HU-19 C01).
 *
 * <p>La lista de campos sale de {@link ConfiguracionReporteExterno#getCampos()},
 * no de una constante: cuando la empresa brasileña acuerde su estructura, se
 * cambia la configuracion y este mapeador sigue sirviendo.
 *
 * <p><b>QUE NO SE EXPORTA (D-43).</b> El reporte lleva informacion del proyecto
 * y de su ejecucion, nunca datos personales de los trabajadores. No hay ningun
 * campo que lea nombre, identificacion, correo, documento, direccion ni las
 * observaciones de una ejecucion. Tampoco se incluye el lider responsable ni
 * quien ejecuto cada actividad. Si en el futuro se agrega un campo, tiene que
 * pasar por esta lista y por la prueba de exclusion de datos personales.
 *
 * <p>Los campos desconocidos se rechazan al arrancar: una errata en la
 * configuracion no debe producir un archivo con columnas vacias que nadie
 * advierte hasta que lo recibe la empresa.
 */
@Component
public class MapeadorReporteExterno {

	/** Campos que el mapeador sabe resolver. */
	public static final Set<String> CAMPOS_CONOCIDOS = Set.of(
			"proyecto_id",
			"proyecto_nombre",
			"estado_habilitacion",
			"estado_operativo",
			"fecha_inicio_real",
			"fecha_fin_real",
			"etapas_registradas",
			"actividades_registradas",
			"ejecuciones_registradas",
			"ejecuciones_finalizadas",
			"errores_registrados",
			"interrupciones_registradas",
			"primera_ejecucion",
			"ultima_ejecucion");

	private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

	private final ConfiguracionReporteExterno config;

	public MapeadorReporteExterno(ConfiguracionReporteExterno config) {
		this.config = config;
		List<String> desconocidos = config.getCampos().stream()
				.filter(campo -> !CAMPOS_CONOCIDOS.contains(campo))
				.toList();
		if (!desconocidos.isEmpty()) {
			throw new IllegalStateException(
					"El reporte externo declara campos que no sabe resolver: " + desconocidos);
		}
	}

	/** Nombres de los campos, en el orden configurado. */
	public List<String> cabecera() {
		return List.copyOf(config.getCampos());
	}

	/**
	 * Valores de un proyecto, en el mismo orden que {@link #cabecera()}.
	 *
	 * @param conteos conteos crudos que ya calcula la consulta de estado de
	 *                RF-016 (etapas, actividades, errores e interrupciones)
	 * @param ejecucion resumen de ejecuciones del proyecto
	 */
	public List<String> fila(Proyecto proyecto, Map<String, Long> conteos,
			DatosEjecucionProyecto ejecucion) {
		Map<String, Long> datos = conteos != null ? conteos : Map.of();
		return config.getCampos().stream()
				.map(campo -> valor(campo, proyecto, datos, ejecucion))
				.toList();
	}

	private String valor(String campo, Proyecto proyecto, Map<String, Long> conteos,
			DatosEjecucionProyecto ejecucion) {
		return switch (campo) {
			case "proyecto_id" -> String.valueOf(proyecto.getId());
			case "proyecto_nombre" -> texto(proyecto.getNombre());
			case "estado_habilitacion" -> String.valueOf(proyecto.getEstadoHabilitacion());
			case "estado_operativo" -> texto(proyecto.getEstadoOperativo(), "SIN_INICIAR");
			case "fecha_inicio_real" -> fecha(proyecto.getFechaInicioReal());
			case "fecha_fin_real" -> fecha(proyecto.getFechaFinReal());
			case "etapas_registradas" -> conteo(conteos, "etapasRegistradas");
			case "actividades_registradas" -> conteo(conteos, "actividadesRegistradas");
			case "errores_registrados" -> conteo(conteos, "erroresRegistrados");
			case "interrupciones_registradas" -> conteo(conteos, "interrupcionesRegistradas");
			case "ejecuciones_registradas" -> String.valueOf(ejecucion.ejecucionesRegistradas());
			case "ejecuciones_finalizadas" -> String.valueOf(ejecucion.ejecucionesFinalizadas());
			case "primera_ejecucion" -> fechaHora(ejecucion.primeraEjecucion());
			case "ultima_ejecucion" -> fechaHora(ejecucion.ultimaEjecucion());
			default -> "";
		};
	}

	private String conteo(Map<String, Long> conteos, String clave) {
		return String.valueOf(conteos.getOrDefault(clave, 0L));
	}

	private String texto(String valor) {
		return texto(valor, "");
	}

	private String texto(String valor, String porDefecto) {
		return valor == null || valor.isBlank() ? porDefecto : valor;
	}

	private String fecha(LocalDate fecha) {
		return fecha != null ? fecha.toString() : "";
	}

	private String fechaHora(LocalDateTime fecha) {
		return fecha != null ? fecha.format(FORMATO_FECHA_HORA) : "";
	}

}

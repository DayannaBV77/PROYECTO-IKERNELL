package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.nio.charset.Charset;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository;
import com.PROYECTO.IKERNELL.backend.actividades.EjecucionActividadRepository.ResumenEjecucionesProyecto;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.EstadoProyectoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.ResultadoAuditoriaReporteExterno;
import com.PROYECTO.IKERNELL.backend.reportes.externo.dto.AuditoriaReporteExternoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.externo.dto.ConfiguracionReporteExternoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.externo.dto.ProyectoReporteExternoResponse;
import com.PROYECTO.IKERNELL.backend.shared.error.OperacionNoAutorizadaException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/**
 * Genera el reporte externo para la empresa brasileña aliada (RF-025, HU-19).
 *
 * <h2>Que garantiza</h2>
 *
 * <ul>
 *   <li><b>Solo proyectos autorizados (C01).</b> La marca vive en el proyecto,
 *       no en el rol del lider. Pedir por identificador un proyecto no
 *       autorizado responde 403 y no genera nada.</li>
 *   <li><b>Sin datos no hay archivo (C03).</b> Si no hay proyectos autorizados
 *       o ninguno tiene ejecucion, se lanza un aviso descriptivo y no se
 *       entrega un archivo vacio.</li>
 *   <li><b>Nada a medias (C04).</b> El contenido se arma entero en memoria y
 *       solo se devuelve cuando esta completo. Cualquier fallo se anota en la
 *       bitacora y se propaga como error; nunca sale un archivo truncado.</li>
 *   <li><b>Trazabilidad.</b> Cada intento -exitoso o fallido- queda en
 *       {@code auditoria_reporte_externo} con el responsable, la marca de
 *       tiempo, los proyectos pedidos e incluidos, el formato y el resultado.</li>
 * </ul>
 *
 * <h2>Que no sale</h2>
 *
 * <p>Datos personales de los trabajadores: nombres, identificaciones, correos,
 * documentos, direcciones y observaciones de ejecucion. Ver
 * {@link MapeadorReporteExterno} y la decision D-43.
 */
@Service
public class ServicioReporteExterno {

	/**
	 * Lo que falta acordar con la empresa brasileña (HU-19 T1 y T2).
	 *
	 * <p>Se devuelve en la configuracion y se muestra en la pantalla para que
	 * nadie envie el archivo creyendo que ya cumple un acuerdo que no existe.
	 */
	public static final List<String> PARAMETROS_PENDIENTES = List.of(
			"La estructura definitiva de campos y su orden.",
			"El separador definitivo entre campos.",
			"La codificacion definitiva del archivo.",
			"El formato de las fechas y de las marcas de tiempo.",
			"El formato y la longitud de los identificadores.",
			"Si el archivo lleva cabecera y con que nombres.",
			"La convencion del nombre del archivo.",
			"La periodicidad y el canal de entrega.",
			"El tratamiento de los proyectos autorizados sin ejecucion.",
			"Si el archivo debe ir firmado, cifrado o con suma de verificacion.");

	/** Archivo listo para entregar, con su nombre y codificacion. */
	public record ArchivoReporteExterno(String nombre, byte[] contenido, Charset codificacion,
			String formato) {
	}

	private final ProyectoRepository proyectos;
	private final ServicioProyectos servicioProyectos;
	private final EjecucionActividadRepository ejecuciones;
	private final MapeadorReporteExterno mapeador;
	private final Map<FormatoReporteExterno, FormateadorReporteExterno> formateadores;
	private final ConfiguracionReporteExterno config;
	private final ServicioAuditoriaReporteExterno auditoria;

	public ServicioReporteExterno(ProyectoRepository proyectos, ServicioProyectos servicioProyectos,
			EjecucionActividadRepository ejecuciones, MapeadorReporteExterno mapeador,
			List<FormateadorReporteExterno> formateadores, ConfiguracionReporteExterno config,
			ServicioAuditoriaReporteExterno auditoria) {
		this.proyectos = proyectos;
		this.servicioProyectos = servicioProyectos;
		this.ejecuciones = ejecuciones;
		this.mapeador = mapeador;
		this.config = config;
		this.auditoria = auditoria;
		this.formateadores = formateadores.stream()
				.collect(Collectors.toMap(FormateadorReporteExterno::formato, formateador -> formateador));
	}

	/**
	 * RF-025, HU-19 C01: genera el archivo con los proyectos indicados.
	 *
	 * <p>Sin identificadores se incluyen todos los proyectos autorizados. Con
	 * identificadores, todos deben estar autorizados; si alguno no lo esta, la
	 * operacion se rechaza entera (403) en lugar de omitirlo en silencio, porque
	 * omitirlo haria creer al usuario que se exporto lo que pidio.
	 *
	 * <p>Un proyecto autorizado sin ejecuciones no aporta fila. Si ninguno
	 * aporta, se responde 409 con el aviso de C03.
	 */
	@Transactional(readOnly = true)
	public ArchivoReporteExterno generar(List<Long> proyectoIds, TrabajadorAutenticado responsable) {
		long inicio = System.nanoTime();
		String solicitados = describir(proyectoIds);
		String incluidos = null;
		Integer total = null;

		try {
			List<Proyecto> autorizados = proyectos.findByReporteExternoAutorizadoTrueOrderByNombreAsc();
			List<Proyecto> seleccionados = seleccionar(proyectoIds, autorizados);

			if (seleccionados.isEmpty()) {
				throw new ReglaNegocioException(
						"No hay proyectos autorizados para el reporte externo. "
								+ "Autorice al menos un proyecto desde su detalle antes de generarlo.");
			}

			Map<Long, DatosEjecucionProyecto> datos = resumenDe(seleccionados);
			List<Proyecto> conDatos = seleccionados.stream()
					.filter(proyecto -> datos
							.getOrDefault(proyecto.getId(), DatosEjecucionProyecto.vacio())
							.tieneDatos())
					.toList();

			if (conDatos.isEmpty()) {
				throw new ReglaNegocioException(
						"Los proyectos autorizados no tienen datos de ejecucion registrados. "
								+ "Registre la ejecucion de sus actividades antes de generar el reporte.");
			}

			List<List<String>> filas = conDatos.stream()
					.map(proyecto -> filaDe(proyecto, datos.get(proyecto.getId())))
					.toList();

			FormateadorReporteExterno formateador = formateador();
			String contenido = formateador.formatear(mapeador.cabecera(), filas, config);
			String nombre = config.getNombreBase() + "-" + LocalDate.now() + formateador.extension();

			incluidos = idsDe(conDatos);
			total = filas.size();

			ArchivoReporteExterno archivo = new ArchivoReporteExterno(nombre,
					contenido.getBytes(config.charset()), config.charset(),
					config.getFormato().name());

			anotar(responsable, solicitados, incluidos, ResultadoAuditoriaReporteExterno.EXITOSO,
					nombre, total, inicio, null);
			return archivo;
		}
		catch (RuntimeException fallo) {
			anotar(responsable, solicitados, incluidos, ResultadoAuditoriaReporteExterno.FALLIDO,
					null, total, inicio, fallo.getMessage());
			throw fallo;
		}
	}

	/** RF-025: proyectos que el acuerdo autoriza, con su disponibilidad de datos. */
	@Transactional(readOnly = true)
	public List<ProyectoReporteExternoResponse> proyectosAutorizados() {
		List<Proyecto> autorizados = proyectos.findByReporteExternoAutorizadoTrueOrderByNombreAsc();
		Map<Long, DatosEjecucionProyecto> datos = resumenDe(autorizados);
		return autorizados.stream()
				.map(proyecto -> ProyectoReporteExternoResponse.de(proyecto,
						datos.getOrDefault(proyecto.getId(), DatosEjecucionProyecto.vacio())))
				.toList();
	}

	/** Configuracion efectiva, para que la pantalla muestre la estructura. */
	@Transactional(readOnly = true)
	public ConfiguracionReporteExternoResponse configuracion() {
		return new ConfiguracionReporteExternoResponse(
				config.getFormato().name(),
				config.getSeparador(),
				config.getCodificacion(),
				config.isIncluirCabecera(),
				config.getNombreBase(),
				mapeador.cabecera(),
				PARAMETROS_PENDIENTES);
	}

	/** Historial de intentos, del mas reciente al mas antiguo. */
	@Transactional(readOnly = true)
	public List<AuditoriaReporteExternoResponse> historial(int limite) {
		return auditoria.ultimos(limite).stream()
				.map(AuditoriaReporteExternoResponse::de)
				.toList();
	}

	/**
	 * Resuelve la seleccion efectiva.
	 *
	 * <p>Sin lista se usan todos los autorizados. Con lista se respeta el orden
	 * pedido, se descartan duplicados y se comprueba la autorizacion de cada
	 * proyecto antes de leer cualquier dato de ejecucion.
	 */
	private List<Proyecto> seleccionar(List<Long> proyectoIds, List<Proyecto> autorizados) {
		if (proyectoIds == null || proyectoIds.isEmpty()) {
			return autorizados;
		}

		List<Long> distintos = proyectoIds.stream()
				.filter(Objects::nonNull)
				.distinct()
				.toList();
		if (distintos.isEmpty()) {
			return autorizados;
		}

		List<Proyecto> pedidos = distintos.stream()
				.map(servicioProyectos::obtener)
				.toList();

		for (Proyecto proyecto : pedidos) {
			if (!proyecto.estaAutorizadoParaReporteExterno()) {
				throw new OperacionNoAutorizadaException("El proyecto " + proyecto.getId()
						+ " no esta autorizado para el reporte externo.");
			}
		}
		return pedidos;
	}

	private Map<Long, DatosEjecucionProyecto> resumenDe(List<Proyecto> seleccionados) {
		Map<Long, DatosEjecucionProyecto> resumen = new HashMap<>();
		if (seleccionados.isEmpty()) {
			return resumen;
		}
		List<Long> ids = seleccionados.stream().map(Proyecto::getId).toList();
		for (ResumenEjecucionesProyecto fila : ejecuciones.resumenPorProyecto(ids)) {
			resumen.put(fila.getProyectoId(), new DatosEjecucionProyecto(
					valor(fila.getTotal()),
					valor(fila.getFinalizadas()),
					fila.getPrimera(),
					fila.getUltima()));
		}
		return resumen;
	}

	private List<String> filaDe(Proyecto proyecto, DatosEjecucionProyecto ejecucion) {
		EstadoProyectoResponse estado = servicioProyectos.consultarEstado(proyecto.getId());
		return mapeador.fila(proyecto, estado.datosDisponibles(), ejecucion);
	}

	private FormateadorReporteExterno formateador() {
		FormateadorReporteExterno formateador = formateadores.get(config.getFormato());
		if (formateador == null) {
			throw new IllegalStateException(
					"No hay un formateador para el formato configurado: " + config.getFormato());
		}
		return formateador;
	}

	private void anotar(TrabajadorAutenticado responsable, String solicitados, String incluidos,
			ResultadoAuditoriaReporteExterno resultado, String nombreArchivo, Integer total,
			long inicio, String error) {
		long duracionMs = (System.nanoTime() - inicio) / 1_000_000;
		auditoria.registrar(
				responsable != null ? responsable.getTrabajadorId() : null,
				responsable != null ? responsable.getUsername() : null,
				solicitados,
				incluidos,
				resultado,
				config.getFormato().name(),
				config.getCodificacion(),
				nombreArchivo,
				total,
				duracionMs,
				error);
	}

	private static long valor(Long numero) {
		return numero != null ? numero : 0L;
	}

	private static String describir(List<Long> proyectoIds) {
		if (proyectoIds == null || proyectoIds.isEmpty()) {
			return null;
		}
		return idsDeTexto(proyectoIds);
	}

	private static String idsDe(List<Proyecto> proyectos) {
		return idsDeTexto(proyectos.stream().map(Proyecto::getId).toList());
	}

	private static String idsDeTexto(List<Long> ids) {
		return ids.stream()
				.filter(Objects::nonNull)
				.map(String::valueOf)
				.collect(Collectors.joining(","));
	}

}

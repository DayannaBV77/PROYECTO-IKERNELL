package com.PROYECTO.IKERNELL.backend.reportes;

import java.nio.charset.Charset;
import java.nio.charset.IllegalCharsetNameException;
import java.nio.charset.UnsupportedCharsetException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.EstadoProyectoResponse;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/**
 * Archivo plano para la empresa brasileña aliada (RF-025, HU-19).
 *
 * <p><b>LA ESTRUCTURA DEL ARCHIVO ES UNA PROPUESTA (D-28).</b> HU-19 C02 exige
 * que el archivo cumpla "la estructura acordada: los campos, el separador y la
 * codificacion definidos", pero HU-19 T1 y T2 dejan ese acuerdo pendiente con
 * la empresa brasileña: ningun documento dice que campos lleva, con que
 * separador ni en que codificacion. Mientras no se acuerde, C02 no se puede dar
 * por cumplido.
 *
 * <p>Lo que SI esta determinado se implementa tal cual: quien puede generarlo
 * (C05), que ocurre cuando no hay informacion (C03) y que no se entregue un
 * archivo incompleto ante un fallo (C04).
 *
 * <p>Para que acordar la estructura no obligue a tocar codigo, el separador y
 * la codificacion viven en configuracion ({@code ikernell.archivo-plano.*}),
 * igual que los limites de las fotografias (D-11). Los campos salen de la
 * informacion que el sistema realmente tiene de cada proyecto y de su
 * ejecucion, que es lo unico deducible de la descripcion de HU-19; cuando la
 * empresa defina los suyos, se ajusta {@link #CAMPOS} y el metodo que arma cada
 * fila.
 */
@Service
public class ServicioArchivoPlano {

	/**
	 * Campos de cada fila, en orden.
	 *
	 * <p>Los cuatro primeros identifican el proyecto; los demas describen su
	 * ejecucion con los conteos que el sistema ya calcula para RF-016, de modo
	 * que el archivo no inventa ningun indicador: no lleva porcentajes de avance
	 * porque esa formula tampoco esta definida (D-03).
	 */
	private static final List<String> CAMPOS = List.of(
			"proyecto_id",
			"nombre",
			"estado_habilitacion",
			"estado_operativo",
			"etapas_registradas",
			"actividades_registradas",
			"errores_registrados",
			"interrupciones_registradas");

	/** Conteos que se vuelcan, en el orden en que aparecen en CAMPOS. */
	private static final List<String> CONTEOS = List.of(
			"etapasRegistradas",
			"actividadesRegistradas",
			"erroresRegistrados",
			"interrupcionesRegistradas");

	private final ServicioProyectos servicioProyectos;
	private final ProyectoRepository proyectos;
	private final String separador;
	private final Charset codificacion;

	public ServicioArchivoPlano(ServicioProyectos servicioProyectos, ProyectoRepository proyectos,
			@Value("${ikernell.archivo-plano.separador}") String separador,
			@Value("${ikernell.archivo-plano.codificacion}") String codificacion) {
		this.servicioProyectos = servicioProyectos;
		this.proyectos = proyectos;
		this.separador = separador;
		this.codificacion = charsetDe(codificacion);
	}

	/**
	 * Una codificacion mal escrita se detecta al arrancar y no al generar.
	 *
	 * <p>De otro modo el fallo apareceria la primera vez que alguien pidiera el
	 * archivo, que es justo cuando menos ayuda.
	 */
	private static Charset charsetDe(String nombre) {
		try {
			return Charset.forName(nombre);
		}
		catch (IllegalCharsetNameException | UnsupportedCharsetException ex) {
			throw new IllegalStateException(
					"La codificacion configurada para el archivo plano no existe: " + nombre, ex);
		}
	}

	/** Archivo generado, con el nombre y la codificacion con que se escribio. */
	public record ArchivoPlano(String nombre, byte[] contenido, Charset codificacion) {
	}

	/**
	 * RF-025, HU-19 C01: genera el archivo con los proyectos indicados.
	 *
	 * <p>Sin identificadores incluye todos los proyectos registrados, tambien los
	 * inhabilitados: su historial se conserva (RN-02) y lo que se reporta es la
	 * ejecucion, no quienes siguen activos.
	 *
	 * <p>C03: sin proyectos que reportar no devuelve un archivo vacio, sino el
	 * aviso. C04: el archivo se arma entero en memoria y solo se entrega cuando
	 * esta completo, de modo que un fallo a mitad no produce un archivo truncado.
	 */
	@Transactional(readOnly = true)
	public ArchivoPlano generar(List<Long> proyectoIds) {
		List<Proyecto> seleccionados = (proyectoIds == null || proyectoIds.isEmpty())
				? proyectos.findAll()
				: proyectoIds.stream().distinct().map(servicioProyectos::obtener).toList();

		if (seleccionados.isEmpty()) {
			throw new ReglaNegocioException(
					"No hay informacion de proyectos para generar el archivo.");
		}

		StringBuilder contenido = new StringBuilder();
		contenido.append(String.join(separador, CAMPOS)).append('\n');
		for (Proyecto proyecto : seleccionados) {
			contenido.append(String.join(separador, filaDe(proyecto))).append('\n');
		}

		String nombre = "ikernell-proyectos-" + LocalDate.now() + ".txt";
		return new ArchivoPlano(nombre, contenido.toString().getBytes(codificacion), codificacion);
	}

	private List<String> filaDe(Proyecto proyecto) {
		EstadoProyectoResponse estado = servicioProyectos.consultarEstado(proyecto.getId());
		Map<String, Long> conteos = new LinkedHashMap<>(
				estado.datosDisponibles() != null ? estado.datosDisponibles() : Map.of());

		List<String> fila = new ArrayList<>();
		fila.add(String.valueOf(proyecto.getId()));
		fila.add(limpiar(proyecto.getNombre()));
		fila.add(String.valueOf(proyecto.getEstadoHabilitacion()));
		fila.add(limpiar(proyecto.getEstadoOperativo()));
		for (String conteo : CONTEOS) {
			fila.add(String.valueOf(conteos.getOrDefault(conteo, 0L)));
		}
		return fila;
	}

	/**
	 * Evita que un valor rompa la estructura del archivo.
	 *
	 * <p>Un nombre de proyecto que contenga el separador o un salto de linea
	 * partiria la fila en dos y el receptor leeria campos corridos. Se sustituyen
	 * por un espacio en lugar de entrecomillar porque un archivo plano no define
	 * escape: eso es parte de lo que falta acordar (D-28).
	 */
	private String limpiar(String valor) {
		if (valor == null) {
			return "";
		}
		// Los blancos se colapsan al final: sustituir el separador por un espacio
		// deja dos seguidos cuando ya habia uno al lado, y el receptor recibiria
		// un valor distinto del que se registro.
		return valor.replace(separador, " ")
				.replace('\n', ' ')
				.replace('\r', ' ')
				.replaceAll("\\s{2,}", " ")
				.trim();
	}

}

package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.reportes.externo.ServicioReporteExterno.ArchivoReporteExterno;
import com.PROYECTO.IKERNELL.backend.reportes.externo.dto.AuditoriaReporteExternoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.externo.dto.ConfiguracionReporteExternoResponse;
import com.PROYECTO.IKERNELL.backend.reportes.externo.dto.ProyectoReporteExternoResponse;

/**
 * Reportes externos para la empresa brasileña aliada (RF-025, HU-19).
 *
 * <p>Reservado al lider de proyectos, que es el actor que declara la historia
 * (C05). La autorizacion de nivel 2 no es el rol sino la marca del proyecto:
 * solo salen los proyectos que el acuerdo con la empresa autoriza.
 *
 * <p>La estructura del archivo sigue pendiente de acordar (HU-19 T1). Por eso
 * la configuracion efectiva se expone en su propio endpoint: la pantalla puede
 * decir con que campos, separador y codificacion se va a generar, y lo que
 * falta cerrar aparece en {@code parametrosPendientes}.
 */
@RestController
@RequestMapping("/api/reportes/externos")
@PreAuthorize("hasRole('LIDER')")
public class ReporteExternoController {

	private static final int LIMITE_HISTORIAL_POR_DEFECTO = 20;
	private static final int LIMITE_HISTORIAL_MAXIMO = 100;

	private final ServicioReporteExterno servicio;

	public ReporteExternoController(ServicioReporteExterno servicio) {
		this.servicio = servicio;
	}

	/** RF-025, HU-19 C01: proyectos que se pueden incluir en el reporte. */
	@GetMapping("/proyectos")
	public List<ProyectoReporteExternoResponse> proyectos() {
		return servicio.proyectosAutorizados();
	}

	/** RF-025, HU-19 C02: estructura y parametros efectivos del archivo. */
	@GetMapping("/configuracion")
	public ConfiguracionReporteExternoResponse configuracion() {
		return servicio.configuracion();
	}

	/**
	 * RF-025, HU-19 C01: genera y entrega el archivo.
	 *
	 * <p>{@code proyectoIds} es opcional: sin el se incluyen todos los
	 * proyectos autorizados. Se entrega como descarga porque lo que la empresa
	 * espera es un archivo, y la codificacion viaja en el Content-Type para que
	 * el receptor no tenga que adivinarla.
	 *
	 * <p>Los errores -sin proyectos autorizados (C03), proyecto no autorizado,
	 * fallo de generacion (C04)- salen por el manejador global con el mismo
	 * cuerpo de error que el resto de la API, de modo que la pantalla pueda
	 * mostrarlos como mensaje y no como una descarga vacia.
	 */
	@GetMapping("/archivo")
	public ResponseEntity<byte[]> archivo(
			@RequestParam(required = false) List<Long> proyectoIds,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {

		ArchivoReporteExterno archivo = servicio.generar(proyectoIds, autenticado);

		MediaType tipo = FormatoReporteExterno.CSV.name().equals(archivo.formato())
				? MediaType.parseMediaType("text/csv")
				: MediaType.TEXT_PLAIN;

		return ResponseEntity.ok()
				.contentType(new MediaType(tipo, archivo.codificacion()))
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
						.filename(archivo.nombre()).build().toString())
				.header("X-Content-Type-Options", "nosniff")
				.body(archivo.contenido());
	}

	/**
	 * Historial de intentos de generacion.
	 *
	 * <p>Incluye los fallos: HU-19 C04 exige que un error no entregue un archivo
	 * incompleto, y la forma de demostrar que no se entrego es poder ver el
	 * intento fallido junto a los exitosos.
	 */
	@GetMapping("/auditoria")
	public List<AuditoriaReporteExternoResponse> auditoria(
			@RequestParam(defaultValue = "" + LIMITE_HISTORIAL_POR_DEFECTO) int limite) {
		int acotado = Math.min(Math.max(limite, 1), LIMITE_HISTORIAL_MAXIMO);
		return servicio.historial(acotado);
	}

}

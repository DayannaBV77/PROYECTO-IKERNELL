package com.PROYECTO.IKERNELL.backend.reportes;

import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.reportes.ServicioArchivoPlano.ArchivoPlano;

/**
 * Archivo plano para la empresa brasileña aliada (RF-025, HU-19).
 *
 * <p>Reservado al lider de proyectos, que es el actor que declara la historia
 * (C05).
 *
 * <p>La estructura del archivo es una PROPUESTA pendiente de acordar con la
 * empresa brasileña (D-28); ver {@link ServicioArchivoPlano}.
 */
@RestController
@RequestMapping("/api/reportes")
public class ArchivoPlanoController {

	private final ServicioArchivoPlano servicio;

	public ArchivoPlanoController(ServicioArchivoPlano servicio) {
		this.servicio = servicio;
	}

	/**
	 * RF-025, HU-19 C01: genera y entrega el archivo.
	 *
	 * <p>{@code proyectoIds} es opcional porque C01 admite elegir los proyectos
	 * "si la empresa lo permite", algo que tampoco esta decidido: sin el, se
	 * incluyen todos.
	 *
	 * <p>Se entrega como descarga y no como JSON: lo que la empresa aliada espera
	 * es un archivo. La codificacion viaja en el Content-Type para que el
	 * receptor no tenga que adivinarla, que es la mitad de lo que C02 pide
	 * garantizar.
	 */
	@GetMapping("/archivo-plano")
	@PreAuthorize("hasRole('LIDER')")
	public ResponseEntity<byte[]> archivoPlano(
			@RequestParam(required = false) List<Long> proyectoIds) {

		ArchivoPlano archivo = servicio.generar(proyectoIds);

		return ResponseEntity.ok()
				.contentType(new MediaType(MediaType.TEXT_PLAIN, archivo.codificacion()))
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
						.filename(archivo.nombre()).build().toString())
				.body(archivo.contenido());
	}

}

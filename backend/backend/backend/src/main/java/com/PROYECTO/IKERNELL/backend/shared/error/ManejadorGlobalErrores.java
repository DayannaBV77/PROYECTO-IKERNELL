package com.PROYECTO.IKERNELL.backend.shared.error;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Traduce las excepciones a las respuestas que piden los criterios de
 * aceptacion (RNF-002: mensajes comprensibles de confirmacion o de correccion).
 */
@RestControllerAdvice
public class ManejadorGlobalErrores {

	/**
	 * Datos obligatorios vacios o con formato invalido.
	 *
	 * <p>Devuelve 400 con el detalle por campo para que el cliente marque lo que
	 * falta sin descartar lo ya escrito (RN-13). Cubre HU-03 C05, HU-02 C03/C04.
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorRespuesta> manejarValidacion(MethodArgumentNotValidException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			campos.putIfAbsent(error.getField(), error.getDefaultMessage());
		}
		return ResponseEntity.badRequest()
				.body(ErrorRespuesta.deValidacion("Hay datos que debe completar o corregir.", campos));
	}

	/** Mensaje generico unico para credenciales invalidas y cuentas inhabilitadas (RN-11). */
	@ExceptionHandler(AccesoDenegadoException.class)
	public ResponseEntity<ErrorRespuesta> manejarAccesoDenegado(AccesoDenegadoException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErrorRespuesta.de(ex.getMessage()));
	}

	@ExceptionHandler(RecursoNoEncontradoException.class)
	public ResponseEntity<ErrorRespuesta> manejarNoEncontrado(RecursoNoEncontradoException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorRespuesta.de(ex.getMessage()));
	}

	/**
	 * Nivel 2 de autorizacion denegado: el trabajador esta autenticado pero no
	 * puede operar sobre ese proyecto (HU-17 C05, HU-18 C05).
	 */
	@ExceptionHandler(OperacionNoAutorizadaException.class)
	public ResponseEntity<ErrorRespuesta> manejarNoAutorizada(OperacionNoAutorizadaException ex) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorRespuesta.de(ex.getMessage()));
	}

	/** Identificacion duplicada (RN-01) y demas reglas de negocio que bloquean la operacion. */
	@ExceptionHandler(ReglaNegocioException.class)
	public ResponseEntity<ErrorRespuesta> manejarReglaNegocio(ReglaNegocioException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorRespuesta.de(ex.getMessage()));
	}

	/**
	 * La operacion tiene advertencias y espera confirmacion (HU-09 C05).
	 *
	 * <p>409 y nada se modifica: el cliente muestra las advertencias y repite la
	 * peticion confirmando si el usuario decide continuar.
	 */
	@ExceptionHandler(ConfirmacionRequeridaException.class)
	public ResponseEntity<AdvertenciasRespuesta> manejarConfirmacionRequerida(ConfirmacionRequeridaException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(new AdvertenciasRespuesta(ex.getMessage(), ex.getAdvertencias()));
	}

	/** Fotografia con formato o tamano no permitidos (RF-002, HU-04 C05). */
	@ExceptionHandler(ArchivoInvalidoException.class)
	public ResponseEntity<ErrorRespuesta> manejarArchivoInvalido(ArchivoInvalidoException ex) {
		return ResponseEntity.badRequest().body(ErrorRespuesta.de(ex.getMessage()));
	}

	/**
	 * Archivo que supera el limite del servidor.
	 *
	 * <p>Lo rechaza el contenedor antes de llegar al servicio, asi que se traduce
	 * aqui al mismo mensaje explicativo que exige HU-04 C05.
	 */
	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ErrorRespuesta> manejarArchivoDemasiadoGrande(MaxUploadSizeExceededException ex) {
		return ResponseEntity.badRequest()
				.body(ErrorRespuesta.de("El archivo supera el tamano maximo permitido."));
	}

}

package com.PROYECTO.IKERNELL.backend.shared.error;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
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

	private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalErrores.class);

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

	/**
	 * Fallo de la base de datos: sin conexion, restriccion violada, interbloqueo.
	 *
	 * <p>Se separa del resto porque es el fallo que de verdad importa distinguir
	 * durante las pruebas: significa que la operacion NO quedo persistida. La
	 * traza completa va a la consola; al cliente solo se le dice que no se pudo
	 * completar, porque el detalle tecnico revelaria la forma del esquema.
	 */
	@ExceptionHandler(DataAccessException.class)
	public ResponseEntity<ErrorRespuesta> manejarFalloDeBaseDeDatos(DataAccessException ex) {
		log.error("Fallo de acceso a la base de datos. La operacion NO quedo registrada.", ex);
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ErrorRespuesta
				.de("No se pudo completar la operacion por un problema con la base de datos."));
	}

	/**
	 * Red de seguridad para lo que ningun manejador anterior previo.
	 *
	 * <p>Sin esta, una excepcion inesperada se iba por la pagina de error del
	 * contenedor: el cliente recibia un cuerpo con otra forma y la traza no
	 * quedaba en el log de la aplicacion, que es donde se la busca.
	 */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorRespuesta> manejarInesperado(Exception ex) throws Exception {
		// Las excepciones de Spring Security NO se manejan aqui: se relanzan para
		// que las resuelva la cadena de filtros de seguridad, que es la unica que
		// sabe distinguir "no ha iniciado sesion" (401) de "no tiene permiso"
		// (403). Atraparlas aqui las convertiria todas en un 500 y anularia de
		// hecho el control de acceso de RNF-001.
		if (ex instanceof AccessDeniedException || ex instanceof AuthenticationException) {
			throw ex;
		}
		log.error("Error inesperado procesando la peticion.", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ErrorRespuesta.de("Ocurrio un error inesperado. Intentelo de nuevo."));
	}

}

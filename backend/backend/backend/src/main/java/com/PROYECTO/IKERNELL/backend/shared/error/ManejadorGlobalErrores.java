package com.PROYECTO.IKERNELL.backend.shared.error;

import java.time.LocalDate;
import java.time.temporal.Temporal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

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

	/**
	 * Valor que Jackson no pudo convertir al tipo del campo (RN-13, HU-04 C02).
	 *
	 * <p>Sin este manejador el fallo caia en la red de seguridad de
	 * {@code Exception} y salia como 500 "error inesperado": la peticion ni
	 * llegaba a la validacion de Bean Validation, porque el cuerpo no se podia
	 * leer. El caso concreto que lo delataba era la fecha de nacimiento, el
	 * unico dato del perfil que no es texto: un valor como "12/07/1994" -lo que
	 * escribe el usuario cuando el navegador degrada
	 * {@code <input type="date">} a texto- hacia irrecuperable el formulario,
	 * porque el cliente recibia un mensaje generico y ningun campo marcado.
	 *
	 * <p>Ahora responde 400 con el campo senalado, igual que cualquier otro dato
	 * invalido, de modo que el formulario conserve lo ya escrito y diga que
	 * corregir.
	 */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorRespuesta> manejarCuerpoIlegible(HttpMessageNotReadableException ex) {
		MismatchedInputException desajuste = desajusteDe(ex);
		if (desajuste != null) {
			String campo = rutaDelCampo(desajuste);
			if (campo != null) {
				return ResponseEntity.badRequest().body(ErrorRespuesta.deValidacion(
						"Hay datos que debe completar o corregir.",
						Map.of(campo, mensajeDeTipo(desajuste.getTargetType()))));
			}
		}

		// JSON mal formado, cuerpo ausente o un fallo sin campo identificable: no
		// hay nada que marcar, pero sigue siendo culpa de la peticion.
		log.warn("Cuerpo de peticion ilegible: {}", ex.getMessage());
		return ResponseEntity.badRequest()
				.body(ErrorRespuesta.de("No se pudo leer la peticion. Revise los datos enviados."));
	}

	/** Busca el desajuste de tipo en la cadena de causas; nulo si el fallo es de otra clase. */
	private static MismatchedInputException desajusteDe(Throwable ex) {
		for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
			if (causa instanceof MismatchedInputException desajuste) {
				return desajuste;
			}
			if (causa == causa.getCause()) {
				break;
			}
		}
		return null;
	}

	/**
	 * Nombre del campo tal y como lo espera el cliente.
	 *
	 * <p>Se compone igual que el de {@link FieldError} -puntos para lo anidado y
	 * corchetes para los indices- para que el cliente no tenga que distinguir de
	 * que manejador vino el error.
	 */
	private static String rutaDelCampo(MismatchedInputException ex) {
		StringBuilder ruta = new StringBuilder();
		for (JacksonException.Reference referencia : ex.getPath()) {
			String propiedad = referencia.getPropertyName();
			if (propiedad != null) {
				if (!ruta.isEmpty()) {
					ruta.append('.');
				}
				ruta.append(propiedad);
			} else if (referencia.getIndex() >= 0) {
				ruta.append('[').append(referencia.getIndex()).append(']');
			}
		}
		return ruta.isEmpty() ? null : ruta.toString();
	}

	/**
	 * Mensaje de correccion segun el tipo que se esperaba.
	 *
	 * <p>Para las fechas nombra el formato ISO (AAAA-MM-DD), que es el que
	 * produce {@code <input type="date">} y el que almacena PostgreSQL; decir
	 * solo "valor invalido" dejaria al usuario sin saber que escribir.
	 */
	private static String mensajeDeTipo(Class<?> tipoEsperado) {
		if (tipoEsperado == null) {
			return "El valor indicado no es valido.";
		}
		if (tipoEsperado == LocalDate.class) {
			return "La fecha debe indicarse con el formato AAAA-MM-DD.";
		}
		if (Temporal.class.isAssignableFrom(tipoEsperado)) {
			return "La fecha debe indicarse en formato ISO.";
		}
		if (tipoEsperado.isEnum()) {
			return "Debe elegir uno de los valores admitidos.";
		}
		if (Number.class.isAssignableFrom(tipoEsperado) || tipoEsperado.isPrimitive()) {
			return "Debe indicar un numero valido.";
		}
		return "El valor indicado no tiene un formato valido.";
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

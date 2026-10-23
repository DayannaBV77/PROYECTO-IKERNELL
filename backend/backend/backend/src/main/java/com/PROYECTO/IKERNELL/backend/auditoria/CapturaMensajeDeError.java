package com.PROYECTO.IKERNELL.backend.auditoria;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import com.PROYECTO.IKERNELL.backend.shared.error.AdvertenciasRespuesta;
import com.PROYECTO.IKERNELL.backend.shared.error.ErrorRespuesta;

/**
 * Copia el mensaje de error que se le devuelve al cliente a un atributo de la
 * peticion, para que {@link FiltroRegistroOperaciones} lo anote en la bitacora.
 *
 * <p>La alternativa habitual -envolver la respuesta en un
 * {@code ContentCachingResponseWrapper} para releer el cuerpo- obligaria a
 * copiar en memoria TODAS las respuestas, incluidas las fotografias de perfil
 * de RF-002, solo para leer el texto de unas pocas que fallan. Interceptar
 * aqui el objeto antes de serializarlo cuesta nada.
 *
 * <p>Solo mira los dos tipos de respuesta de error del proyecto; el resto pasa
 * intacto.
 */
@RestControllerAdvice
public class CapturaMensajeDeError implements ResponseBodyAdvice<Object> {

	@Override
	public boolean supports(MethodParameter tipoRetorno, Class<? extends HttpMessageConverter<?>> conversor) {
		return true;
	}

	@Override
	public Object beforeBodyWrite(Object cuerpo, MethodParameter tipoRetorno, MediaType tipoContenido,
			Class<? extends HttpMessageConverter<?>> conversor,
			ServerHttpRequest peticion, ServerHttpResponse respuesta) {

		String mensaje = mensajeDe(cuerpo);
		if (mensaje != null && peticion instanceof ServletServerHttpRequest servlet) {
			servlet.getServletRequest()
					.setAttribute(FiltroRegistroOperaciones.ATRIBUTO_DETALLE_ERROR, mensaje);
		}
		return cuerpo;
	}

	private String mensajeDe(Object cuerpo) {
		if (cuerpo instanceof ErrorRespuesta error) {
			// En los errores de validacion interesa saber QUE campo fallo, no
			// solo que "hay datos por corregir".
			return error.campos() == null || error.campos().isEmpty()
					? error.mensaje()
					: error.mensaje() + " " + error.campos();
		}
		if (cuerpo instanceof AdvertenciasRespuesta advertencias) {
			return advertencias.mensaje();
		}
		return null;
	}

}

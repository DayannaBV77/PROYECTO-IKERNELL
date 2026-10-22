package com.PROYECTO.IKERNELL.backend.publico.domain;

/**
 * Las seis secciones de informacion empresarial publica.
 *
 * <p>No es una lista propuesta: HU-01 C01 las enumera exactamente -"las seis
 * partes de la informacion empresarial: lineamientos, portafolio de servicios,
 * noticias, preguntas frecuentes, enlaces de interes y contacto"- y coinciden
 * con el Caso de Estudio p.2 y con RF-032 a RF-036.
 */
public enum TipoContenido {

	/** RF-032: lineamientos de la empresa. */
	LINEAMIENTO,

	/** RF-032: portafolio de servicios. */
	PORTAFOLIO_SERVICIO,

	/** RF-033: noticias relacionadas con software. */
	NOTICIA,

	/** RF-034: preguntas frecuentes con su respuesta. */
	PREGUNTA_FRECUENTE,

	/** RF-036: enlaces a sitios de interes. */
	ENLACE_INTERES,

	/** RF-036: informacion de contacto. */
	INFORMACION_CONTACTO;

	/** RF-036: un enlace sin destino no cumple "dirigir a los destinos configurados". */
	public boolean exigeEnlace() {
		return this == ENLACE_INTERES;
	}

	/** RF-034: una pregunta frecuente sin respuesta no cumple su proposito. */
	public boolean exigeCuerpo() {
		return this == PREGUNTA_FRECUENTE;
	}

}

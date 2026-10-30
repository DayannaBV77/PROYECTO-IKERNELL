package com.PROYECTO.IKERNELL.backend.reportes.externo;

/**
 * Utilidades de texto compartidas por los formateadores.
 *
 * <p>Un valor con el separador o con un salto de linea partiria una fila en dos
 * y el receptor leeria columnas corridas. Cada formato resuelve ese riesgo a su
 * manera -el delimitado sustituye, el CSV entrecomilla, el ancho fijo recorta-
 * pero todos parten de la misma limpieza basica.
 */
final class TextoReporte {

	private TextoReporte() {
	}

	/** Quita saltos de linea y recorta extremos; nulo se vuelve cadena vacia. */
	static String limpiar(String valor) {
		if (valor == null) {
			return "";
		}
		return valor.replace('\n', ' ').replace('\r', ' ').trim();
	}

	/**
	 * Limpia y ademas sustituye el separador por un espacio.
	 *
	 * <p>Los blancos repetidos se colapsan al final: sustituir el separador por
	 * un espacio deja dos seguidos cuando ya habia uno al lado, y el receptor
	 * recibiria un valor distinto del que se registro.
	 */
	static String limpiar(String valor, String separador) {
		String limpio = limpiar(valor);
		if (separador == null || separador.isEmpty()) {
			return limpio;
		}
		return limpio.replace(separador, " ").replaceAll("\\s{2,}", " ").trim();
	}

	/** Recorta o rellena a la derecha hasta el ancho indicado. */
	static String ajustar(String valor, int ancho) {
		String limpio = limpiar(valor);
		if (limpio.length() > ancho) {
			return limpio.substring(0, ancho);
		}
		return limpio + " ".repeat(ancho - limpio.length());
	}

}

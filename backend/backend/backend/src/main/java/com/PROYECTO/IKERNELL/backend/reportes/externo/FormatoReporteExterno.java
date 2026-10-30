package com.PROYECTO.IKERNELL.backend.reportes.externo;

/**
 * Formatos que el reporte externo sabe escribir hoy (RF-025, HU-19 C02).
 *
 * <p>HU-19 T1 deja pendiente cual es el formato definitivo que espera la
 * empresa brasileña. Por eso el formato no esta fijado en el codigo: se elige
 * por configuracion y cada valor tiene su propio formateador. Agregar el
 * formato que finalmente se acuerde no obliga a tocar el servicio ni el
 * controlador; basta con anadir un {@link FormateadorReporteExterno} nuevo y
 * un valor aqui.
 */
public enum FormatoReporteExterno {

	/** Campos separados por el separador configurado (por defecto {@code |}). */
	DELIMITADO,

	/** CSV con comillas y escape segun RFC 4180. */
	CSV,

	/** Cada campo ocupando un ancho fijo, definido por campo. */
	ANCHO_FIJO,

	/** Bloques legibles de {@code campo: valor}, uno por proyecto. */
	TXT;

}

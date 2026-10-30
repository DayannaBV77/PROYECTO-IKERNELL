package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;

/**
 * Escribe las filas del reporte en un formato concreto (RF-025, HU-19 C02).
 *
 * <p>El servicio arma una cabecera y unas filas ya mapeadas y delega en el
 * formateador elegido por configuracion. Asi el formato final es una pieza
 * intercambiable: cuando la empresa brasileña cierre el acuerdo, se agrega o
 * se ajusta un formateador sin tocar la seleccion de proyectos, la auditoria
 * ni el control de acceso.
 */
public interface FormateadorReporteExterno {

	/** Formato que implementa esta pieza. */
	FormatoReporteExterno formato();

	/** Extension del archivo, con el punto incluido. */
	String extension();

	/**
	 * Devuelve el contenido completo del archivo.
	 *
	 * @param cabecera nombres de los campos, en orden
	 * @param filas    valores ya mapeados; cada fila tiene la misma longitud que
	 *                 la cabecera
	 * @param config   parametros efectivos del reporte
	 */
	String formatear(List<String> cabecera, List<List<String>> filas,
			ConfiguracionReporteExterno config);

}

package com.PROYECTO.IKERNELL.backend.reportes.externo.dto;

import java.util.List;

/**
 * Parametros efectivos del reporte externo (RF-025, HU-19 C02).
 *
 * <p>Se exponen para que la pantalla pueda mostrar con que estructura se va a
 * generar el archivo, en lugar de que el usuario lo descubra despues de
 * descargarlo. {@code parametrosPendientes} enumera lo que falta acordar con la
 * empresa brasileña (HU-19 T1).
 */
public record ConfiguracionReporteExternoResponse(
		String formato,
		String separador,
		String codificacion,
		boolean incluirCabecera,
		String nombreBase,
		List<String> campos,
		List<String> parametrosPendientes) {
}

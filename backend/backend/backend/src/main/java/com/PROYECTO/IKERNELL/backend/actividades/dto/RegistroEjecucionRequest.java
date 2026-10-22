package com.PROYECTO.IKERNELL.backend.actividades.dto;

import jakarta.validation.constraints.Size;

/**
 * Datos con los que el desarrollador registra la ejecucion (RF-022, HU-16 C02).
 *
 * <p>PENDIENTE D-04: HU-16 T1 deja a la empresa definir "que datos debe
 * registrar el desarrollador al ejecutarla". Por eso ambos campos son
 * opcionales: lo unico que el criterio exige es que la ejecucion quede guardada.
 *
 * @param observaciones texto libre sobre el trabajo realizado
 * @param finalizada    true si con este registro la ejecucion queda cerrada
 */
public record RegistroEjecucionRequest(

		@Size(max = 2000, message = "Las observaciones admiten hasta 2000 caracteres.")
		String observaciones,

		Boolean finalizada) {
}

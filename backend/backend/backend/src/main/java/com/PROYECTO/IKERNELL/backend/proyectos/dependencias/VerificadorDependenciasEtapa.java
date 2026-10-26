package com.PROYECTO.IKERNELL.backend.proyectos.dependencias;

import java.util.Optional;

/**
 * Informa si una etapa tiene registros asociados que impiden eliminarla.
 *
 * <p>RN-08 esta CONFIRMADA (RF-012, HU-11 C05): una etapa con actividades o
 * registros asociados no se elimina, para no perder informacion historica.
 *
 * <p>La regla se expresa como punto de extension para que cada modulo aporte sus
 * propias dependencias sin que el servicio de etapas tenga que conocerlas. Hoy
 * hay TRES implementaciones, y basto registrar cada bean:
 *
 * <ul>
 * <li>{@code VerificadorActividadesDeEtapa} (actividades, RF-019).
 * <li>{@code VerificadorIncidenciasDeEtapa} (errores e interrupciones; aplica
 * desde D-36, que hizo de la fase de una incidencia una etapa del proyecto).
 * <li>{@code VerificadorHilosDeEtapa} (hilos de conversacion, RF-037).
 * </ul>
 *
 * <p>Basta con que uno encuentre dependencias para que la etapa no se elimine.
 */
public interface VerificadorDependenciasEtapa {

	/**
	 * @return el motivo por el que la etapa no se puede eliminar, o vacio si este
	 *         verificador no encuentra dependencias
	 */
	Optional<String> dependenciaQueImpideEliminar(Long etapaId);

}

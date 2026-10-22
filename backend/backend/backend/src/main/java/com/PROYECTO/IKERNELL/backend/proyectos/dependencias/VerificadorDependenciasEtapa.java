package com.PROYECTO.IKERNELL.backend.proyectos.dependencias;

import java.util.Optional;

/**
 * Informa si una etapa tiene registros asociados que impiden eliminarla.
 *
 * <p>RN-08 esta CONFIRMADA (RF-012, HU-11 C05): una etapa con actividades o
 * registros asociados no se elimina, para no perder informacion historica. Pero
 * las entidades que dependerian de una etapa -actividades, y segun D-05 tambien
 * errores e interrupciones- todavia no existen en el modelo.
 *
 * <p>Por eso la regla se expresa como punto de extension: hoy no hay ninguna
 * implementacion y la etapa siempre se puede eliminar; cuando se implemente
 * Actividad bastara con registrar un bean que cuente las suyas, sin tocar el
 * servicio de etapas. El mecanismo de bloqueo si esta probado.
 */
public interface VerificadorDependenciasEtapa {

	/**
	 * @return el motivo por el que la etapa no se puede eliminar, o vacio si este
	 *         verificador no encuentra dependencias
	 */
	Optional<String> dependenciaQueImpideEliminar(Long etapaId);

}

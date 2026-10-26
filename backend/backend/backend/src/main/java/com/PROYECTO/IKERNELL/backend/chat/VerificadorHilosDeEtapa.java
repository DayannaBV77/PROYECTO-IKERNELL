package com.PROYECTO.IKERNELL.backend.chat;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasEtapa;

/**
 * Impide eliminar una etapa que ya tiene hilos de conversacion asociados.
 *
 * <p>RN-08 (RF-012, HU-11 C05): una etapa con registros asociados no se elimina,
 * para no perder informacion historica. Un hilo vinculado a la etapa guarda las
 * consultas y decisiones tecnicas del equipo (RF-037), que es justo lo que la
 * regla protege.
 *
 * <p>Se suma por el mismo punto de extension que los verificadores de
 * actividades e incidencias, sin tocar el servicio de etapas.
 */
@Component
public class VerificadorHilosDeEtapa implements VerificadorDependenciasEtapa {

	private final HiloRepository hilos;

	public VerificadorHilosDeEtapa(HiloRepository hilos) {
		this.hilos = hilos;
	}

	@Override
	public Optional<String> dependenciaQueImpideEliminar(Long etapaId) {
		long cantidad = hilos.countByEtapaId(etapaId);
		if (cantidad == 0) {
			return Optional.empty();
		}
		return Optional.of("la etapa tiene " + cantidad + " hilo(s) de conversacion asociados,"
				+ " y eliminarla perderia las consultas y decisiones registradas alli.");
	}

}

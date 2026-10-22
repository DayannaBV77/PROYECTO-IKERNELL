package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasEtapa;

/**
 * Impide eliminar una etapa que ya tiene actividades asociadas.
 *
 * <p>Cierra RN-08 con datos reales. Hasta esta fase, el punto de extension de
 * {@code VerificadorDependenciasEtapa} no tenia ninguna implementacion y HU-11
 * C05 estaba implementada pero no verificable: no existia ninguna entidad que
 * pudiera depender de una etapa. Registrar este bean fue todo lo que hizo falta;
 * el servicio de etapas no se modifico.
 */
@Component
public class VerificadorActividadesDeEtapa implements VerificadorDependenciasEtapa {

	private final ActividadRepository actividades;

	public VerificadorActividadesDeEtapa(ActividadRepository actividades) {
		this.actividades = actividades;
	}

	@Override
	public Optional<String> dependenciaQueImpideEliminar(Long etapaId) {
		long cantidad = actividades.countByEtapaId(etapaId);
		if (cantidad == 0) {
			return Optional.empty();
		}
		return Optional.of("la etapa tiene " + cantidad
				+ " actividad(es) asociada(s), y eliminarla perderia informacion historica del proyecto.");
	}

}

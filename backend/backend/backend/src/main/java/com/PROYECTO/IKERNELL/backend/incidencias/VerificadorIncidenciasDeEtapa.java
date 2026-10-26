package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasEtapa;

/**
 * Impide eliminar una etapa que ya tiene errores o interrupciones asociados.
 *
 * <p>Lo exige RN-08 (RF-012, HU-11 C05): una etapa con registros asociados no se
 * elimina, para no perder informacion historica del proyecto. Hasta D-36 esta
 * regla no alcanzaba a las incidencias, porque la fase era un catalogo
 * transversal y no una etapa; al pasar a serlo, eliminar la etapa dejaria sin
 * referencia a las incidencias que la citan.
 *
 * <p>Se suma al verificador de actividades sin tocar el servicio de etapas: los
 * dos se consultan por el mismo punto de extension y basta con que uno encuentre
 * dependencias.
 */
@Component
public class VerificadorIncidenciasDeEtapa implements VerificadorDependenciasEtapa {

	private final ErrorProyectoRepository errores;
	private final InterrupcionProyectoRepository interrupciones;

	public VerificadorIncidenciasDeEtapa(ErrorProyectoRepository errores,
			InterrupcionProyectoRepository interrupciones) {
		this.errores = errores;
		this.interrupciones = interrupciones;
	}

	@Override
	public Optional<String> dependenciaQueImpideEliminar(Long etapaId) {
		long cantidadErrores = errores.countByEtapaId(etapaId);
		long cantidadInterrupciones = interrupciones.countByEtapaId(etapaId);
		if (cantidadErrores == 0 && cantidadInterrupciones == 0) {
			return Optional.empty();
		}
		return Optional.of("la etapa tiene " + cantidadErrores + " error(es) y "
				+ cantidadInterrupciones + " interrupcion(es) asociadas, y eliminarla perderia"
				+ " informacion historica del proyecto.");
	}

}

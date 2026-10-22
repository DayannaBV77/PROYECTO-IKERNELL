package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.ProveedorDatosAvance;

/**
 * Aporta los conteos de errores e interrupciones a la consulta de estado del
 * proyecto (RF-016).
 *
 * <p>Son datos de contexto, no de avance: HU-12 C02 solo nombra etapas y
 * actividades como los registros de los que depende el aviso de "aun no hay
 * datos de avance". Aqui se exponen porque RF-016 pide "los datos disponibles
 * que permitan entender su avance", y las incidencias ayudan a entenderlo.
 */
@Component
public class ProveedorConteoIncidencias implements ProveedorDatosAvance {

	private final ErrorProyectoRepository errores;
	private final InterrupcionProyectoRepository interrupciones;

	public ProveedorConteoIncidencias(ErrorProyectoRepository errores,
			InterrupcionProyectoRepository interrupciones) {
		this.errores = errores;
		this.interrupciones = interrupciones;
	}

	@Override
	public Map<String, Long> conteosPara(Long proyectoId) {
		Map<String, Long> conteos = new LinkedHashMap<>();
		conteos.put("erroresRegistrados", errores.countByProyectoId(proyectoId));
		conteos.put("interrupcionesRegistradas", interrupciones.countByProyectoId(proyectoId));
		return conteos;
	}

}

package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.ProveedorDatosAvance;

/**
 * Aporta el numero de actividades registradas a la consulta de estado del
 * proyecto (RF-016, HU-12).
 *
 * <p>Con esto, el aviso de HU-12 C02 ya corresponde a su texto literal: "el
 * proyecto todavia no tiene etapas ni actividades registradas".
 */
@Component
public class ProveedorConteoActividades implements ProveedorDatosAvance {

	private final ActividadRepository actividades;

	public ProveedorConteoActividades(ActividadRepository actividades) {
		this.actividades = actividades;
	}

	@Override
	public Map<String, Long> conteosPara(Long proyectoId) {
		return Map.of("actividadesRegistradas", actividades.countByEtapaProyectoId(proyectoId));
	}

}

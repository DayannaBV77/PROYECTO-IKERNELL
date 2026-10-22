package com.PROYECTO.IKERNELL.backend.proyectos.dependencias;

import java.util.Map;

/**
 * Aporta conteos que describen el avance disponible de un proyecto (RF-016).
 *
 * <p>Existe para que el modulo de proyectos no tenga que conocer a los modulos
 * que cuelgan de el. Cada modulo -actividades, y mas adelante errores e
 * interrupciones- registra su propio proveedor, y la consulta de estado va
 * sumando datos sin que ServicioProyectos cambie.
 *
 * @return conteos por nombre, por ejemplo {@code actividadesRegistradas -> 12}
 */
public interface ProveedorDatosAvance {

	Map<String, Long> conteosPara(Long proyectoId);

}

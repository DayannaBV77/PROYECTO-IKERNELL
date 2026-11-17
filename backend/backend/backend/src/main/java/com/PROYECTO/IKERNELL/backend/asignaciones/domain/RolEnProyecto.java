package com.PROYECTO.IKERNELL.backend.asignaciones.domain;

/**
 * Rol que un trabajador cumple en UN proyecto concreto.
 *
 * <p>DERIVADO de RN-05 (Caso de Estudio p.3): "si fuera necesario por limites de
 * tiempo, los lideres pueden llegar a ser desarrolladores de otro proyecto".
 * Esa frase hace imposible representar la responsabilidad con el tipo global del
 * trabajador, porque la misma persona puede ser LIDER en su proyecto y
 * DESARROLLADOR en otro al mismo tiempo (HU-10 C04, HU-16 C05).
 *
 * <p>Los nombres se resuelven desde el catálogo {@code rol}; no se persisten
 * como un valor enum dentro de cada asignación.
 */
public enum RolEnProyecto {

	COORDINADOR("Coordinador"),
	LIDER("Líder"),
	DESARROLLADOR("Desarrollador");

	private final String nombreCatalogo;

	RolEnProyecto(String nombreCatalogo) {
		this.nombreCatalogo = nombreCatalogo;
	}

	public String nombreCatalogo() {
		return nombreCatalogo;
	}

	public static RolEnProyecto desdeNombreCatalogo(String nombre) {
		for (RolEnProyecto rol : values()) {
			if (rol.nombreCatalogo.equals(nombre)) {
				return rol;
			}
		}
		throw new IllegalStateException("El catálogo contiene un rol desconocido: " + nombre);
	}

}

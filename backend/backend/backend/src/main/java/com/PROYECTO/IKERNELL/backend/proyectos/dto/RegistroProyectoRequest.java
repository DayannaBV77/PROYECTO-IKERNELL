package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos para registrar un proyecto (RF-008, HU-08 C01).
 *
 * <p>PENDIENTE D-02: RF-008 habla de "los datos identificativos y descriptivos
 * que defina la empresa" sin enumerarlos, y HU-08 T1 lo deja como acuerdo
 * pendiente. Aqui estan los dos unicos deducibles de los documentos: el nombre,
 * porque HU-09 C01 busca por el, y la descripcion, porque RF-008 menciona datos
 * descriptivos. Los demas se agregaran cuando la empresa los defina.
 */
public record RegistroProyectoRequest(

		@NotBlank(message = "Debe indicar el nombre del proyecto.")
		@Size(max = 150, message = "El nombre admite hasta 150 caracteres.")
		String nombre,

		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion,

		/**
		 * RF-025: deja el proyecto listo para el reporte externo desde su
		 * creacion. Omitirlo equivale a no autorizarlo, que es el valor seguro.
		 */
		boolean reporteExternoAutorizado) {
}

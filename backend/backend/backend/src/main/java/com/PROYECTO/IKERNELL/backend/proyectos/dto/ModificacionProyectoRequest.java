package com.PROYECTO.IKERNELL.backend.proyectos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Campos modificables del proyecto (RF-014, HU-09 C03).
 *
 * <p>PENDIENTE: que datos del proyecto se podran modificar lo deja abierto
 * HU-09 T1. Con el modelo actual los dos campos existentes son editables; al
 * ampliarse D-02 habra que decidir cuales de los nuevos lo son.
 *
 * <p>El estado de habilitacion NO se modifica aqui: tiene su propia operacion
 * (RF-015) con advertencia y confirmacion.
 */
public record ModificacionProyectoRequest(

		@NotBlank(message = "Debe indicar el nombre del proyecto.")
		@Size(max = 150, message = "El nombre admite hasta 150 caracteres.")
		String nombre,

		@Size(max = 2000, message = "La descripcion admite hasta 2000 caracteres.")
		String descripcion,

		/**
		 * RF-025: la autorizacion para el reporte externo tambien se modifica
		 * aqui. Retirarla no borra ningun dato: solo impide que el proyecto se
		 * vuelva a exportar.
		 */
		boolean reporteExternoAutorizado) {
}

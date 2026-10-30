package com.PROYECTO.IKERNELL.backend.reportes.externo.dto;

import java.time.LocalDateTime;

import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.AuditoriaReporteExterno;

/** Fila del historial de generaciones del reporte externo (RF-025, HU-19). */
public record AuditoriaReporteExternoResponse(
		Long id,
		LocalDateTime ocurridaEn,
		Long trabajadorId,
		String correo,
		String proyectosSolicitados,
		String proyectosIncluidos,
		String resultado,
		String formato,
		String codificacion,
		String nombreArchivo,
		Integer totalRegistros,
		long duracionMs,
		String mensajeError) {

	public static AuditoriaReporteExternoResponse de(AuditoriaReporteExterno auditoria) {
		return new AuditoriaReporteExternoResponse(
				auditoria.getId(),
				auditoria.getOcurridaEn(),
				auditoria.getTrabajadorId(),
				auditoria.getCorreo(),
				auditoria.getProyectosSolicitados(),
				auditoria.getProyectosIncluidos(),
				auditoria.getResultado().name(),
				auditoria.getFormato(),
				auditoria.getCodificacion(),
				auditoria.getNombreArchivo(),
				auditoria.getTotalRegistros(),
				auditoria.getDuracionMs(),
				auditoria.getMensajeError());
	}

}

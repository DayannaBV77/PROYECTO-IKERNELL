package com.PROYECTO.IKERNELL.backend.incidencias;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.ErrorProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.domain.InterrupcionProyecto;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.RegistroErrorRequest;
import com.PROYECTO.IKERNELL.backend.incidencias.dto.RegistroInterrupcionRequest;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioEtapas;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.error.OperacionNoAutorizadaException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Reglas de negocio de errores e interrupciones (RF-023, RF-024).
 *
 * <p>La autorizacion se resuelve en el <b>nivel 2</b>, no por tipo global: para
 * registrar hace falta una asignacion activa como DESARROLLADOR en ese proyecto.
 *
 * <p>Esa eleccion es la que hace compatibles dos cosas que, leidas al pie de la
 * letra, se contradecian (C-06): HU-17 C05 y HU-18 C05 dicen que solo el
 * desarrollador registra, mientras que el Caso de Estudio p.3 permite que un
 * lider sea desarrollador de otro proyecto. Comprobando la asignacion y no el
 * tipo, el coordinador y el lider quedan fuera, pero el lider asignado como
 * desarrollador si puede registrar en ese proyecto.
 *
 * <p>D-36: la fase de la incidencia es una etapa del proyecto. La etapa se
 * obtiene con {@code ServicioEtapas.obtener(proyectoId, etapaId)}, que ya
 * rechaza una etapa de otro proyecto: asi no se duplica aqui la comprobacion de
 * pertenencia ni se puede registrar una incidencia cuya etapa pertenezca a un
 * proyecto distinto del suyo.
 */
@Service
public class ServicioIncidencias {

	private final ErrorProyectoRepository errores;
	private final InterrupcionProyectoRepository interrupciones;
	private final ServicioEtapas servicioEtapas;
	private final ServicioProyectos servicioProyectos;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioAsignaciones servicioAsignaciones;

	public ServicioIncidencias(ErrorProyectoRepository errores,
			InterrupcionProyectoRepository interrupciones, ServicioEtapas servicioEtapas,
			ServicioProyectos servicioProyectos, ServicioTrabajadores servicioTrabajadores,
			ServicioAsignaciones servicioAsignaciones) {
		this.errores = errores;
		this.interrupciones = interrupciones;
		this.servicioEtapas = servicioEtapas;
		this.servicioProyectos = servicioProyectos;
		this.servicioTrabajadores = servicioTrabajadores;
		this.servicioAsignaciones = servicioAsignaciones;
	}

	/** RF-023, HU-17 C01: registra el error asociado al proyecto y a la fase. */
	@Transactional
	public ErrorProyecto registrarError(Long proyectoId, RegistroErrorRequest peticion, Long trabajadorId) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);
		Trabajador autor = exigirDesarrolladorDelProyecto(trabajadorId, proyectoId,
				"Solo un desarrollador asignado al proyecto puede registrar sus errores.");
		Etapa etapa = servicioEtapas.obtener(proyectoId, peticion.etapaId());

		return errores.save(new ErrorProyecto(proyecto, peticion.tipoError(), etapa,
				peticion.descripcion(), peticion.fecha(), autor));
	}

	/** RF-024, HU-18 C01: registra la interrupcion asociada al proyecto y a la fase. */
	@Transactional
	public InterrupcionProyecto registrarInterrupcion(Long proyectoId, RegistroInterrupcionRequest peticion,
			Long trabajadorId) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);
		Trabajador autor = exigirDesarrolladorDelProyecto(trabajadorId, proyectoId,
				"Solo un desarrollador asignado al proyecto puede registrar sus interrupciones.");
		Etapa etapa = servicioEtapas.obtener(proyectoId, peticion.etapaId());

		return interrupciones.save(new InterrupcionProyecto(proyecto, peticion.tipoInterrupcion(),
				peticion.fecha(), peticion.duracionValor(), peticion.duracionUnidad(), etapa, autor));
	}

	/**
	 * HU-18 C04: las interrupciones registradas quedan disponibles para el lider.
	 *
	 * <p>Es la consulta simple; el reporte con filtro por periodo es RF-017.
	 */
	@Transactional(readOnly = true)
	public List<InterrupcionProyecto> interrupcionesDeProyecto(Long proyectoId) {
		servicioProyectos.obtener(proyectoId);
		return interrupciones.findByProyectoIdOrderByFechaDesc(proyectoId);
	}

	/**
	 * Errores registrados en el proyecto.
	 *
	 * <p>VACIO DE REQUISITOS: ningun RF define quien consulta los errores. RF-017
	 * reporta interrupciones y RF-018 actividades, pero no hay reporte de
	 * errores, con lo que HU-17 ("dejar documentadas las incidencias") produciria
	 * datos que nadie puede leer. Esta consulta es una PROPUESTA minima para que
	 * los errores registrados sean recuperables.
	 */
	@Transactional(readOnly = true)
	public List<ErrorProyecto> erroresDeProyecto(Long proyectoId) {
		servicioProyectos.obtener(proyectoId);
		return errores.findByProyectoIdOrderByIdDesc(proyectoId);
	}

	private Trabajador exigirDesarrolladorDelProyecto(Long trabajadorId, Long proyectoId, String mensaje) {
		if (!servicioAsignaciones.puedeActuarComo(trabajadorId, proyectoId, RolEnProyecto.DESARROLLADOR)) {
			throw new OperacionNoAutorizadaException(mensaje);
		}
		return servicioTrabajadores.obtener(trabajadorId);
	}

}

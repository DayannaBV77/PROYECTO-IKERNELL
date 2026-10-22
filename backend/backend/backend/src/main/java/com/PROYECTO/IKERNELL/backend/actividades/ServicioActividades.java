package com.PROYECTO.IKERNELL.backend.actividades;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.actividades.domain.Actividad;
import com.PROYECTO.IKERNELL.backend.actividades.domain.EjecucionActividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.CriteriosBusquedaActividad;
import com.PROYECTO.IKERNELL.backend.actividades.dto.ModificacionActividadRequest;
import com.PROYECTO.IKERNELL.backend.actividades.dto.RegistroActividadRequest;
import com.PROYECTO.IKERNELL.backend.actividades.dto.RegistroEjecucionRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioEtapas;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.shared.error.ConfirmacionRequeridaException;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/** Reglas de negocio de las actividades (RF-019 a RF-022). */
@Service
public class ServicioActividades {

	private final ActividadRepository actividades;
	private final EjecucionActividadRepository ejecuciones;
	private final ServicioEtapas servicioEtapas;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioAsignaciones servicioAsignaciones;

	public ServicioActividades(ActividadRepository actividades, EjecucionActividadRepository ejecuciones,
			ServicioEtapas servicioEtapas, ServicioTrabajadores servicioTrabajadores,
			ServicioAsignaciones servicioAsignaciones) {
		this.actividades = actividades;
		this.ejecuciones = ejecuciones;
		this.servicioEtapas = servicioEtapas;
		this.servicioTrabajadores = servicioTrabajadores;
		this.servicioAsignaciones = servicioAsignaciones;
	}

	/**
	 * Registra una actividad para un desarrollador (RF-019, HU-13 C01).
	 *
	 * <p>Rechaza a un desarrollador inhabilitado: RF-007 le cierra los servicios
	 * internos, asi que no podria ejecutarla nunca (RN-03).
	 *
	 * <p>ADVERTENCIA PROPUESTA (D-24): si el desarrollador no tiene asignacion
	 * activa en el proyecto, advierte y espera confirmacion. Ningun RF lo exige
	 * -RF-019 solo pide elegir proyecto, etapa y desarrollador-, pero HU-13 esta
	 * declarada como relacionada con HU-10 (la asignacion del equipo) y asignar
	 * trabajo a alguien ajeno al proyecto es casi siempre un descuido. Se advierte
	 * en lugar de bloquear, para no inventar una restriccion que nadie pidio.
	 */
	@Transactional
	public Actividad registrar(Long proyectoId, RegistroActividadRequest peticion, boolean confirmado) {
		Etapa etapa = servicioEtapas.obtener(proyectoId, peticion.etapaId());
		Trabajador desarrollador = servicioTrabajadores.obtener(peticion.desarrolladorId());

		if (!desarrollador.estaHabilitado()) {
			throw new ReglaNegocioException("El trabajador " + desarrollador.nombreCompleto()
					+ " esta inhabilitado porque ya no pertenece a la empresa.");
		}
		boolean asignado = servicioAsignaciones.puedeActuarComo(
				desarrollador.getId(), proyectoId, RolEnProyecto.DESARROLLADOR);
		if (!asignado && !confirmado) {
			throw new ConfirmacionRequeridaException(
					"El desarrollador no esta asignado a este proyecto.",
					List.of("%s no tiene una asignacion activa como desarrollador en el proyecto '%s'."
							.formatted(desarrollador.nombreCompleto(), etapa.getProyecto().getNombre())));
		}
		return actividades.save(new Actividad(etapa, desarrollador, peticion.descripcion()));
	}

	/** RF-020, HU-13 C03 y C04. */
	@Transactional(readOnly = true)
	public Page<Actividad> buscar(CriteriosBusquedaActividad criterios, Pageable paginacion) {
		return actividades.findAll(ActividadSpecifications.desde(criterios), paginacion);
	}

	@Transactional(readOnly = true)
	public Actividad obtener(Long id) {
		return actividades.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe una actividad con el id " + id + "."));
	}

	/**
	 * Modifica una actividad ante una eventualidad (RF-021, HU-13 C05).
	 *
	 * <p>La nueva etapa debe pertenecer al mismo proyecto; asi la actividad sigue
	 * asociada al mismo proyecto, como garantiza el criterio. El desarrollador no
	 * se puede cambiar.
	 */
	@Transactional
	public Actividad modificar(Long id, ModificacionActividadRequest peticion) {
		Actividad actividad = obtener(id);
		Long proyectoId = actividad.getProyecto().getId();
		Etapa nuevaEtapa = servicioEtapas.obtener(proyectoId, peticion.etapaId());

		actividad.setEtapa(nuevaEtapa);
		actividad.setDescripcion(peticion.descripcion());
		return actividades.save(actividad);
	}

	/** HU-16 C01 y C04: actividades asignadas al desarrollador que consulta. */
	@Transactional(readOnly = true)
	public List<Actividad> misActividades(Long desarrolladorId) {
		return actividades.findByDesarrolladorIdOrderByIdDesc(desarrolladorId);
	}

	/**
	 * Registra la ejecucion de una actividad propia (RF-022, HU-16 C02).
	 *
	 * <p>RN-06: la actividad debe existir Y estar asignada a quien la ejecuta. Los
	 * dos casos devuelven el mismo error, como permite HU-16 C03, para no revelar
	 * si existen actividades de otros desarrolladores.
	 *
	 * <p>Aqui se aplica el <b>nivel 2</b> de autorizacion por fin: el permiso
	 * depende de la actividad asignada, no del tipo global. Eso es lo que hace que
	 * un lider asignado como desarrollador en otro proyecto pueda ejecutar sus
	 * actividades alli (HU-16 C05, RN-05).
	 */
	@Transactional
	public EjecucionActividad registrarEjecucion(Long actividadId, Long desarrolladorId,
			RegistroEjecucionRequest peticion) {
		Actividad actividad = actividades.findByIdAndDesarrolladorId(actividadId, desarrolladorId)
				.orElseThrow(() -> new RecursoNoEncontradoException(
						"La actividad no existe o no esta asignada a usted."));

		Trabajador desarrollador = servicioTrabajadores.obtener(desarrolladorId);
		EjecucionActividad ejecucion = new EjecucionActividad(actividad, desarrollador, peticion.observaciones());
		if (Boolean.TRUE.equals(peticion.finalizada())) {
			ejecucion.finalizar();
		}
		return ejecuciones.save(ejecucion);
	}

	/** Ejecuciones registradas de una actividad, para el detalle y los reportes. */
	@Transactional(readOnly = true)
	public List<EjecucionActividad> ejecucionesDe(Long actividadId) {
		obtener(actividadId);
		return ejecuciones.findByActividadIdOrderByIniciadaEnDesc(actividadId);
	}

}

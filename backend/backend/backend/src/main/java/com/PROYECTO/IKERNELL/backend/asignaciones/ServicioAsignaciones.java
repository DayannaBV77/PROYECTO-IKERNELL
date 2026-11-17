package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Asignacion;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.EstadoLiderazgo;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Rol;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionEquipoTrabajadorRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.AsignacionRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.RolResponse;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ResultadoAsignacionEquipoResponse.DesarrolladorRechazado;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.error.ConfirmacionRequeridaException;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Reglas de negocio de las asignaciones (RF-003 y RF-009).
 *
 * <p>Aqui se materializa la decision S-01: una sola entidad, dos operaciones con
 * autorizacion y alcance distintos.
 *
 * <table border="1">
 * <caption>Diferencias entre los dos flujos</caption>
 * <tr><th></th><th>RF-003 (coordinador)</th><th>RF-009 (lider)</th></tr>
 * <tr><td>Cardinalidad</td><td>un trabajador</td><td>uno o varios</td></tr>
 * <tr><td>Rol que otorga</td><td>LIDER o DESARROLLADOR</td><td>solo DESARROLLADOR</td></tr>
 * <tr><td>Duplicado</td><td>advierte y pide confirmar</td><td>lo informa como rechazado</td></tr>
 * </table>
 *
 * <p>La fila del rol es la PROPUESTA D-21, apoyada en que RF-003 habla de
 * asignar "trabajadores" y RF-009 de asignar "desarrolladores".
 */
@Service
public class ServicioAsignaciones {

	private final AsignacionRepository asignaciones;
	private final RolRepository roles;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioProyectos servicioProyectos;

	public ServicioAsignaciones(AsignacionRepository asignaciones, RolRepository roles,
			ServicioTrabajadores servicioTrabajadores, ServicioProyectos servicioProyectos) {
		this.asignaciones = asignaciones;
		this.roles = roles;
		this.servicioProyectos = servicioProyectos;
		this.servicioTrabajadores = servicioTrabajadores;
	}

	/**
	 * RF-003, HU-06: el coordinador asigna un trabajador a un proyecto.
	 *
	 * <p>Valida los dos estados antes de registrar: proyecto habilitado (RN-04,
	 * C02) y trabajador habilitado (RN-03, C03). Si ya existe una asignacion
	 * equivalente activa, advierte y espera confirmacion (RN-16, C04) en lugar de
	 * bloquear, porque el criterio pide que el coordinador la revise y decida.
	 */
	@Transactional
	public Asignacion asignarTrabajador(AsignacionRequest peticion, Trabajador coordinador, boolean confirmado) {
		Proyecto proyecto = servicioProyectos.obtenerParaAsignacion(peticion.proyectoId());
		Trabajador trabajador = servicioTrabajadores.obtener(peticion.trabajadorId());
		Rol rol = obtenerRol(peticion.rolId(), peticion.rolEnProyecto());

		exigirProyectoHabilitado(proyecto);
		exigirTrabajadorHabilitado(trabajador);

		if (rol.comoRolEnProyecto() == RolEnProyecto.LIDER) {
			Long rolLiderId = obtenerRol(null, RolEnProyecto.LIDER).getId();
			var liderActualOpt = asignaciones.findFirstByProyectoIdAndRolIdAndActivaTrue(proyecto.getId(), rolLiderId);
			if (liderActualOpt.isPresent() && !liderActualOpt.get().getTrabajador().getId().equals(trabajador.getId())) {
				throw new ReglaNegocioException("El proyecto ya cuenta con un líder asignado. Para cambiar el líder utilice la opción Cambiar Líder.");
			}
			proyecto.setLiderResponsable(trabajador);
		}

		var equivalenteActiva = asignaciones.findFirstByTrabajadorIdAndProyectoIdAndRolIdAndActivaTrue(
				trabajador.getId(), proyecto.getId(), rol.getId());
		if (equivalenteActiva.isPresent() && !confirmado) {
			throw new ConfirmacionRequeridaException(
					"El trabajador ya tiene una asignacion equivalente activa en este proyecto.",
					List.of("%s ya esta asignado al proyecto '%s' como %s."
							.formatted(trabajador.nombreCompleto(), proyecto.getNombre(),
									rol.comoRolEnProyecto())));
		}

		if (equivalenteActiva.isPresent()) {
			return equivalenteActiva.get();
		}

		return asignaciones.save(
				new Asignacion(trabajador, proyecto, rol, coordinador,
						peticion.dedicacionPorcentaje()));
	}

	/**
	 * Asigna el equipo del coordinador en una unica transaccion. Todas las
	 * referencias y estados se validan antes de guardar cualquier fila.
	 */
	@Transactional
	public ResultadoAsignacionesCoordinador asignarEquipoCoordinador(
			Long proyectoId,
			List<AsignacionEquipoTrabajadorRequest> solicitudes,
			Trabajador coordinador,
			boolean confirmado) {
		Proyecto proyecto = servicioProyectos.obtenerParaAsignacion(proyectoId);
		exigirProyectoHabilitado(proyecto);

		Set<String> clavesDelLote = new HashSet<>();
		List<Asignacion> existentes = new ArrayList<>();
		List<AsignacionEquipoTrabajadorRequest> nuevas = new ArrayList<>();
		List<Trabajador> trabajadoresNuevos = new ArrayList<>();
		List<Rol> rolesNuevos = new ArrayList<>();
		List<String> advertencias = new ArrayList<>();
		Long rolLiderId = obtenerRol(null, RolEnProyecto.LIDER).getId();
		long solicitudesLider = 0;

		for (AsignacionEquipoTrabajadorRequest solicitud : solicitudes) {
			Rol rol = obtenerRol(solicitud.rolId(), solicitud.rolEnProyecto());
			if (rol.getId().equals(rolLiderId)) {
				solicitudesLider++;
				if (solicitudesLider > 1) {
					throw new ReglaNegocioException("No se puede asignar más de un líder al proyecto.");
				}
				var liderActualOpt = asignaciones.findFirstByProyectoIdAndRolIdAndActivaTrue(proyecto.getId(), rolLiderId);
				if (liderActualOpt.isPresent() && !liderActualOpt.get().getTrabajador().getId().equals(solicitud.trabajadorId())) {
					throw new ReglaNegocioException("El proyecto ya cuenta con un líder asignado. Para cambiar el líder utilice la opción Cambiar Líder.");
				}
			}
			String clave = solicitud.trabajadorId() + ":" + rol.getId();
			if (!clavesDelLote.add(clave)) {
				throw new ReglaNegocioException(
						"No repita al mismo trabajador con el mismo rol dentro de una solicitud.");
			}

			Trabajador trabajador = servicioTrabajadores.obtener(solicitud.trabajadorId());
			exigirTrabajadorHabilitado(trabajador);
			var asignacionExistente = asignaciones.findFirstByTrabajadorIdAndProyectoIdAndRolIdAndActivaTrue(
					trabajador.getId(), proyecto.getId(), rol.getId());
			if (asignacionExistente.isPresent()) {
				existentes.add(asignacionExistente.get());
				advertencias.add("%s ya tiene una asignacion activa en '%s' como %s; al confirmar no se duplicara."
						.formatted(trabajador.nombreCompleto(), proyecto.getNombre(),
								rol.comoRolEnProyecto()));
			}
			else {
				nuevas.add(solicitud);
				trabajadoresNuevos.add(trabajador);
				rolesNuevos.add(rol);
			}
		}

		if (!advertencias.isEmpty() && !confirmado) {
			throw new ConfirmacionRequeridaException(
					"Hay asignaciones equivalentes activas. Revise las advertencias antes de continuar.",
					advertencias);
		}

		List<Asignacion> asignadas = new ArrayList<>();
		for (int indice = 0; indice < nuevas.size(); indice++) {
			AsignacionEquipoTrabajadorRequest solicitud = nuevas.get(indice);
			asignadas.add(new Asignacion(
					trabajadoresNuevos.get(indice),
					proyecto,
					rolesNuevos.get(indice),
					coordinador,
					solicitud.dedicacionPorcentaje()));
		}

		return new ResultadoAsignacionesCoordinador(asignaciones.saveAll(asignadas), existentes);
	}

	/**
	 * RF-009, HU-10: el lider asigna uno o varios desarrolladores a su proyecto.
	 *
	 * <p>El proyecto es comun a todo el lote, asi que si esta inhabilitado se
	 * rechaza la operacion completa (C02). Los desarrolladores se evaluan uno por
	 * uno: HU-10 C03 dice que no se asigna "ESE desarrollador", en singular.
	 *
	 * <p>C04 queda cubierto sin codigo adicional: asignar como DESARROLLADOR a
	 * quien es LIDER en otro proyecto no requiere ninguna excepcion, porque el rol
	 * vive en la asignacion y no en el trabajador.
	 */
	@Transactional
	public ResultadoLote asignarEquipo(Long proyectoId, List<Long> desarrolladorIds, Trabajador lider) {
		Proyecto proyecto = servicioProyectos.obtenerParaAsignacion(proyectoId);
		exigirProyectoHabilitado(proyecto);

		List<Asignacion> asignados = new ArrayList<>();
		List<DesarrolladorRechazado> rechazados = new ArrayList<>();
		Rol rolDesarrollador = obtenerRol(null, RolEnProyecto.DESARROLLADOR);

		for (Long desarrolladorId : desarrolladorIds.stream().distinct().toList()) {
			Trabajador desarrollador;
			try {
				desarrollador = servicioTrabajadores.obtener(desarrolladorId);
			}
			catch (RecursoNoEncontradoException ex) {
				rechazados.add(new DesarrolladorRechazado(desarrolladorId, "El trabajador no existe."));
				continue;
			}
			if (!desarrollador.estaHabilitado()) {
				rechazados.add(new DesarrolladorRechazado(desarrolladorId,
						"El trabajador esta inhabilitado porque ya no pertenece a la empresa."));
				continue;
			}
			if (asignaciones.existsByTrabajadorIdAndProyectoIdAndRolIdAndActivaTrue(
					desarrolladorId, proyectoId, rolDesarrollador.getId())) {
				rechazados.add(new DesarrolladorRechazado(desarrolladorId,
						"Ya tiene una asignacion activa como desarrollador en este proyecto."));
				continue;
			}
			asignados.add(asignaciones.save(
					new Asignacion(desarrollador, proyecto, rolDesarrollador, lider)));
		}
		return new ResultadoLote(asignados, rechazados);
	}

	/** HU-06 C05: asignaciones registradas de un trabajador. */
	@Transactional(readOnly = true)
	public List<Asignacion> asignacionesDeTrabajador(Long trabajadorId) {
		servicioTrabajadores.obtener(trabajadorId);
		return asignaciones.findByTrabajadorIdOrderByFechaAsignacionDesc(trabajadorId);
	}

	/**
	 * Asignaciones activas del trabajador autenticado, origen de "mis proyectos".
	 *
	 * <p>No valida el trabajador contra el repositorio como hacen las consultas
	 * del coordinador: aqui el identificador no llega por la ruta sino de la
	 * sesion, de modo que corresponde a un trabajador que acaba de autenticarse.
	 *
	 * <p>No filtra por rol. El rol viaja en la respuesta para que cada pantalla
	 * decida que puede ofrecer: las incidencias exigen DESARROLLADOR (RF-023,
	 * RF-024) y los hilos de conversacion por proyecto admitiran cualquier rol
	 * (RF-037).
	 */
	@Transactional(readOnly = true)
	public List<Asignacion> misAsignacionesActivas(Long trabajadorId) {
		return asignaciones.findByTrabajadorIdAndActivaTrueOrderByProyectoNombreAsc(trabajadorId);
	}

	/** HU-06 C05: asignaciones registradas de un proyecto. */
	@Transactional(readOnly = true)
	public List<Asignacion> asignacionesDeProyecto(Long proyectoId) {
		servicioProyectos.obtener(proyectoId);
		return asignaciones.findByProyectoIdOrderByFechaAsignacionDesc(proyectoId);
	}

	/** HU-10 C05: equipo de desarrolladores activos del proyecto. */
	@Transactional(readOnly = true)
	public List<Asignacion> equipoDeProyecto(Long proyectoId) {
		servicioProyectos.obtener(proyectoId);
		Long rolId = obtenerRol(null, RolEnProyecto.DESARROLLADOR).getId();
		return asignaciones.findByProyectoIdAndRolIdAndActivaTrue(proyectoId, rolId);
	}

	/** Todas las asignaciones activas de un proyecto, con todos sus roles. */
	@Transactional(readOnly = true)
	public List<Asignacion> equipoCompletoDeProyecto(Long proyectoId) {
		servicioProyectos.obtener(proyectoId);
		return asignaciones.findByProyectoIdAndActivaTrueOrderByFechaAsignacionDesc(proyectoId);
	}

	/** Conteo distinto de integrantes activos para la página de resultados. */
	@Transactional(readOnly = true)
	public Map<Long, Long> conteosActivosPorProyecto(List<Long> proyectoIds) {
		if (proyectoIds.isEmpty()) {
			return Map.of();
		}
		return asignaciones.contarTrabajadoresActivosPorProyecto(proyectoIds).stream()
				.collect(Collectors.toMap(
						fila -> (Long) fila[0],
						fila -> ((Number) fila[1]).longValue()));
	}

	/**
	 * Nivel 2 de autorizacion, para las fases siguientes: comprueba si el
	 * trabajador puede actuar con ese rol en ese proyecto.
	 */
	@Transactional(readOnly = true)
	public boolean puedeActuarComo(Long trabajadorId, Long proyectoId, RolEnProyecto rol) {
		return asignaciones.tieneAsignacionActivaConRol(
				trabajadorId, proyectoId, obtenerRol(null, rol).getId());
	}

	@Transactional(readOnly = true)
	public List<RolResponse> rolesDisponibles() {
		return roles.findAllByOrderByIdAsc().stream().map(RolResponse::de).toList();
	}

	@Transactional(readOnly = true)
	public List<RolEnProyecto> rolesDeTrabajadorEnProyecto(Long trabajadorId, Long proyectoId) {
		servicioTrabajadores.obtener(trabajadorId);
		servicioProyectos.obtener(proyectoId);
		return asignaciones.findByTrabajadorIdAndProyectoIdAndActivaTrue(trabajadorId, proyectoId).stream()
				.map(Asignacion::getRolEnProyecto)
				.distinct()
				.toList();
	}

	public Rol obtenerRol(Long rolId, RolEnProyecto rolAnterior) {
		if (rolId != null) {
			return roles.findById(rolId)
					.orElseThrow(() -> new ReglaNegocioException("El rol indicado no existe."));
		}
		if (rolAnterior != null) {
			return roles.findByNombreRol(rolAnterior.nombreCatalogo())
					.orElseThrow(() -> new IllegalStateException(
							"Falta el rol requerido en el catálogo: " + rolAnterior.nombreCatalogo()));
		}
		throw new ReglaNegocioException("Debe indicar un rol válido.");
	}

	/**
	 * Nivel 2 de lectura: el trabajador participa en el proyecto con cualquier rol.
	 *
	 * <p>La consulta de etapas la usa para que un desarrollador pueda ver las de
	 * SU proyecto: desde D-36 la etapa es la fase que RN-10 le exige indicar al
	 * registrar una incidencia, y sin esta consulta no tendria de donde escogerla.
	 */
	@Transactional(readOnly = true)
	public boolean participaEnProyecto(Long trabajadorId, Long proyectoId) {
		return asignaciones.participaEnProyecto(trabajadorId, proyectoId);
	}

	private void exigirProyectoHabilitado(Proyecto proyecto) {
		if (!proyecto.estaHabilitado()) {
			throw new ReglaNegocioException("El proyecto '" + proyecto.getNombre() + "' esta inhabilitado.");
		}
	}

	private void exigirTrabajadorHabilitado(Trabajador trabajador) {
		if (!trabajador.estaHabilitado()) {
			throw new ReglaNegocioException("El trabajador " + trabajador.nombreCompleto()
					+ " esta inhabilitado porque ya no pertenece a la empresa.");
		}
	}

	/** Resultado de una asignacion por lote, con los exitos y los rechazos. */
	/**
	 * Desarrolladores a los que el lider puede asignar este proyecto ahora
	 * mismo (RF-009, HU-10 C01).
	 *
	 * <p>Excluye a los inhabilitados y a los que ya tienen una asignacion activa
	 * como desarrollador en el proyecto, que son exactamente los dos motivos por
	 * los que {@link #asignarEquipo} los rechazaria. Asi el selector no ofrece lo
	 * que la operacion va a devolver rechazado.
	 *
	 * <p>Existe porque la busqueda de trabajadores esta reservada al coordinador
	 * (RNF-001) y el lider no tiene otra forma de conocer los identificadores que
	 * la asignacion le exige enviar. Entrega solo lo necesario para elegir, sin
	 * abrir el registro completo de perfiles, que es lo que sigue en discusion en
	 * la ambiguedad A-03.
	 */
	@Transactional(readOnly = true)
	public List<Trabajador> candidatosParaEquipo(Long proyectoId) {
		Set<Long> yaEnElEquipo = equipoDeProyecto(proyectoId).stream()
				.map(asignacion -> asignacion.getTrabajador().getId())
				.collect(Collectors.toSet());

		return servicioTrabajadores.habilitadosPorTipo(TipoTrabajador.DESARROLLADOR).stream()
				.filter(desarrollador -> !yaEnElEquipo.contains(desarrollador.getId()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<Trabajador> lideresDisponibles(Long proyectoId) {
		return servicioTrabajadores.habilitadosPorTipo(TipoTrabajador.LIDER);
	}

	@Transactional
	public Proyecto pausarLider(Long proyectoId) {
		Proyecto proyecto = servicioProyectos.obtenerParaAsignacion(proyectoId);
		exigirProyectoHabilitado(proyecto);
		if (proyecto.getLiderResponsable() == null) {
			throw new ReglaNegocioException("El proyecto no tiene un líder asignado.");
		}
		if (proyecto.getEstadoLiderazgo() == EstadoLiderazgo.PAUSADO) {
			throw new ReglaNegocioException("El líder del proyecto ya se encuentra pausado.");
		}
		proyecto.pausarLiderazgo();
		Long rolLiderId = obtenerRol(null, RolEnProyecto.LIDER).getId();
		asignaciones.findFirstByProyectoIdAndRolIdAndActivaTrue(proyectoId, rolLiderId)
				.ifPresent(asig -> {
					asig.setEstadoLiderazgo(EstadoLiderazgo.PAUSADO);
					asignaciones.save(asig);
				});
		return proyecto;
	}

	@Transactional
	public Proyecto reactivarLider(Long proyectoId) {
		Proyecto proyecto = servicioProyectos.obtenerParaAsignacion(proyectoId);
		exigirProyectoHabilitado(proyecto);
		if (proyecto.getLiderResponsable() == null) {
			throw new ReglaNegocioException("El proyecto no tiene un líder asignado.");
		}
		if (proyecto.getEstadoLiderazgo() == EstadoLiderazgo.ACTIVO) {
			throw new ReglaNegocioException("El líder del proyecto ya se encuentra activo.");
		}
		proyecto.reactivarLiderazgo();
		Long rolLiderId = obtenerRol(null, RolEnProyecto.LIDER).getId();
		asignaciones.findFirstByProyectoIdAndRolIdAndActivaTrue(proyectoId, rolLiderId)
				.ifPresent(asig -> {
					asig.setEstadoLiderazgo(EstadoLiderazgo.ACTIVO);
					asignaciones.save(asig);
				});
		return proyecto;
	}

	@Transactional
	public Proyecto cambiarLider(Long proyectoId, Long nuevoLiderId, Trabajador quienRealiza) {
		Proyecto proyecto = servicioProyectos.obtenerParaAsignacion(proyectoId);
		exigirProyectoHabilitado(proyecto);

		if (nuevoLiderId == null) {
			throw new ReglaNegocioException("Debe indicar el nuevo líder del proyecto.");
		}

		Trabajador nuevoLider = servicioTrabajadores.obtener(nuevoLiderId);
		exigirTrabajadorHabilitado(nuevoLider);

		if (nuevoLider.getTipoTrabajador() != TipoTrabajador.LIDER) {
			throw new ReglaNegocioException("El trabajador seleccionado no tiene el tipo Líder de proyectos.");
		}

		Long rolLiderId = obtenerRol(null, RolEnProyecto.LIDER).getId();
		Rol rolLider = roles.findById(rolLiderId).orElseThrow();

		var asignacionAnteriorOpt = asignaciones.findFirstByProyectoIdAndRolIdAndActivaTrue(proyectoId, rolLiderId);
		if (asignacionAnteriorOpt.isPresent()) {
			Asignacion anterior = asignacionAnteriorOpt.get();
			if (anterior.getTrabajador().getId().equals(nuevoLiderId)) {
				proyecto.reactivarLiderazgo();
				anterior.setEstadoLiderazgo(EstadoLiderazgo.ACTIVO);
				asignaciones.save(anterior);
				return proyecto;
			}
			anterior.desactivar();
			asignaciones.save(anterior);
		}

		Asignacion nuevaAsignacion = new Asignacion(nuevoLider, proyecto, rolLider, quienRealiza);
		nuevaAsignacion.setEstadoLiderazgo(EstadoLiderazgo.ACTIVO);
		asignaciones.save(nuevaAsignacion);

		proyecto.setLiderResponsable(nuevoLider);
		proyecto.reactivarLiderazgo();

		return proyecto;
	}

	@Transactional
	public void quitarDesarrollador(Long proyectoId, Long asignacionId) {
		Asignacion asignacion = asignaciones.findById(asignacionId)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe la asignación indicada."));

		if (!asignacion.getProyecto().getId().equals(proyectoId)) {
			throw new ReglaNegocioException("La asignación no corresponde al proyecto indicado.");
		}

		if (asignacion.getRolEnProyecto() == RolEnProyecto.LIDER) {
			throw new ReglaNegocioException("No se puede desvincular al líder del proyecto con esta acción. Utilice Cambiar Líder.");
		}

		asignacion.desactivar();
		asignaciones.save(asignacion);
	}

	public record ResultadoLote(List<Asignacion> asignados, List<DesarrolladorRechazado> rechazados) {
	}

	public record ResultadoAsignacionesCoordinador(
			List<Asignacion> asignadas,
			List<Asignacion> yaExistentes) {
	}

}

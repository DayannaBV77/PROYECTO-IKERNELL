package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Asignacion;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ContextoProyectoRequest;
import com.PROYECTO.IKERNELL.backend.asignaciones.dto.ContextoProyectoResponse;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Gestiona el contexto de proyecto activo para la sesión del trabajador autenticado.
 */
@Service
public class ServicioContextoProyecto {

	private final ServicioProyectos servicioProyectos;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioAsignaciones servicioAsignaciones;
	private final SecurityContextRepository securityContextRepository;

	public ServicioContextoProyecto(ServicioProyectos servicioProyectos,
			ServicioTrabajadores servicioTrabajadores,
			ServicioAsignaciones servicioAsignaciones,
			SecurityContextRepository securityContextRepository) {
		this.servicioProyectos = servicioProyectos;
		this.servicioTrabajadores = servicioTrabajadores;
		this.servicioAsignaciones = servicioAsignaciones;
		this.securityContextRepository = securityContextRepository;
	}

	@Transactional(readOnly = true)
	public ContextoProyectoResponse obtenerContextoActual(TrabajadorAutenticado autenticado) {
		if (autenticado == null) {
			return null;
		}

		Long proyectoId = autenticado.getProyectoActivoId();
		RolEnProyecto rolActivo = autenticado.getRolActivo();

		if (proyectoId == null) {
			if (autenticado.getTipoTrabajador() == TipoTrabajador.COORDINADOR) {
				return new ContextoProyectoResponse(
						null,
						null,
						RolEnProyecto.COORDINADOR,
						null,
						null,
						List.of(RolEnProyecto.COORDINADOR),
						permisosPara(RolEnProyecto.COORDINADOR, TipoTrabajador.COORDINADOR));
			}
			return null;
		}

		Proyecto proyecto = servicioProyectos.obtener(proyectoId);
		List<RolEnProyecto> rolesEnProyecto = servicioAsignaciones
				.rolesDeTrabajadorEnProyecto(autenticado.getTrabajadorId(), proyectoId);

		return new ContextoProyectoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				rolActivo,
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				rolesEnProyecto,
				permisosPara(rolActivo, autenticado.getTipoTrabajador()));
	}

	@Transactional
	public ContextoProyectoResponse cambiarContexto(ContextoProyectoRequest peticion,
			TrabajadorAutenticado autenticado,
			HttpServletRequest request,
			HttpServletResponse response) {

		if (autenticado == null) {
			throw new ReglaNegocioException("No hay una sesión autenticada activa.");
		}

		Trabajador trabajador = servicioTrabajadores.obtener(autenticado.getTrabajadorId());
		if (!trabajador.estaHabilitado()) {
			throw new ReglaNegocioException("El trabajador está inhabilitado porque ya no pertenece a la empresa.");
		}

		Proyecto proyecto = servicioProyectos.obtener(peticion.proyectoId());
		if (!proyecto.estaHabilitado()) {
			throw new ReglaNegocioException("El proyecto '" + proyecto.getNombre() + "' esta inhabilitado.");
		}

		List<RolEnProyecto> rolesEnProyecto = servicioAsignaciones
				.rolesDeTrabajadorEnProyecto(trabajador.getId(), proyecto.getId());

		boolean esCoordinadorGlobal = trabajador.getTipoTrabajador() == TipoTrabajador.COORDINADOR;

		if (rolesEnProyecto.isEmpty() && !esCoordinadorGlobal) {
			throw new ReglaNegocioException(
					"El trabajador no cuenta con una asignación activa en el proyecto '" + proyecto.getNombre() + "'.");
		}

		RolEnProyecto rolElegido;
		if (peticion.rol() != null) {
			if (!rolesEnProyecto.contains(peticion.rol()) && !(esCoordinadorGlobal && peticion.rol() == RolEnProyecto.COORDINADOR)) {
				throw new ReglaNegocioException(
						"El trabajador no tiene el rol " + peticion.rol() + " asignado en el proyecto '" + proyecto.getNombre() + "'.");
			}
			rolElegido = peticion.rol();
		}
		else {
			rolElegido = !rolesEnProyecto.isEmpty() ? rolesEnProyecto.get(0) : RolEnProyecto.COORDINADOR;
		}

		TrabajadorAutenticado actualizado = autenticado.conContextoProyecto(
				proyecto.getId(), proyecto.getNombre(), rolElegido);

		Authentication authActual = SecurityContextHolder.getContext().getAuthentication();
		Object credenciales = (authActual != null) ? authActual.getCredentials() : "n/a";
		Authentication nuevaAuth = new UsernamePasswordAuthenticationToken(
				actualizado, credenciales, actualizado.getAuthorities());

		SecurityContext nuevoContexto = SecurityContextHolder.createEmptyContext();
		nuevoContexto.setAuthentication(nuevaAuth);
		SecurityContextHolder.setContext(nuevoContexto);
		securityContextRepository.saveContext(nuevoContexto, request, response);

		return new ContextoProyectoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				rolElegido,
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				rolesEnProyecto,
				permisosPara(rolElegido, trabajador.getTipoTrabajador()));
	}

	@Transactional
	public ContextoProyectoResponse limpiarContexto(TrabajadorAutenticado autenticado,
			HttpServletRequest request,
			HttpServletResponse response) {
		if (autenticado == null) {
			return null;
		}

		TrabajadorAutenticado actualizado = autenticado.conContextoProyecto(null, null, null);
		Authentication authActual = SecurityContextHolder.getContext().getAuthentication();
		Object credenciales = (authActual != null) ? authActual.getCredentials() : "n/a";
		Authentication nuevaAuth = new UsernamePasswordAuthenticationToken(
				actualizado, credenciales, actualizado.getAuthorities());

		SecurityContext nuevoContexto = SecurityContextHolder.createEmptyContext();
		nuevoContexto.setAuthentication(nuevaAuth);
		SecurityContextHolder.setContext(nuevoContexto);
		securityContextRepository.saveContext(nuevoContexto, request, response);

		return obtenerContextoActual(actualizado);
	}

	public List<String> permisosPara(RolEnProyecto rol, TipoTrabajador tipoGlobal) {
		List<String> permisos = new ArrayList<>();
		permisos.add("SERVICIOS_COMUNES");

		if (tipoGlobal == TipoTrabajador.COORDINADOR || rol == RolEnProyecto.COORDINADOR) {
			permisos.add("GESTION_TRABAJADORES");
			permisos.add("GESTION_ASIGNACIONES");
			permisos.add("REPORTES_DESEMPENO");
			permisos.add("CONTENIDO_ADMIN");
			permisos.add("CONSULTAS_ADMIN");
		}

		if (rol == RolEnProyecto.LIDER) {
			permisos.add("GESTION_PROYECTO");
			permisos.add("GESTION_ETAPAS");
			permisos.add("GESTION_EQUIPO");
			permisos.add("GESTION_ACTIVIDADES");
			permisos.add("REPORTES_PROYECTO");
			permisos.add("ARCHIVO_PLANO");
		}

		if (rol == RolEnProyecto.DESARROLLADOR) {
			permisos.add("MIS_ACTIVIDADES");
			permisos.add("REGISTRO_EJECUCION");
			permisos.add("REGISTRO_INCIDENCIAS");
			permisos.add("CHAT_HILOS");
		}

		return List.copyOf(permisos);
	}

}

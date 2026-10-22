package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Asignacion;
import com.PROYECTO.IKERNELL.backend.asignaciones.domain.RolEnProyecto;

public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {

	/**
	 * Detecta la "asignacion equivalente activa" de RF-003 y HU-06 C04.
	 *
	 * <p>PROPUESTA D-08: se considera equivalente la que coincide en trabajador,
	 * proyecto y rol, y sigue activa. Ningun documento define el criterio.
	 */
	boolean existsByTrabajadorIdAndProyectoIdAndRolEnProyectoAndActivaTrue(
			Long trabajadorId, Long proyectoId, RolEnProyecto rolEnProyecto);

	/** HU-06 C05: consultar las asignaciones de un trabajador. */
	List<Asignacion> findByTrabajadorIdOrderByFechaAsignacionDesc(Long trabajadorId);

	/** HU-06 C05: consultar las asignaciones de un proyecto. */
	List<Asignacion> findByProyectoIdOrderByFechaAsignacionDesc(Long proyectoId);

	/** HU-10 C05: equipo activo del proyecto, filtrado por rol. */
	List<Asignacion> findByProyectoIdAndRolEnProyectoAndActivaTrue(Long proyectoId, RolEnProyecto rolEnProyecto);

	/**
	 * Nivel 2 de autorizacion: el trabajador tiene una asignacion activa con el
	 * rol indicado en ese proyecto, y sigue habilitado en la empresa.
	 *
	 * <p>Es la consulta que resolvera C-06 a partir de la fase 5: permite que un
	 * lider asignado como desarrollador en otro proyecto ejecute actividades y
	 * registre errores alli (RN-05), sin depender de su tipo global.
	 */
	@Query("""
			select count(a) > 0 from Asignacion a
			where a.trabajador.id = :trabajadorId
			  and a.proyecto.id = :proyectoId
			  and a.rolEnProyecto = :rol
			  and a.activa = true
			  and a.trabajador.estado = com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion.HABILITADO
			""")
	boolean tieneAsignacionActivaConRol(@Param("trabajadorId") Long trabajadorId,
			@Param("proyectoId") Long proyectoId, @Param("rol") RolEnProyecto rol);

}

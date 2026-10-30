package com.PROYECTO.IKERNELL.backend.midia;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.midia.domain.TareaMiDia;
import com.PROYECTO.IKERNELL.backend.midia.dto.RegistroTareaMiDiaRequest;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Tareas personales del checklist de «Mi Dia» (RF-038).
 *
 * <p>La autorizacion es la mas simple del sistema: cada operacion busca la
 * tarea por id <b>y</b> por el trabajador de la sesion. No hay roles que
 * comprobar porque una tarea personal no pertenece a ningun proyecto; el
 * unico permiso posible es ser su dueno.
 */
@Service
public class ServicioTareasMiDia {

	private final TareaMiDiaRepository tareas;
	private final ServicioTrabajadores trabajadores;

	public ServicioTareasMiDia(TareaMiDiaRepository tareas, ServicioTrabajadores trabajadores) {
		this.tareas = tareas;
		this.trabajadores = trabajadores;
	}

	/** Tareas del dia, pendientes primero y luego por antiguedad. */
	@Transactional(readOnly = true)
	public List<TareaMiDia> delDia(Long trabajadorId, LocalDate fecha) {
		return tareas.findByTrabajadorIdAndFechaOrderByCompletadaAscCreadaEnAsc(trabajadorId, fecha);
	}

	/**
	 * Agrega una tarea al dia. La fecha ausente se resuelve como hoy, igual que
	 * el reloj del panel: la hora de pared de la aplicacion, no UTC.
	 */
	@Transactional
	public TareaMiDia crear(Long trabajadorId, RegistroTareaMiDiaRequest peticion) {
		String descripcion = peticion.descripcion().trim();
		if (descripcion.isEmpty()) {
			throw new ReglaNegocioException("La tarea debe tener una descripcion.");
		}

		Trabajador trabajador = trabajadores.obtener(trabajadorId);
		LocalDate fecha = peticion.fecha() == null ? LocalDate.now() : peticion.fecha();
		return tareas.save(new TareaMiDia(trabajador, descripcion, fecha));
	}

	/** Alterna pendiente/completada. Solo el dueno puede hacerlo. */
	@Transactional
	public TareaMiDia cambiarEstado(Long tareaId, Long trabajadorId, boolean completada) {
		TareaMiDia tarea = obtenerPropia(tareaId, trabajadorId);
		tarea.cambiarEstado(completada);
		return tareas.save(tarea);
	}

	/** Quita una tarea del panel. Solo el dueno puede hacerlo. */
	@Transactional
	public void eliminar(Long tareaId, Long trabajadorId) {
		tareas.delete(obtenerPropia(tareaId, trabajadorId));
	}

	/**
	 * El mismo 404 para "no existe" y "es de otra persona": distinguirlos
	 * permitiria averiguar que identificadores estan en uso.
	 */
	private TareaMiDia obtenerPropia(Long tareaId, Long trabajadorId) {
		return tareas.findByIdAndTrabajadorId(tareaId, trabajadorId)
				.orElseThrow(() -> new RecursoNoEncontradoException(
						"La tarea no existe o no le pertenece."));
	}

}

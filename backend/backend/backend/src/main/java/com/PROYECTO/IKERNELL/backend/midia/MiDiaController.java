package com.PROYECTO.IKERNELL.backend.midia;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.midia.dto.ActividadDelDiaResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.CambioEstadoTareaRequest;
import com.PROYECTO.IKERNELL.backend.midia.dto.MiDiaResponse;
import com.PROYECTO.IKERNELL.backend.midia.dto.RegistroTareaMiDiaRequest;
import com.PROYECTO.IKERNELL.backend.midia.dto.TareaMiDiaResponse;

import jakarta.validation.Valid;

/**
 * Panel personalizado «Mi Dia» (RF-038) y su checklist interactivo.
 *
 * <p>El GET reune datos de tres modulos -actividades, tareas personales, hilos
 * de conversacion y acceso al correo- y los entrega juntos para que la pantalla
 * de inicio del trabajador no tenga que hacer varias peticiones y combinarlas
 * por su cuenta.
 *
 * <p>Las operaciones de escritura son las del checklist:
 * <ul>
 * <li>{@code POST /tareas}: agrega una tarea personal del dia.
 * <li>{@code PATCH /tareas/{id}}: la marca completada o pendiente.
 * <li>{@code DELETE /tareas/{id}}: la quita del panel.
 * <li>{@code PATCH /actividades/{id}}: marca o desmarca una actividad del
 * sistema. No crea un estado paralelo: finaliza o reabre su ejecucion real
 * (RF-022), que es de donde D-31 deriva "pendiente".
 * </ul>
 *
 * <p>El registro de bloqueos e interrupciones que pide RF-038 NO se duplica
 * aqui: el acceso rapido usa el endpoint que ya existe
 * ({@code POST /api/proyectos/{id}/interrupciones}, RF-024 y HU-18), con sus
 * mismas reglas de autorizacion y validacion.
 *
 * <p>No lleva restriccion por rol. El identificador del trabajador sale de la
 * sesion, nunca de la peticion, asi que no hay forma de leer ni modificar el
 * panel de otra persona. Sobre el tipo, ver {@link ServicioMiDia}: RF-038 nombra
 * al desarrollador, pero el dato que el panel usa es la actividad asignada, y
 * HU-16 C05 (RN-05) incluye al lider al que asignaron como desarrollador en otro
 * proyecto.
 */
@RestController
@RequestMapping("/api/mi-dia")
public class MiDiaController {

	private final ServicioMiDia servicio;
	private final ServicioTareasMiDia servicioTareas;

	public MiDiaController(ServicioMiDia servicio, ServicioTareasMiDia servicioTareas) {
		this.servicio = servicio;
		this.servicioTareas = servicioTareas;
	}

	/** RF-038: actividades, tareas personales, notificaciones y avisos. */
	@GetMapping
	public MiDiaResponse miDia(@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return servicio.panelDe(autenticado.getTrabajadorId());
	}

	/** RF-038: agrega una tarea o recordatorio personal al dia. */
	@PostMapping("/tareas")
	@ResponseStatus(HttpStatus.CREATED)
	public TareaMiDiaResponse crearTarea(@Valid @RequestBody RegistroTareaMiDiaRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return TareaMiDiaResponse.de(
				servicioTareas.crear(autenticado.getTrabajadorId(), peticion));
	}

	/** RF-038: alterna una tarea personal entre pendiente y completada. */
	@PatchMapping("/tareas/{tareaId}")
	public TareaMiDiaResponse cambiarTarea(@PathVariable Long tareaId,
			@Valid @RequestBody CambioEstadoTareaRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return TareaMiDiaResponse.de(servicioTareas.cambiarEstado(
				tareaId, autenticado.getTrabajadorId(), peticion.completada()));
	}

	/** RF-038: elimina una tarea personal del panel. */
	@DeleteMapping("/tareas/{tareaId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminarTarea(@PathVariable Long tareaId,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		servicioTareas.eliminar(tareaId, autenticado.getTrabajadorId());
	}

	/** RF-038: alterna una actividad del sistema entre pendiente y completada. */
	@PatchMapping("/actividades/{actividadId}")
	public ActividadDelDiaResponse cambiarActividad(@PathVariable Long actividadId,
			@Valid @RequestBody CambioEstadoTareaRequest peticion,
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return servicio.cambiarEstadoActividad(
				actividadId, autenticado.getTrabajadorId(), peticion.completada());
	}

}

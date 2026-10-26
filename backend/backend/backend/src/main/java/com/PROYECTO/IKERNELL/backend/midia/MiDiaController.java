package com.PROYECTO.IKERNELL.backend.midia;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.midia.dto.MiDiaResponse;

/**
 * Panel personalizado «Mi Dia» (RF-038).
 *
 * <p>Un solo GET. El panel reune datos de tres modulos -actividades, hilos de
 * conversacion y acceso al correo- y los entrega juntos para que la pantalla de
 * inicio del trabajador no tenga que hacer tres peticiones y combinarlas por su
 * cuenta.
 *
 * <p>No lleva restriccion por rol, y es deliberado: el identificador del
 * trabajador sale de la sesion, nunca de la peticion, asi que no hay forma de
 * pedir el panel de otra persona. Sobre el tipo, ver {@link ServicioMiDia}:
 * RF-038 nombra al desarrollador, pero el dato que el panel usa es la actividad
 * asignada, y HU-16 C05 (RN-05) incluye al lider al que asignaron como
 * desarrollador en otro proyecto.
 *
 * <p>No expone ninguna operacion de escritura. El acceso rapido al registro de
 * bloqueos e interrupciones que pide RF-038 lleva al endpoint que ya existe
 * (RF-024, {@code POST /api/proyectos/{id}/interrupciones}).
 */
@RestController
@RequestMapping("/api/mi-dia")
public class MiDiaController {

	private final ServicioMiDia servicio;

	public MiDiaController(ServicioMiDia servicio) {
		this.servicio = servicio;
	}

	/** RF-038: actividades pendientes del dia, notificaciones y avisos. */
	@GetMapping
	public MiDiaResponse miDia(@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		return servicio.panelDe(autenticado.getTrabajadorId());
	}

}

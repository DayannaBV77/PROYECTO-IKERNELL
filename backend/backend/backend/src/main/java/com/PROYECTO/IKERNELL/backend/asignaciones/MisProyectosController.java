package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.PROYECTO.IKERNELL.backend.asignaciones.dto.MiProyectoResponse;
import com.PROYECTO.IKERNELL.backend.auth.TrabajadorAutenticado;
import com.PROYECTO.IKERNELL.backend.shared.dto.ListaResponse;

/**
 * Proyectos en los que participa el trabajador autenticado.
 *
 * <p>Cubre un VACIO DE REQUISITOS, no un RF nuevo: varias funciones que el
 * trabajador ejerce sobre "sus" proyectos -registrar errores e interrupciones
 * (RF-023, RF-024) y, mas adelante, los hilos de conversacion por proyecto y
 * etapa (RF-037)- le exigen enviar el identificador del proyecto, pero ninguna
 * consulta se lo daba: la busqueda de proyectos esta reservada al lider
 * (RNF-001) y las consultas de asignaciones, al coordinador. Hasta ahora la
 * pantalla de incidencias deducia los proyectos de sus actividades, con lo que
 * un desarrollador recien asignado, sin actividades todavia, no podia elegir el
 * suyo.
 *
 * <p>Mismo criterio que {@code candidatosParaEquipo}: entrega lo justo para
 * elegir -identificador, nombre, estado y el rol propio- sin abrir el modulo de
 * proyectos.
 *
 * <p>No lleva restriccion por rol, y es deliberado: igual que en
 * {@code MisActividadesController}, el permiso no depende del tipo global sino
 * de las asignaciones de quien pregunta, y el identificador del trabajador sale
 * de la sesion, nunca de la peticion. Un trabajador sin asignaciones recibe la
 * lista vacia con su aviso.
 */
@RestController
@RequestMapping("/api/mis-proyectos")
public class MisProyectosController {

	private final ServicioAsignaciones servicio;

	public MisProyectosController(ServicioAsignaciones servicio) {
		this.servicio = servicio;
	}

	/** Proyectos con asignacion activa del trabajador autenticado. */
	@GetMapping
	public ListaResponse<MiProyectoResponse> misProyectos(
			@AuthenticationPrincipal TrabajadorAutenticado autenticado) {
		List<MiProyectoResponse> proyectos = MiProyectoResponse
				.agrupar(servicio.misAsignacionesActivas(autenticado.getTrabajadorId()));
		return ListaResponse.de(proyectos, "No participa en ningun proyecto todavia.");
	}

}

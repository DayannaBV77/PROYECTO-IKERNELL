package com.PROYECTO.IKERNELL.backend.chat;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.asignaciones.ServicioAsignaciones;
import com.PROYECTO.IKERNELL.backend.chat.domain.HiloConversacion;
import com.PROYECTO.IKERNELL.backend.chat.domain.LecturaHilo;
import com.PROYECTO.IKERNELL.backend.chat.domain.MensajeHilo;
import com.PROYECTO.IKERNELL.backend.chat.dto.RegistroHiloRequest;
import com.PROYECTO.IKERNELL.backend.chat.dto.RegistroMensajeRequest;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioEtapas;
import com.PROYECTO.IKERNELL.backend.proyectos.ServicioProyectos;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.shared.error.OperacionNoAutorizadaException;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Reglas de negocio de los hilos de conversacion por proyecto y etapa (RF-037).
 *
 * <p>DECISION D-33, la autorizacion se resuelve en el <b>nivel 2</b>: hace falta
 * una asignacion activa en el proyecto, con CUALQUIER rol. Es lo que dice HU-22 literalmente
 * -"yo como trabajador asignado a un proyecto"- y lo que RF-037 llama "la
 * relacion que tenga con el proyecto". No se comprueba el tipo global, de modo
 * que leer y escribir en un hilo no depende de ser desarrollador o lider sino de
 * estar en ese proyecto.
 *
 * <p>CONSECUENCIA QUE CONVIENE REVISAR: un lider que registro un proyecto pero
 * no tiene asignacion en el queda fuera de sus hilos, porque
 * {@code Proyecto.liderResponsable} todavia no interviene en la autorizacion
 * (A-02 sin resolver). Tampoco entra el coordinador, que no puede tener
 * asignacion: {@code RolEnProyecto} solo admite LIDER y DESARROLLADOR, aunque
 * RF-037 lo nombre entre los actores. Resolver eso excede lo que RF-037 define.
 *
 * <p>DECISION D-32: solo se implementan los hilos contextuales de RF-037, que
 * estan especificados al detalle en HU-22. El chat libre de RF-028
 * -conversaciones individuales, grupos, disponibilidad- queda fuera porque D-12
 * no define sus funciones, y suponerlas seria inventar alcance.
 *
 * <p>Las operaciones no exigen que el proyecto este habilitado. Ninguna regla lo
 * pide y RN-02 manda conservar el historial de un proyecto inhabilitado, del que
 * sus conversaciones forman parte.
 */
@Service
public class ServicioHilos {

	private final HiloRepository hilos;
	private final MensajeHiloRepository mensajes;
	private final LecturaHiloRepository lecturas;
	private final ServicioProyectos servicioProyectos;
	private final ServicioEtapas servicioEtapas;
	private final ServicioTrabajadores servicioTrabajadores;
	private final ServicioAsignaciones servicioAsignaciones;

	public ServicioHilos(HiloRepository hilos, MensajeHiloRepository mensajes,
			LecturaHiloRepository lecturas, ServicioProyectos servicioProyectos,
			ServicioEtapas servicioEtapas, ServicioTrabajadores servicioTrabajadores,
			ServicioAsignaciones servicioAsignaciones) {
		this.hilos = hilos;
		this.mensajes = mensajes;
		this.lecturas = lecturas;
		this.servicioProyectos = servicioProyectos;
		this.servicioEtapas = servicioEtapas;
		this.servicioTrabajadores = servicioTrabajadores;
		this.servicioAsignaciones = servicioAsignaciones;
	}

	/**
	 * HU-22 C01 y C03: hilos del proyecto, o solo los de una etapa suya.
	 *
	 * <p>Cada hilo llega con su total de mensajes y cuantos de ellos no ha leido
	 * quien consulta, que es lo que permite senalar en la lista donde hay algo
	 * nuevo.
	 */
	@Transactional(readOnly = true)
	public List<HiloConResumen> hilosDeProyecto(Long proyectoId, Long etapaId, Long trabajadorId) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);
		exigirRelacionConElProyecto(trabajadorId, proyecto);

		List<HiloConversacion> encontrados = etapaId == null
				? hilos.findByProyectoIdOrderByCreadoEnDesc(proyectoId)
				: hilos.findByProyectoIdAndEtapaIdOrderByCreadoEnDesc(proyectoId, etapaId);

		return encontrados.stream().map(hilo -> resumir(hilo, trabajadorId)).toList();
	}

	/**
	 * RF-037, HU-22 C03: crea un hilo del proyecto o de una de sus etapas.
	 *
	 * <p>Sin {@code etapaId} el hilo es del proyecto. Con etapa, se obtiene con
	 * {@code ServicioEtapas.obtener(proyectoId, etapaId)}, que ya rechaza una de
	 * otro proyecto: asi es imposible crear un hilo cuya etapa pertenezca a un
	 * proyecto distinto del suyo.
	 */
	@Transactional
	public HiloConversacion crearHilo(Long proyectoId, RegistroHiloRequest peticion, Long trabajadorId) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);
		exigirRelacionConElProyecto(trabajadorId, proyecto);

		Etapa etapa = peticion.etapaId() == null
				? null
				: servicioEtapas.obtener(proyectoId, peticion.etapaId());
		Trabajador autor = servicioTrabajadores.obtener(trabajadorId);

		return hilos.save(new HiloConversacion(proyecto, etapa, peticion.titulo(), autor));
	}

	/** El hilo con su resumen, para abrirlo desde la lista. */
	@Transactional(readOnly = true)
	public HiloConResumen obtenerHilo(Long hiloId, Long trabajadorId) {
		HiloConversacion hilo = exigirAcceso(hiloId, trabajadorId);
		return resumir(hilo, trabajadorId);
	}

	/**
	 * HU-22 C05: mensajes registrados del hilo, con autor y fecha.
	 *
	 * <p>Consultarlos deja el hilo por leido hasta el ultimo mensaje entregado, y
	 * no hasta "ahora": asi un mensaje que llegue entre la consulta y la escritura
	 * de la lectura no se da por visto.
	 */
	@Transactional
	public List<MensajeHilo> mensajesDe(Long hiloId, Long trabajadorId) {
		HiloConversacion hilo = exigirAcceso(hiloId, trabajadorId);
		List<MensajeHilo> registrados = mensajes.findByHiloIdOrderByEnviadoEnAsc(hiloId);

		if (!registrados.isEmpty()) {
			marcarLeidoHasta(hilo, trabajadorId,
					registrados.get(registrados.size() - 1).getEnviadoEn());
		}
		return registrados;
	}

	/** RF-037, HU-22 C02: registra el mensaje en el hilo, con su autor y su fecha. */
	@Transactional
	public MensajeHilo enviarMensaje(Long hiloId, RegistroMensajeRequest peticion, Long trabajadorId) {
		HiloConversacion hilo = exigirAcceso(hiloId, trabajadorId);
		Trabajador autor = servicioTrabajadores.obtener(trabajadorId);

		return mensajes.save(new MensajeHilo(hilo, autor, peticion.cuerpo()));
	}

	/**
	 * Total de mensajes sin leer del trabajador en todas sus conversaciones.
	 *
	 * <p>Es el indicador de notificaciones no leidas del chat que RF-038 pide
	 * mostrar en el panel «Mi Dia».
	 *
	 * <p>Se apoya en las piezas que ya existen -las asignaciones activas y el
	 * resumen por hilo- en lugar de una consulta propia con subconsultas
	 * correlacionadas. Hace varias consultas, y es la misma concesion deliberada
	 * que {@link #resumir}: los proyectos de una persona y los hilos de un
	 * proyecto son pocos, y una sola consulta equivalente resultaria bastante mas
	 * opaca por un ahorro que RNF-005 no reclama a esta escala. Si el volumen
	 * crece, este es el punto a cambiar.
	 */
	@Transactional(readOnly = true)
	public long totalNoLeidos(Long trabajadorId) {
		return servicioAsignaciones.misAsignacionesActivas(trabajadorId).stream()
				.map(asignacion -> asignacion.getProyecto().getId())
				.distinct()
				.flatMap(proyectoId -> hilos.findByProyectoIdOrderByCreadoEnDesc(proyectoId).stream())
				.mapToLong(hilo -> resumir(hilo, trabajadorId).noLeidos())
				.sum();
	}

	/**
	 * Hilo al que el trabajador tiene acceso, o el error correspondiente.
	 *
	 * <p>HU-22 C04 pide impedir el acceso de quien no esta autorizado. Se
	 * responde 403 y no 404: el hilo existe y el motivo es el permiso, igual que
	 * hace el registro de incidencias cuando falta la asignacion.
	 */
	private HiloConversacion exigirAcceso(Long hiloId, Long trabajadorId) {
		HiloConversacion hilo = hilos.findById(hiloId)
				.orElseThrow(() -> new RecursoNoEncontradoException(
						"No existe el hilo de conversacion con el id " + hiloId + "."));
		exigirRelacionConElProyecto(trabajadorId, hilo.getProyecto());
		return hilo;
	}

	private void exigirRelacionConElProyecto(Long trabajadorId, Proyecto proyecto) {
		if (!servicioAsignaciones.participaEnProyecto(trabajadorId, proyecto.getId())) {
			throw new OperacionNoAutorizadaException(
					"Solo los trabajadores asignados al proyecto pueden consultar y escribir"
							+ " en sus conversaciones.");
		}
	}

	/**
	 * Cuenta los mensajes del hilo y los que quien consulta no ha leido.
	 *
	 * <p>Sin registro de lectura no ha leido ninguno. Los mensajes propios nunca
	 * cuentan como no leidos.
	 *
	 * <p>Hace dos consultas por hilo. Es deliberado: los hilos de un proyecto son
	 * pocos y la alternativa -una sola consulta con subconsulta correlacionada-
	 * seria bastante mas opaca por un ahorro que RNF-005 no reclama a esta escala.
	 */
	private HiloConResumen resumir(HiloConversacion hilo, Long trabajadorId) {
		long total = mensajes.countByHiloId(hilo.getId());
		long noLeidos = lecturas.findByHiloIdAndTrabajadorId(hilo.getId(), trabajadorId)
				.map(lectura -> mensajes.countByHiloIdAndAutorIdNotAndEnviadoEnAfter(
						hilo.getId(), trabajadorId, lectura.getLeidoHasta()))
				.orElseGet(() -> mensajes.countByHiloIdAndAutorIdNot(hilo.getId(), trabajadorId));

		return new HiloConResumen(hilo, total, noLeidos);
	}

	private void marcarLeidoHasta(HiloConversacion hilo, Long trabajadorId, LocalDateTime instante) {
		lecturas.findByHiloIdAndTrabajadorId(hilo.getId(), trabajadorId)
				.ifPresentOrElse(
						lectura -> {
							// Nunca retrocede: consultar un hilo no "desmarca" lo ya leido.
							if (lectura.getLeidoHasta().isBefore(instante)) {
								lectura.marcarLeidoHasta(instante);
							}
						},
						() -> lecturas.save(new LecturaHilo(hilo,
								servicioTrabajadores.obtener(trabajadorId), instante)));
	}

	/** Un hilo con los conteos que la lista necesita mostrar. */
	public record HiloConResumen(HiloConversacion hilo, long totalMensajes, long noLeidos) {
	}

}

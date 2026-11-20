package com.PROYECTO.IKERNELL.backend.chat;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Politica de depuracion automatica (TTL) para mensajes del chat corporativo.
 *
 * <p>Elimina permanentemente cualquier mensaje cuya antiguedad supere el umbral
 * configurado (por defecto 30 dias), apoyandose en el indice
 * {@code ix_mensaje_hilo_enviado_en} para evitar bloqueos por escaneo completo.
 */
@Service
public class ServicioDepuracionMensajes {

	private static final Logger log = LoggerFactory.getLogger(ServicioDepuracionMensajes.class);

	private final MensajeHiloRepository mensajes;
	private final int retencionDias;

	public ServicioDepuracionMensajes(
			MensajeHiloRepository mensajes,
			@Value("${ikernell.chat.retencion-dias:30}") int retencionDias) {
		this.mensajes = mensajes;
		this.retencionDias = Math.max(1, retencionDias);
	}

	/**
	 * Tarea programada diaria (03:00 AM por defecto) que depura los mensajes
	 * expirados segun la ventana de retencion configurada.
	 */
	@Scheduled(cron = "${ikernell.chat.purga-cron:0 0 3 * * *}")
	@Transactional
	public void ejecutarPurgaProgramada() {
		int eliminados = purgarMensajesExpirados();
		if (eliminados > 0) {
			log.info("Depuracion automatica del chat: {} mensaje(s) con mas de {} dias eliminados.",
					eliminados, retencionDias);
		} else {
			log.debug("Depuracion automatica del chat: sin mensajes expirados (TTL {} dias).",
					retencionDias);
		}
	}

	/**
	 * Ejecuta la eliminacion de todos los mensajes enviados antes de
	 * {@code ahora - retencionDias}.
	 *
	 * @return cantidad de registros eliminados
	 */
	@Transactional
	public int purgarMensajesExpirados() {
		LocalDateTime corte = LocalDateTime.now()
				.minusDays(retencionDias)
				.truncatedTo(ChronoUnit.MICROS);
		return mensajes.eliminarAnterioresA(corte);
	}

}

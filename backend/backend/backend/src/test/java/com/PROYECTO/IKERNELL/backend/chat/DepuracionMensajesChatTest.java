package com.PROYECTO.IKERNELL.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.chat.domain.HiloConversacion;
import com.PROYECTO.IKERNELL.backend.chat.domain.MensajeHilo;
import com.PROYECTO.IKERNELL.backend.proyectos.ProyectoRepository;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

import jakarta.persistence.EntityManager;

/**
 * Verificacion de la politica de retencion de 30 dias para mensajes del chat.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DepuracionMensajesChatTest {

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	@Autowired
	private ProyectoRepository proyectos;

	@Autowired
	private HiloRepository hilos;

	@Autowired
	private MensajeHiloRepository mensajes;

	@Autowired
	private ServicioDepuracionMensajes servicioDepuracion;

	@Autowired
	private EntityManager entityManager;

	@Test
	@DisplayName("Purga unicamente mensajes con mas de 30 dias y conserva los recientes")
	void purgaMensajesExpiradosConservaRecientes() {
		AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"9499000001", "purga.chat@ikernell.com", TipoTrabajador.LIDER);
		Trabajador autor = trabajadores.findByIdentificacion("9499000001").orElseThrow();
		Proyecto proyecto = proyectos.saveAndFlush(
				new Proyecto("Proyecto TTL Chat", "Prueba de retencion", autor));
		HiloConversacion hilo = hilos.saveAndFlush(
				new HiloConversacion(proyecto, null, "Hilo de prueba TTL", autor));

		MensajeHilo expirado = mensajes.saveAndFlush(
				new MensajeHilo(hilo, autor, "Mensaje antiguo de hace 35 dias"));
		MensajeHilo limiteReciente = mensajes.saveAndFlush(
				new MensajeHilo(hilo, autor, "Mensaje de hace 29 dias"));
		MensajeHilo hoy = mensajes.saveAndFlush(
				new MensajeHilo(hilo, autor, "Mensaje reciente de hoy"));

		LocalDateTime hace35Dias = LocalDateTime.now().minusDays(35).truncatedTo(ChronoUnit.MICROS);
		LocalDateTime hace29Dias = LocalDateTime.now().minusDays(29).truncatedTo(ChronoUnit.MICROS);

		entityManager.createNativeQuery("UPDATE mensaje_hilo SET enviado_en = :fecha WHERE id = :id")
				.setParameter("fecha", hace35Dias)
				.setParameter("id", expirado.getId())
				.executeUpdate();
		entityManager.createNativeQuery("UPDATE mensaje_hilo SET enviado_en = :fecha WHERE id = :id")
				.setParameter("fecha", hace29Dias)
				.setParameter("id", limiteReciente.getId())
				.executeUpdate();
		entityManager.flush();
		entityManager.clear();

		int eliminados = servicioDepuracion.purgarMensajesExpirados();

		assertThat(eliminados).isGreaterThanOrEqualTo(1);
		assertThat(mensajes.findById(expirado.getId())).isEmpty();
		assertThat(mensajes.findById(limiteReciente.getId())).isPresent();
		assertThat(mensajes.findById(hoy.getId())).isPresent();
	}

}

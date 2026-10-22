package com.PROYECTO.IKERNELL.backend.trabajadores;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Restricciones del perfil del trabajador verificadas contra el esquema real
 * creado por Flyway (RN-01, RN-02, RNF-003).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TrabajadorRepositoryTest {

	@Autowired
	private TrabajadorRepository trabajadores;

	private Trabajador nuevoTrabajador(String identificacion) {
		return new Trabajador(identificacion, "Carlos", "Gomez", LocalDate.of(1992, 3, 15),
				"Carrera 10 # 20-30", "Ingenieria de software", "Frontend", TipoTrabajador.DESARROLLADOR);
	}

	@Test
	@DisplayName("RN-01: la base de datos rechaza dos trabajadores con la misma identificacion")
	void identificacionDuplicadaEsRechazada() {
		trabajadores.saveAndFlush(nuevoTrabajador("3000000001"));

		assertThatThrownBy(() -> trabajadores.saveAndFlush(nuevoTrabajador("3000000001")))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	@DisplayName("RN-01: existsByIdentificacion detecta el duplicado antes de intentar guardar")
	void existePorIdentificacion() {
		trabajadores.saveAndFlush(nuevoTrabajador("3000000002"));

		assertThat(trabajadores.existsByIdentificacion("3000000002")).isTrue();
		assertThat(trabajadores.existsByIdentificacion("9999999999")).isFalse();
	}

	@Test
	@DisplayName("RF-001: el trabajador queda habilitado al registrarse")
	void elTrabajadorNaceHabilitado() {
		Trabajador guardado = trabajadores.saveAndFlush(nuevoTrabajador("3000000003"));

		assertThat(guardado.getEstado()).isEqualTo(EstadoHabilitacion.HABILITADO);
		assertThat(guardado.estaHabilitado()).isTrue();
	}

	@Test
	@DisplayName("RN-02: inhabilitar cambia el estado sin borrar el registro")
	void inhabilitarConservaElRegistro() {
		Trabajador guardado = trabajadores.saveAndFlush(nuevoTrabajador("3000000004"));
		Long id = guardado.getId();

		guardado.inhabilitar();
		trabajadores.saveAndFlush(guardado);

		Trabajador recuperado = trabajadores.findById(id).orElseThrow();
		assertThat(recuperado.getEstado()).isEqualTo(EstadoHabilitacion.INHABILITADO);
		assertThat(recuperado.estaHabilitado()).isFalse();
		// El historial sigue disponible: el perfil no se elimino.
		assertThat(recuperado.getIdentificacion()).isEqualTo("3000000004");
	}

	@Test
	@DisplayName("RF-002: el perfil se puede guardar sin fotografia (HU-04 C05)")
	void elPerfilSeGuardaSinFotografia() {
		Trabajador guardado = trabajadores.saveAndFlush(nuevoTrabajador("3000000005"));

		assertThat(guardado.getFotoRuta()).isNull();
	}

}

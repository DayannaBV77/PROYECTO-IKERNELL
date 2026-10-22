package com.PROYECTO.IKERNELL.backend.proyectos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasEtapa;
import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasProyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.RegistroEtapaRequest;
import com.PROYECTO.IKERNELL.backend.shared.error.ConfirmacionRequeridaException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/**
 * Verifica el <b>mecanismo</b> de las dos reglas que todavia no se pueden probar
 * con datos reales, porque las entidades de las que dependen no existen aun:
 * RN-08 (no eliminar una etapa con registros asociados, HU-11 C05) y las
 * advertencias previas a inhabilitar un proyecto (HU-09 C05).
 *
 * <p>Se registran verificadores simulados para comprobar que, cuando existan los
 * reales, el bloqueo y la advertencia funcionaran. Sin esto, HU-11 C05 quedaria
 * escrita pero sin ninguna evidencia de que opera.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BloqueoEliminacionEtapaTest {

	@TestConfiguration
	static class VerificadoresSimulados {

		@Bean
		VerificadorDependenciasEtapa etapaConActividadesSimuladas() {
			return etapaId -> Optional.of("la etapa tiene 3 actividades asociadas.");
		}

		@Bean
		VerificadorDependenciasProyecto proyectoConPendientesSimulados() {
			return proyectoId -> List.of("El proyecto tiene 2 actividades pendientes.");
		}

	}

	@Autowired
	private ServicioEtapas servicioEtapas;

	@Autowired
	private ServicioProyectos servicioProyectos;

	@Autowired
	private ProyectoRepository proyectos;

	@Autowired
	private EtapaRepository etapas;

	private Proyecto proyecto;

	@BeforeEach
	void prepararDatos() {
		this.proyecto = proyectos.saveAndFlush(new Proyecto("Proyecto con dependencias", "d", null));
	}

	@Test
	@DisplayName("HU-11 C05: con registros asociados la etapa no se elimina y se explica el motivo")
	void noEliminaEtapaConDependencias() {
		Etapa etapa = servicioEtapas.registrar(proyecto.getId(),
				new RegistroEtapaRequest("Analisis", "d", 1));

		assertThatThrownBy(() -> servicioEtapas.eliminar(proyecto.getId(), etapa.getId()))
				.isInstanceOf(ReglaNegocioException.class)
				.hasMessageContaining("3 actividades asociadas");

		// La informacion historica se conserva: la etapa sigue ahi.
		assertThat(etapas.findById(etapa.getId())).isPresent();
	}

	@Test
	@DisplayName("HU-09 C05: con advertencias y sin confirmar, el proyecto no se inhabilita")
	void noInhabilitaSinConfirmacion() {
		assertThatThrownBy(() -> servicioProyectos.inhabilitar(proyecto.getId(), false))
				.isInstanceOf(ConfirmacionRequeridaException.class);

		// Nada cambio: sigue habilitado.
		assertThat(proyectos.findById(proyecto.getId()).orElseThrow().estaHabilitado()).isTrue();
	}

	@Test
	@DisplayName("HU-09 C05: al confirmar, el proyecto se inhabilita pese a las advertencias")
	void inhabilitaCuandoSeConfirma() {
		Proyecto resultado = servicioProyectos.inhabilitar(proyecto.getId(), true);

		assertThat(resultado.estaHabilitado()).isFalse();
	}

	@Test
	@DisplayName("HU-09 C05: las advertencias se pueden consultar antes de decidir")
	void devuelveLasAdvertenciasParaRevisarlas() {
		List<String> advertencias = servicioProyectos.advertenciasAntesDeInhabilitar(proyecto.getId());

		assertThat(advertencias).containsExactly("El proyecto tiene 2 actividades pendientes.");
	}

}

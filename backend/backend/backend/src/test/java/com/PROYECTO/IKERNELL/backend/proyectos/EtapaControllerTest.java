package com.PROYECTO.IKERNELL.backend.proyectos;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.support.AutenticacionDePrueba;
import com.PROYECTO.IKERNELL.backend.trabajadores.TrabajadorRepository;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;

/** Gestion de etapas: una prueba por condicion de aceptacion de HU-11. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EtapaControllerTest {

	@Autowired
	private WebApplicationContext contexto;

	@Autowired
	private TrabajadorRepository trabajadores;

	@Autowired
	private CuentaAccesoRepository cuentas;

	private MockMvc mockMvc;
	private Authentication lider;
	private Long proyectoId;

	@BeforeEach
	void prepararEntorno() throws Exception {
		this.mockMvc = MockMvcBuilders.webAppContextSetup(contexto)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		this.lider = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"6000000001", "lider.etapas@ikernell.com", TipoTrabajador.LIDER);

		String respuesta = mockMvc.perform(post("/api/proyectos").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Proyecto con etapas\",\"descripcion\":\"\"}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		this.proyectoId = Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	private Long registrarEtapa(String nombre, Integer orden) throws Exception {
		String respuesta = mockMvc.perform(post("/api/proyectos/" + proyectoId + "/etapas")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"" + nombre + "\",\"descripcion\":\"d\",\"orden\":" + orden + "}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return Long.valueOf(respuesta.replaceAll(".*\"id\":(\\d+).*", "$1"));
	}

	@Test
	@DisplayName("HU-11 C01: la etapa se guarda asociada al proyecto elegido")
	void registraLaEtapaAsociadaAlProyecto() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyectoId + "/etapas")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Analisis\",\"descripcion\":\"Levantamiento\",\"orden\":1}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").exists())
				.andExpect(jsonPath("$.proyectoId").value(proyectoId))
				.andExpect(jsonPath("$.nombre").value("Analisis"));
	}

	@Test
	@DisplayName("HU-11 C02: sin nombre no guarda e indica el dato faltante")
	void rechazaEtapaSinNombre() throws Exception {
		mockMvc.perform(post("/api/proyectos/" + proyectoId + "/etapas")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"\",\"descripcion\":\"d\",\"orden\":1}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.nombre").exists());
	}

	@Test
	@DisplayName("HU-11 C03: al modificar, la etapa sigue asociada al mismo proyecto")
	void modificaConservandoElProyecto() throws Exception {
		Long etapaId = registrarEtapa("Diseno", 1);

		mockMvc.perform(put("/api/proyectos/" + proyectoId + "/etapas/" + etapaId)
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Diseno detallado\",\"descripcion\":\"Ajustada\",\"orden\":2}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nombre").value("Diseno detallado"))
				.andExpect(jsonPath("$.orden").value(2))
				.andExpect(jsonPath("$.proyectoId").value(proyectoId));
	}

	@Test
	@DisplayName("HU-11 C04: una etapa sin registros asociados se elimina")
	void eliminaEtapaSinDependencias() throws Exception {
		Long etapaId = registrarEtapa("Etapa temporal", 1);

		mockMvc.perform(delete("/api/proyectos/" + proyectoId + "/etapas/" + etapaId)
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/proyectos/" + proyectoId + "/etapas/" + etapaId)
				.with(authentication(lider)))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("HU-11: las etapas se listan en el orden definido")
	void listaLasEtapasOrdenadas() throws Exception {
		registrarEtapa("Pruebas", 3);
		registrarEtapa("Analisis", 1);
		registrarEtapa("Desarrollo", 2);

		mockMvc.perform(get("/api/proyectos/" + proyectoId + "/etapas").with(authentication(lider)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3))
				.andExpect(jsonPath("$[0].nombre").value("Analisis"))
				.andExpect(jsonPath("$[2].nombre").value("Pruebas"));
	}

	@Test
	@DisplayName("RF-010: no se admiten dos etapas con el mismo nombre en un proyecto")
	void rechazaEtapaDuplicadaEnElMismoProyecto() throws Exception {
		registrarEtapa("Analisis", 1);

		mockMvc.perform(post("/api/proyectos/" + proyectoId + "/etapas")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"analisis\",\"descripcion\":\"d\",\"orden\":2}"))
				.andExpect(status().isConflict());
	}

	@Test
	@DisplayName("RF-010: no se puede registrar una etapa en un proyecto inexistente")
	void rechazaEtapaEnProyectoInexistente() throws Exception {
		mockMvc.perform(post("/api/proyectos/999999/etapas")
				.with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Analisis\",\"descripcion\":\"d\",\"orden\":1}"))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("RF-012: una etapa de otro proyecto no se elimina desde este")
	void noEliminaEtapaDeOtroProyecto() throws Exception {
		Long etapaId = registrarEtapa("Etapa propia", 1);

		String otro = mockMvc.perform(post("/api/proyectos").with(csrf()).with(authentication(lider))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Otro proyecto\",\"descripcion\":\"\"}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		Long otroProyectoId = Long.valueOf(otro.replaceAll(".*\"id\":(\\d+).*", "$1"));

		mockMvc.perform(delete("/api/proyectos/" + otroProyectoId + "/etapas/" + etapaId)
				.with(csrf()).with(authentication(lider)))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("HU-11: un desarrollador no puede gestionar etapas")
	void unDesarrolladorNoGestionaEtapas() throws Exception {
		Authentication desarrollador = AutenticacionDePrueba.comoTrabajador(trabajadores, cuentas,
				"6000000002", "dev.etapas@ikernell.com", TipoTrabajador.DESARROLLADOR);

		mockMvc.perform(post("/api/proyectos/" + proyectoId + "/etapas")
				.with(csrf()).with(authentication(desarrollador))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"nombre\":\"Analisis\",\"descripcion\":\"d\",\"orden\":1}"))
				.andExpect(status().isForbidden());
	}

}

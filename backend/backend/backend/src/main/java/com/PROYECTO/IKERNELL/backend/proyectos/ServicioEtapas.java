package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasEtapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Etapa;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.RegistroEtapaRequest;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;

/** Reglas de negocio de la gestion de etapas (RF-010, RF-011, RF-012). */
@Service
public class ServicioEtapas {

	private final EtapaRepository etapas;
	private final ServicioProyectos servicioProyectos;
	private final List<VerificadorDependenciasEtapa> verificadores;

	public ServicioEtapas(EtapaRepository etapas, ServicioProyectos servicioProyectos,
			List<VerificadorDependenciasEtapa> verificadores) {
		this.etapas = etapas;
		this.servicioProyectos = servicioProyectos;
		this.verificadores = verificadores;
	}

	/**
	 * Registra una etapa en un proyecto existente (RF-010, HU-11 C01).
	 *
	 * <p>Comprueba que el proyecto exista, como exige RF-010: si no existe, el
	 * servicio de proyectos lanza el 404 correspondiente.
	 */
	@Transactional
	public Etapa registrar(Long proyectoId, RegistroEtapaRequest peticion) {
		Proyecto proyecto = servicioProyectos.obtener(proyectoId);
		if (etapas.existsByProyectoIdAndNombreIgnoreCase(proyectoId, peticion.nombre())) {
			throw new ReglaNegocioException(
					"El proyecto ya tiene una etapa llamada '" + peticion.nombre() + "'.");
		}
		return etapas.save(new Etapa(proyecto, peticion.nombre(), peticion.descripcion(), peticion.orden()));
	}

	/** Lista las etapas del proyecto, desde donde se elige la que se va a modificar o eliminar (HU-11 T3). */
	@Transactional(readOnly = true)
	public List<Etapa> listar(Long proyectoId) {
		servicioProyectos.obtener(proyectoId);
		return etapas.findByProyectoIdOrderByOrdenAscNombreAsc(proyectoId);
	}

	@Transactional(readOnly = true)
	public Etapa obtener(Long proyectoId, Long etapaId) {
		return etapas.findByIdAndProyectoId(etapaId, proyectoId)
				.orElseThrow(() -> new RecursoNoEncontradoException(
						"No existe la etapa " + etapaId + " en el proyecto " + proyectoId + "."));
	}

	/**
	 * Modifica una etapa (RF-011, HU-11 C03).
	 *
	 * <p>La etapa sigue asociada al mismo proyecto: la relacion no es modificable.
	 */
	@Transactional
	public Etapa modificar(Long proyectoId, Long etapaId, RegistroEtapaRequest peticion) {
		Etapa etapa = obtener(proyectoId, etapaId);
		if (!etapa.getNombre().equalsIgnoreCase(peticion.nombre())
				&& etapas.existsByProyectoIdAndNombreIgnoreCase(proyectoId, peticion.nombre())) {
			throw new ReglaNegocioException(
					"El proyecto ya tiene una etapa llamada '" + peticion.nombre() + "'.");
		}
		etapa.setNombre(peticion.nombre());
		etapa.setDescripcion(peticion.descripcion());
		etapa.setOrden(peticion.orden());
		return etapas.save(etapa);
	}

	/**
	 * Elimina una etapa (RF-012, HU-11 C04 y C05).
	 *
	 * <p>RN-08: si tiene actividades o registros asociados no se elimina, para no
	 * perder la informacion historica del proyecto. La comprobacion delega en los
	 * verificadores registrados.
	 *
	 * <p>Hay tres verificadores registrados, y entre los cuatro tipos de registro
	 * que dependen de una etapa cubren HU-11 C05 con datos reales: actividades
	 * (RF-019), errores e interrupciones -desde D-36, que hizo de la fase una
	 * etapa- y hilos de conversacion (RF-037). Un modulo nuevo que dependa de la
	 * etapa solo tiene que registrar su propio verificador; este servicio no se
	 * modifica.
	 */
	@Transactional
	public void eliminar(Long proyectoId, Long etapaId) {
		Etapa etapa = obtener(proyectoId, etapaId);
		for (VerificadorDependenciasEtapa verificador : verificadores) {
			Optional<String> dependencia = verificador.dependenciaQueImpideEliminar(etapaId);
			if (dependencia.isPresent()) {
				throw new ReglaNegocioException("No se puede eliminar la etapa: " + dependencia.get());
			}
		}
		etapas.delete(etapa);
	}

}

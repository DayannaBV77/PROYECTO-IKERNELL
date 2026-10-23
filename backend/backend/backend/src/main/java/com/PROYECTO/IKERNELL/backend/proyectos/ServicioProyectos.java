package com.PROYECTO.IKERNELL.backend.proyectos;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.ProveedorDatosAvance;
import com.PROYECTO.IKERNELL.backend.proyectos.dependencias.VerificadorDependenciasProyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.domain.Proyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.CriteriosBusquedaProyecto;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.EstadoProyectoResponse;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.ModificacionProyectoRequest;
import com.PROYECTO.IKERNELL.backend.proyectos.dto.RegistroProyectoRequest;
import com.PROYECTO.IKERNELL.backend.shared.error.ConfirmacionRequeridaException;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/** Reglas de negocio de la gestion de proyectos (RF-008, RF-013 a RF-016). */
@Service
public class ServicioProyectos {

	/**
	 * Lo que haria falta para calcular el avance que pide RF-016. Se devuelve al
	 * cliente en la consulta de estado para que la ausencia de porcentaje quede
	 * explicada y no parezca un defecto.
	 */
	private static final List<String> DATOS_PENDIENTES_PARA_AVANCE = List.of(
			"Los estados posibles de una actividad (D-04).",
			"La formula de avance: por actividades cerradas, por etapas o ponderada (D-03).",
			"Si las etapas tienen peso relativo (D-03).",
			"Los valores posibles del estado operativo del proyecto (D-03).");

	/** Los dos registros que HU-12 C02 nombra para decidir si hay datos de avance. */
	private static final List<String> CONTEOS_QUE_DEFINEN_AVANCE = List.of(
			"etapasRegistradas", "actividadesRegistradas");

	private final ProyectoRepository proyectos;
	private final EtapaRepository etapas;
	private final List<VerificadorDependenciasProyecto> verificadores;
	private final List<ProveedorDatosAvance> proveedoresDeAvance;

	public ServicioProyectos(ProyectoRepository proyectos, EtapaRepository etapas,
			List<VerificadorDependenciasProyecto> verificadores,
			List<ProveedorDatosAvance> proveedoresDeAvance) {
		this.proyectos = proyectos;
		this.etapas = etapas;
		this.verificadores = verificadores;
		this.proveedoresDeAvance = proveedoresDeAvance;
	}

	/**
	 * Registra un proyecto (RF-008, HU-08 C01).
	 *
	 * <p>Queda habilitado y disponible para asignar desarrolladores y registrar
	 * etapas (HU-08 C04). El identificador unico lo genera la base de datos
	 * (RN-09, HU-08 C03).
	 *
	 * @param lider lider que lo registra; se guarda como responsable, dato que
	 *              todavia no se usa para autorizar (A-02 sin resolver)
	 */
	@Transactional
	public Proyecto registrar(RegistroProyectoRequest peticion, Trabajador lider) {
		return proyectos.save(new Proyecto(peticion.nombre(), peticion.descripcion(), lider));
	}

	/** RF-013, HU-09 C01 y C02. */
	@Transactional(readOnly = true)
	public Page<Proyecto> buscar(CriteriosBusquedaProyecto criterios, Pageable paginacion) {
		return proyectos.findAll(ProyectoSpecifications.desde(criterios), paginacion);
	}

	@Transactional(readOnly = true)
	public Proyecto obtener(Long id) {
		return proyectos.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe un proyecto con el id " + id + "."));
	}

	/**
	 * RF-014, HU-09 C03: modifica el proyecto.
	 *
	 * <p>Sus etapas y actividades siguen asociadas a el porque la modificacion no
	 * toca esas relaciones; nada en esta operacion las puede desvincular.
	 */
	@Transactional
	public Proyecto modificar(Long id, ModificacionProyectoRequest peticion) {
		Proyecto proyecto = obtener(id);
		proyecto.setNombre(peticion.nombre());
		proyecto.setDescripcion(peticion.descripcion());
		return proyectos.save(proyecto);
	}

	/** Advertencias a mostrar antes de inhabilitar (HU-09 C05). */
	@Transactional(readOnly = true)
	public List<String> advertenciasAntesDeInhabilitar(Long id) {
		obtener(id);
		List<String> advertencias = new ArrayList<>();
		for (VerificadorDependenciasProyecto verificador : verificadores) {
			advertencias.addAll(verificador.advertenciasAntesDeInhabilitar(id));
		}
		return advertencias;
	}

	/**
	 * RF-015, HU-09 C05: inhabilita el proyecto conservando su historial.
	 *
	 * <p>Si hay advertencias y no se confirmo, no modifica nada y pide
	 * confirmacion. Hoy no hay reglas de advertencia registradas porque HU-09 T5
	 * deja a la empresa definir que casos cuentan como "actividades pendientes o
	 * dependencias"; el mecanismo esta listo para cuando se definan.
	 */
	@Transactional
	public Proyecto inhabilitar(Long id, boolean confirmado) {
		Proyecto proyecto = obtener(id);
		if (!proyecto.estaHabilitado()) {
			throw new ReglaNegocioException("El proyecto ya se encuentra inhabilitado.");
		}
		List<String> advertencias = advertenciasAntesDeInhabilitar(id);
		if (!advertencias.isEmpty() && !confirmado) {
			throw new ConfirmacionRequeridaException(
					"El proyecto tiene dependencias. Revise las advertencias y confirme para continuar.",
					advertencias);
		}
		proyecto.inhabilitar();
		return proyectos.save(proyecto);
	}

	/**
	 * RF-016, HU-12: estado registrado y datos de avance disponibles.
	 *
	 * <p>Devuelve conteos crudos, no un porcentaje. El aviso de HU-12 C02 aparece
	 * cuando todavia no hay nada de lo que derivar un avance. Un proyecto
	 * inhabilitado se consulta igual y conserva su informacion (HU-12 C03).
	 */
	@Transactional(readOnly = true)
	public EstadoProyectoResponse consultarEstado(Long id) {
		Proyecto proyecto = obtener(id);

		Map<String, Long> datosDisponibles = new LinkedHashMap<>();
		datosDisponibles.put("etapasRegistradas", etapas.countByProyectoId(id));
		for (ProveedorDatosAvance proveedor : proveedoresDeAvance) {
			datosDisponibles.putAll(proveedor.conteosPara(id));
		}

		// HU-12 C02 nombra exactamente dos registros: un proyecto que "todavia no
		// tiene etapas ni actividades registradas". El aviso se decide solo con
		// esos dos; los demas conteos acompanan como contexto, pero un proyecto
		// con una interrupcion y nada mas sigue sin datos de avance.
		boolean sinDatos = CONTEOS_QUE_DEFINEN_AVANCE.stream()
				.allMatch(clave -> datosDisponibles.getOrDefault(clave, 0L) == 0L);
		String mensajeAvance = sinDatos
				? "El proyecto aun no tiene datos de avance registrados."
				: null;

		return new EstadoProyectoResponse(
				proyecto.getId(),
				proyecto.getNombre(),
				proyecto.getEstadoHabilitacion(),
				proyecto.getEstadoOperativo(),
				datosDisponibles,
				mensajeAvance,
				DATOS_PENDIENTES_PARA_AVANCE);
	}

	/**
	 * Proyectos habilitados, para elegir uno al asignar un trabajador
	 * (RF-003, HU-06 C01).
	 *
	 * <p>Sin paginar: el conjunto es acotado y quien asigna necesita la lista
	 * completa para escoger. Solo los habilitados, porque asignar a uno
	 * inhabilitado lo rechaza la propia operacion (C02).
	 */
	@Transactional(readOnly = true)
	public List<Proyecto> habilitados() {
		return proyectos.findByEstadoHabilitacionOrderByNombreAsc(EstadoHabilitacion.HABILITADO);
	}

}

package com.PROYECTO.IKERNELL.backend.trabajadores;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.CriteriosBusquedaTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.ModificacionTrabajadorRequest;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.RegistroTrabajadorRequest;

/**
 * Reglas de negocio de la gestion de trabajadores (RF-001, RF-002, RF-004,
 * RF-005, RF-007).
 *
 * <p>No incluye RF-006 (reporte de desempeno): necesita las actividades, que
 * aun no existen en el modelo, y los indicadores de desempeno siguen sin
 * definir (D-09). Se implementara con el resto de los reportes.
 *
 * <p>Tampoco incluye RF-003 (asignar trabajador a proyecto): requiere la
 * entidad Proyecto.
 */
@Service
public class ServicioTrabajadores {

	private final TrabajadorRepository trabajadores;
	private final AlmacenFotografias almacenFotografias;

	public ServicioTrabajadores(TrabajadorRepository trabajadores, AlmacenFotografias almacenFotografias) {
		this.trabajadores = trabajadores;
		this.almacenFotografias = almacenFotografias;
	}

	/**
	 * Registra un perfil nuevo (RF-001, HU-04 C01).
	 *
	 * <p>La identificacion duplicada se comprueba antes de guardar para poder dar
	 * el mensaje concreto de HU-04 C03. La restriccion UNIQUE de la tabla sigue
	 * siendo la garantia final ante dos registros simultaneos.
	 */
	@Transactional
	public Trabajador registrar(RegistroTrabajadorRequest peticion) {
		if (trabajadores.existsByIdentificacion(peticion.identificacion())) {
			throw new ReglaNegocioException("La identificacion " + peticion.identificacion() + " ya esta registrada.");
		}
		Trabajador trabajador = new Trabajador(
				peticion.identificacion(),
				peticion.nombre(),
				peticion.apellido(),
				peticion.fechaNacimiento(),
				peticion.direccion(),
				peticion.profesion(),
				peticion.especialidadDesarrollo(),
				peticion.tipoTrabajador());
		return trabajadores.save(trabajador);
	}

	/** Busqueda por uno o varios criterios (RF-004, HU-05 C01 y C02). */
	@Transactional(readOnly = true)
	public Page<Trabajador> buscar(CriteriosBusquedaTrabajador criterios, Pageable paginacion) {
		return trabajadores.findAll(TrabajadorSpecifications.desde(criterios), paginacion);
	}

	@Transactional(readOnly = true)
	public Trabajador obtener(Long id) {
		return trabajadores.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe un trabajador con el id " + id + "."));
	}

	/**
	 * Modifica los campos autorizados (RF-005, HU-05 C03).
	 *
	 * <p>Solo direccion, especialidad y tipo. La identificacion no es editable,
	 * de modo que no hay nada que revalidar sobre su unicidad al modificar.
	 */
	@Transactional
	public Trabajador modificar(Long id, ModificacionTrabajadorRequest peticion) {
		Trabajador trabajador = obtener(id);
		trabajador.setDireccion(peticion.direccion());
		trabajador.setEspecialidadDesarrollo(peticion.especialidadDesarrollo());
		trabajador.setTipoTrabajador(peticion.tipoTrabajador());
		return trabajadores.save(trabajador);
	}

	/**
	 * Inhabilita al trabajador conservando su historial (RF-007, HU-05 C05).
	 *
	 * <p>El efecto sobre el inicio de sesion es automatico: la autenticacion lee
	 * {@code trabajador.estado} (RN-03). El bloqueo de nuevas asignaciones se
	 * aplicara en el servicio de asignaciones, cuando exista.
	 *
	 * <p>Inhabilitar dos veces no es un error, pero se avisa para que la interfaz
	 * no muestre una confirmacion enganosa.
	 */
	@Transactional
	public Trabajador inhabilitar(Long id) {
		Trabajador trabajador = obtener(id);
		if (!trabajador.estaHabilitado()) {
			throw new ReglaNegocioException("El trabajador ya se encuentra inhabilitado.");
		}
		trabajador.inhabilitar();
		return trabajadores.save(trabajador);
	}

	/**
	 * Adjunta o reemplaza la fotografia del perfil (RF-002, HU-04 C04).
	 *
	 * <p>Si el archivo no es valido, la excepcion impide guardar el cambio y el
	 * perfil queda intacto, como pide HU-04 C05.
	 */
	@Transactional
	public Trabajador adjuntarFotografia(Long id, MultipartFile archivo) {
		Trabajador trabajador = obtener(id);
		String ruta = almacenFotografias.guardar(trabajador.getId(), archivo);
		trabajador.asignarFotografia(ruta, archivo.getContentType(), archivo.getSize());
		return trabajadores.save(trabajador);
	}

}

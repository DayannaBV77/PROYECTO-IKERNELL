package com.PROYECTO.IKERNELL.backend.trabajadores;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.PROYECTO.IKERNELL.backend.auth.CuentaAccesoRepository;
import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;
import com.PROYECTO.IKERNELL.backend.corporativo.ServicioProvisionamientoCorreo;
import com.PROYECTO.IKERNELL.backend.corporativo.ServicioProvisionamientoCorreo.CorreoProvisionado;
import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.CategoriaHabilidad;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.HabilidadTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.CriteriosBusquedaTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.HabilidadTrabajadorRequest;
import com.PROYECTO.IKERNELL.backend.trabajadores.dto.HabilidadTrabajadorResponse;
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

	private static final Map<CategoriaHabilidad, Set<String>> CATALOGO_HABILIDADES = Map.of(
			CategoriaHabilidad.AREA, Set.of("Frontend", "Backend", "Full Stack", "Desarrollo 1"),
			CategoriaHabilidad.LENGUAJE,
			Set.of("Java", "JavaScript", "TypeScript", "PHP", "Python", "C#", "C++", "C", "Kotlin", "Swift"),
			CategoriaHabilidad.FRAMEWORK, Set.of("React", "Laravel", "Spring Boot", "Angular", "Django"),
			CategoriaHabilidad.BASE_DATOS, Set.of("MySQL", "PostgreSQL", "SQL Server", "MongoDB"));
	private static final java.time.LocalDate FECHA_MAXIMA_NACIMIENTO = java.time.LocalDate.of(2007, 12, 31);

	private final TrabajadorRepository trabajadores;
	private final HabilidadTrabajadorRepository habilidades;
	private final AlmacenFotografias almacenFotografias;
	private final CuentaAccesoRepository cuentas;
	private final ServicioProvisionamientoCorreo provisionamientoCorreo;

	public ServicioTrabajadores(TrabajadorRepository trabajadores,
			HabilidadTrabajadorRepository habilidades,
			AlmacenFotografias almacenFotografias,
			CuentaAccesoRepository cuentas,
			ServicioProvisionamientoCorreo provisionamientoCorreo) {
		this.trabajadores = trabajadores;
		this.habilidades = habilidades;
		this.almacenFotografias = almacenFotografias;
		this.cuentas = cuentas;
		this.provisionamientoCorreo = provisionamientoCorreo;
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
		String identificacion = peticion.identificacion();
		if (!identificacion.matches("\\d{10}")) {
			throw new ReglaNegocioException("La identificacion debe tener exactamente 10 digitos.");
		}
		if (trabajadores.existsByIdentificacion(identificacion)) {
			throw new ReglaNegocioException("Este número de documento ya existe en el sistema");
		}
		if (peticion.fechaNacimiento() == null || peticion.fechaNacimiento().isAfter(FECHA_MAXIMA_NACIMIENTO)) {
			throw new ReglaNegocioException("La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior");
		}
		validarHabilidades(peticion.habilidades());
		Trabajador trabajador = new Trabajador(
				identificacion,
				peticion.nombre(),
				peticion.apellido(),
				peticion.fechaNacimiento(),
				peticion.direccion(),
				peticion.profesion(),
				peticion.especialidadDesarrollo(),
				peticion.tipoTrabajador());
		Trabajador guardado = trabajadores.save(trabajador);
		reemplazarHabilidades(guardado, peticion.habilidades());
		CorreoProvisionado correo = provisionamientoCorreo.provisionarPara(guardado);
		if (correo == null || !correo.correoCorporativo().contains("@")) {
			throw new ReglaNegocioException("No se pudo crear la cuenta de correo corporativo del trabajador.");
		}
		return guardado;
	}

	@Transactional(readOnly = true)
	public boolean existeIdentificacion(String identificacion) {
		if (identificacion == null) {
			return false;
		}
		return trabajadores.existsByIdentificacion(identificacion.trim());
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

	@Transactional(readOnly = true)
	public String correoCorporativoDe(Long trabajadorId) {
		return cuentas.findByTrabajadorId(trabajadorId)
				.map(CuentaAcceso::getCorreoCorporativo)
				.orElse(null);
	}

	@Transactional(readOnly = true)
	public List<HabilidadTrabajadorResponse> habilidadesDe(Long trabajadorId) {
		return habilidades.findByTrabajador_IdOrderByCategoriaAscNombreAsc(trabajadorId).stream()
				.map(HabilidadTrabajadorResponse::de)
				.toList();
	}

	/**
	 * Modifica los campos autorizados (RF-005, HU-05 C03).
	 *
	 * <p>Los campos de perfil autorizados por RF-005 son direccion, especialidad
	 * y tipo. La lista de habilidades se reemplaza solo cuando viene en la
	 * peticion, para mantener compatibilidad con clientes anteriores. La
	 * identificacion no es editable.
	 */
	@Transactional
	public Trabajador modificar(Long id, ModificacionTrabajadorRequest peticion) {
		Trabajador trabajador = obtener(id);
		if (peticion.habilidades() != null) {
			validarHabilidades(peticion.habilidades());
		}
		trabajador.setDireccion(peticion.direccion());
		trabajador.setEspecialidadDesarrollo(peticion.especialidadDesarrollo());
		trabajador.setTipoTrabajador(peticion.tipoTrabajador());
		if (peticion.habilidades() != null) {
			reemplazarHabilidades(trabajador, peticion.habilidades());
		}
		return trabajadores.save(trabajador);
	}

	private void reemplazarHabilidades(Trabajador trabajador, List<HabilidadTrabajadorRequest> seleccionadas) {
		List<HabilidadTrabajadorRequest> lista = seleccionadas == null ? List.of() : seleccionadas;
		habilidades.deleteByTrabajador_Id(trabajador.getId());
		habilidades.flush();
		List<HabilidadTrabajador> entidades = lista.stream()
				.map(habilidad -> new HabilidadTrabajador(trabajador, habilidad.categoria(), habilidad.nombre()))
				.toList();
		habilidades.saveAll(entidades);
	}

	private void validarHabilidades(List<HabilidadTrabajadorRequest> seleccionadas) {
		List<HabilidadTrabajadorRequest> lista = seleccionadas == null ? List.of() : seleccionadas;
		Set<HabilidadTrabajadorRequest> unicas = Set.copyOf(lista);
		if (unicas.size() != lista.size()) {
			throw new ReglaNegocioException("No se puede seleccionar dos veces la misma habilidad.");
		}
		for (HabilidadTrabajadorRequest habilidad : lista) {
			if (habilidad.categoria() == null
					|| !CATALOGO_HABILIDADES.get(habilidad.categoria()).contains(habilidad.nombre())) {
				throw new ReglaNegocioException("La habilidad seleccionada no pertenece al catalogo disponible.");
			}
		}
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

	/**
	 * Fotografia del perfil (RF-002, HU-04 C04).
	 *
	 * <p>HU-04 C04 no se conforma con adjuntar la imagen: pide que "se pueda ver
	 * en el" perfil, de modo que recuperarla forma parte del criterio.
	 *
	 * <p>Devuelve tambien el tipo con el que se valido al guardarla, en lugar de
	 * deducirlo de la extension del archivo: el tipo validado es el dato de
	 * confianza.
	 */
	@Transactional(readOnly = true)
	public FotografiaGuardada fotografiaDe(Long id) {
		Trabajador trabajador = obtener(id);
		if (trabajador.getFotoRuta() == null) {
			throw new RecursoNoEncontradoException("El perfil no tiene una fotografia adjunta.");
		}
		return new FotografiaGuardada(
				almacenFotografias.abrir(trabajador.getFotoRuta()),
				trabajador.getFotoContentType(),
				trabajador.getFotoTamanoBytes());
	}

	/**
	 * Trabajadores de un tipo que siguen habilitados (RF-009, HU-10 C01).
	 *
	 * <p>Sin paginar: el conjunto es acotado por naturaleza -los desarrolladores
	 * de la empresa- y quien lo pide necesita la lista completa para elegir.
	 */
	@Transactional(readOnly = true)
	public List<Trabajador> habilitadosPorTipo(TipoTrabajador tipo) {
		return trabajadores.findByTipoTrabajadorAndEstadoOrderByApellidoAscNombreAsc(
				tipo, EstadoHabilitacion.HABILITADO);
	}

	/** Fotografia recuperada del almacen, con los datos con que se valido. */
	public record FotografiaGuardada(Resource contenido, String contentType, Long tamanoBytes) {
	}

}

package com.PROYECTO.IKERNELL.backend.trabajadores;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.PROYECTO.IKERNELL.backend.shared.domain.EstadoHabilitacion;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.TipoTrabajador;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/**
 * Acceso a los perfiles de trabajador.
 *
 * <p>Extiende {@code JpaSpecificationExecutor} porque RF-004 combina hasta seis
 * criterios opcionales; la consulta se arma en {@code TrabajadorSpecifications}.
 */
public interface TrabajadorRepository
		extends JpaRepository<Trabajador, Long>, JpaSpecificationExecutor<Trabajador> {

	/** Soporta la validacion de unicidad de RN-01 (RF-001, HU-04 C03). */
	boolean existsByIdentificacion(String identificacion);

	Optional<Trabajador> findByIdentificacion(String identificacion);

	boolean existsByTipoTrabajador(TipoTrabajador tipoTrabajador);

	/**
	 * Trabajadores de un tipo que siguen habilitados, para ofrecerlos como
	 * candidatos a un equipo de proyecto (RF-009, HU-10 C01).
	 *
	 * <p>No pasa por {@code TrabajadorSpecifications} porque no combina criterios
	 * opcionales: son siempre los dos mismos.
	 */
	List<Trabajador> findByTipoTrabajadorAndEstadoOrderByApellidoAscNombreAsc(
			TipoTrabajador tipoTrabajador, EstadoHabilitacion estado);

}

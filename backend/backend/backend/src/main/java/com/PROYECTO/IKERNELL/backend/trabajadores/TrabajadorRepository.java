package com.PROYECTO.IKERNELL.backend.trabajadores;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

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

}

package com.PROYECTO.IKERNELL.backend.asignaciones;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.asignaciones.domain.Rol;

public interface RolRepository extends JpaRepository<Rol, Long> {

	Optional<Rol> findByNombreRol(String nombreRol);

	List<Rol> findAllByOrderByIdAsc();
}

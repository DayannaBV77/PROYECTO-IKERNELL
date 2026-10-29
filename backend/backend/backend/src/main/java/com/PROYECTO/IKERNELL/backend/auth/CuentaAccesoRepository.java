package com.PROYECTO.IKERNELL.backend.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.auth.domain.CuentaAcceso;

public interface CuentaAccesoRepository extends JpaRepository<CuentaAcceso, Long> {

	Optional<CuentaAcceso> findByCorreoCorporativo(String correoCorporativo);

	Optional<CuentaAcceso> findByTrabajadorId(Long trabajadorId);

	boolean existsByCorreoCorporativo(String correoCorporativo);

	boolean existsByTrabajadorId(Long trabajadorId);

}

package com.PROYECTO.IKERNELL.backend.chat;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.chat.domain.LecturaHilo;

public interface LecturaHiloRepository extends JpaRepository<LecturaHilo, Long> {

	Optional<LecturaHilo> findByHiloIdAndTrabajadorId(Long hiloId, Long trabajadorId);

}

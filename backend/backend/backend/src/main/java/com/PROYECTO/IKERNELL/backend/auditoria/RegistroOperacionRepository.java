package com.PROYECTO.IKERNELL.backend.auditoria;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.auditoria.domain.RegistroOperacion;

public interface RegistroOperacionRepository extends JpaRepository<RegistroOperacion, Long> {

	List<RegistroOperacion> findAllByOrderByOcurridaEnDesc(Limit limite);

	List<RegistroOperacion> findByExitosaFalseOrderByOcurridaEnDesc(Limit limite);

	long countByExitosaFalse();

}

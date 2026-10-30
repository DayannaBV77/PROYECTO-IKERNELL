package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.AuditoriaReporteExterno;

public interface AuditoriaReporteExternoRepository
		extends JpaRepository<AuditoriaReporteExterno, Long> {

	List<AuditoriaReporteExterno> findAllByOrderByOcurridaEnDesc(Limit limite);

}

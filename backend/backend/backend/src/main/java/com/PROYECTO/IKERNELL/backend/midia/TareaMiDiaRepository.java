package com.PROYECTO.IKERNELL.backend.midia;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.PROYECTO.IKERNELL.backend.midia.domain.TareaMiDia;

public interface TareaMiDiaRepository extends JpaRepository<TareaMiDia, Long> {

	/**
	 * Tareas del dia de un trabajador.
	 *
	 * <p>Las pendientes van primero y, dentro de cada grupo, las mas antiguas
	 * primero: es el orden en que se espera resolver un checklist. El panel
	 * vuelve a combinar esta lista con las actividades del sistema.
	 */
	List<TareaMiDia> findByTrabajadorIdAndFechaOrderByCompletadaAscCreadaEnAsc(
			Long trabajadorId, LocalDate fecha);

	/**
	 * Busca la tarea solo si pertenece al trabajador que la pide.
	 *
	 * <p>Se usa para actualizar y eliminar: el 404 es el mismo tanto si la tarea
	 * no existe como si es de otra persona, para no revelar identificadores
	 * ajenos.
	 */
	Optional<TareaMiDia> findByIdAndTrabajadorId(Long id, Long trabajadorId);

}

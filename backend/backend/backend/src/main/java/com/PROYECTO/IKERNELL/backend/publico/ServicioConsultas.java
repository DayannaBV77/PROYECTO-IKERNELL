package com.PROYECTO.IKERNELL.backend.publico;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.publico.domain.ConsultaPublica;
import com.PROYECTO.IKERNELL.backend.publico.dto.RegistroConsultaRequest;
import com.PROYECTO.IKERNELL.backend.shared.error.RecursoNoEncontradoException;
import com.PROYECTO.IKERNELL.backend.shared.error.ReglaNegocioException;
import com.PROYECTO.IKERNELL.backend.trabajadores.ServicioTrabajadores;
import com.PROYECTO.IKERNELL.backend.trabajadores.domain.Trabajador;

/** Consultas enviadas desde el formulario publico (RF-035, HU-02). */
@Service
public class ServicioConsultas {

	private final ConsultaPublicaRepository consultas;
	private final ServicioTrabajadores servicioTrabajadores;

	public ServicioConsultas(ConsultaPublicaRepository consultas, ServicioTrabajadores servicioTrabajadores) {
		this.consultas = consultas;
		this.servicioTrabajadores = servicioTrabajadores;
	}

	/** RF-035, HU-02 C02: registra la consulta recibida. */
	@Transactional
	public ConsultaPublica registrar(RegistroConsultaRequest peticion) {
		return consultas.save(new ConsultaPublica(peticion.pregunta(), peticion.nombreContacto(),
				peticion.correoContacto(), peticion.telefonoContacto()));
	}

	/**
	 * Consultas recibidas, para atenderlas desde dentro.
	 *
	 * <p>PROPUESTA: HU-02 T2 deja abierto "quien recibira y atendera las
	 * consultas". Sin esta vista, lo que RF-035 manda recibir no seria legible
	 * por nadie.
	 */
	@Transactional(readOnly = true)
	public List<ConsultaPublica> recibidas(Boolean atendida) {
		return (atendida == null)
				? consultas.findAllByOrderByRecibidaEnDesc()
				: consultas.findByAtendidaOrderByRecibidaEnDesc(atendida);
	}

	@Transactional
	public ConsultaPublica marcarAtendida(Long id, Long trabajadorId) {
		ConsultaPublica consulta = consultas.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("No existe la consulta con el id " + id + "."));
		if (consulta.estaAtendida()) {
			throw new ReglaNegocioException("La consulta ya fue marcada como atendida.");
		}
		Trabajador trabajador = servicioTrabajadores.obtener(trabajadorId);
		consulta.marcarAtendida(trabajador);
		return consultas.save(consulta);
	}

}

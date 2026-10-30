package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.AuditoriaReporteExterno;
import com.PROYECTO.IKERNELL.backend.reportes.externo.domain.ResultadoAuditoriaReporteExterno;

/**
 * Escribe la bitacora propia del reporte externo (RF-025, HU-19).
 *
 * <p>El registro se escribe en una transaccion propia
 * ({@code PROPAGATION_REQUIRES_NEW}) por el mismo motivo que la bitacora
 * general: el intento fallido se anota dentro del metodo que lanza la
 * excepcion, y si compartiera la transaccion del negocio se desharia junto con
 * ella. Con una transaccion independiente, el rastro del fallo sobrevive aunque
 * la generacion se cancele.
 *
 * <p>Se usa {@link TransactionTemplate} y no {@code @Transactional} para que el
 * {@code try} cubra tambien el commit: si la escritura falla, la excepcion se
 * atrapa y se avisa por consola. La bitacora nunca debe tumbar una peticion que
 * ya se resolvio.
 */
@Service
public class ServicioAuditoriaReporteExterno {

	private static final Logger log = LoggerFactory.getLogger(ServicioAuditoriaReporteExterno.class);

	/** La columna admite 2000; se recorta antes para no fallar por longitud. */
	private static final int MAXIMO_MENSAJE = 2000;

	private final AuditoriaReporteExternoRepository repositorio;
	private final TransactionTemplate transaccion;

	public ServicioAuditoriaReporteExterno(AuditoriaReporteExternoRepository repositorio,
			PlatformTransactionManager gestorTransacciones) {
		this.repositorio = repositorio;
		this.transaccion = new TransactionTemplate(gestorTransacciones);
		this.transaccion.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
	}

	public void registrar(Long trabajadorId, String correo, String proyectosSolicitados,
			String proyectosIncluidos, ResultadoAuditoriaReporteExterno resultado,
			String formato, String codificacion, String nombreArchivo, Integer totalRegistros,
			long duracionMs, String mensajeError) {
		try {
			transaccion.executeWithoutResult(estado -> repositorio.save(
					new AuditoriaReporteExterno(LocalDateTime.now(), trabajadorId, correo,
							proyectosSolicitados, proyectosIncluidos, resultado, formato,
							codificacion, nombreArchivo, totalRegistros, duracionMs,
							recortar(mensajeError))));
		}
		catch (RuntimeException fallo) {
			log.error("No se pudo anotar el intento de reporte externo: {}", fallo.getMessage());
		}
	}

	@Transactional(readOnly = true)
	public List<AuditoriaReporteExterno> ultimos(int cuantos) {
		return repositorio.findAllByOrderByOcurridaEnDesc(Limit.of(cuantos));
	}

	private String recortar(String mensaje) {
		if (mensaje == null || mensaje.length() <= MAXIMO_MENSAJE) {
			return mensaje;
		}
		return mensaje.substring(0, MAXIMO_MENSAJE);
	}

}

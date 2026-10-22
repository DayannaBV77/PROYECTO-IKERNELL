package com.PROYECTO.IKERNELL.backend.auditoria;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.PROYECTO.IKERNELL.backend.auditoria.domain.RegistroOperacion;

/**
 * Escribe la bitacora de operaciones (RNF-003).
 *
 * <p>EL PUNTO CLAVE ES {@code Propagation.REQUIRES_NEW}. Sin el, anotar un
 * error seria inutil: el registro se uniria a la transaccion del negocio, y
 * esa transaccion es precisamente la que se deshace cuando algo falla, asi que
 * el rastro del fallo desapareceria junto con el fallo. Con una transaccion
 * propia, la anotacion se confirma pase lo que pase con la del negocio.
 *
 * <p>La contrapartida es que la bitacora nunca debe tumbar una peticion que ya
 * se resolvio: si la escritura falla, se avisa por consola y se sigue.
 */
@Service
public class ServicioRegistroOperaciones {

	private static final Logger log = LoggerFactory.getLogger(ServicioRegistroOperaciones.class);

	/** La columna admite 2000; se recorta antes para no fallar por longitud. */
	private static final int MAXIMO_DETALLE = 2000;

	private final RegistroOperacionRepository repositorio;

	public ServicioRegistroOperaciones(RegistroOperacionRepository repositorio) {
		this.repositorio = repositorio;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void registrar(String metodo, String ruta, int codigoHttp, long duracionMs,
			Long trabajadorId, String correo, String detalleError) {
		try {
			repositorio.save(new RegistroOperacion(LocalDateTime.now(), metodo, ruta, codigoHttp,
					duracionMs, trabajadorId, correo, recortar(detalleError)));
		} catch (RuntimeException fallo) {
			// La peticion ya se resolvio; perder su anotacion no justifica
			// devolverle un error al cliente.
			log.error("No se pudo anotar la operacion {} {} en la bitacora: {}",
					metodo, ruta, fallo.getMessage());
		}
	}

	@Transactional(readOnly = true)
	public List<RegistroOperacion> ultimas(int cuantas) {
		return repositorio.findAllByOrderByOcurridaEnDesc(Limit.of(cuantas));
	}

	@Transactional(readOnly = true)
	public List<RegistroOperacion> ultimosFallos(int cuantos) {
		return repositorio.findByExitosaFalseOrderByOcurridaEnDesc(Limit.of(cuantos));
	}

	@Transactional(readOnly = true)
	public long totalRegistradas() {
		return repositorio.count();
	}

	@Transactional(readOnly = true)
	public long totalFallidas() {
		return repositorio.countByExitosaFalse();
	}

	private String recortar(String detalle) {
		if (detalle == null || detalle.length() <= MAXIMO_DETALLE) {
			return detalle;
		}
		return detalle.substring(0, MAXIMO_DETALLE);
	}

}

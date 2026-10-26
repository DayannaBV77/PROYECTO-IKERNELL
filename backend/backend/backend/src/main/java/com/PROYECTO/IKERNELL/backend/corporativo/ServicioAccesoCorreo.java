package com.PROYECTO.IKERNELL.backend.corporativo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.PROYECTO.IKERNELL.backend.corporativo.dto.AccesoCorreoResponse;

/**
 * Acceso al correo electronico corporativo (RF-031, HU-20 C04 y C05).
 *
 * <p>RF-031 admite que el correo sea externo al aplicativo y que el sistema solo
 * proporcione "un acceso o enlace autorizado", dejando la integracion tecnica
 * por confirmar (D-13). Se resuelve con un enlace configurable, que es lo que el
 * requerimiento permite sin suponer nada; sin enlace configurado se devuelve el
 * aviso de C05 en lugar de una pantalla en blanco.
 *
 * <p>Vive en su propio servicio porque lo consultan dos sitios: el endpoint de
 * servicios corporativos y el panel «Mi Dia» (RF-038), que informa del estado
 * del correo. Antes la decision estaba escrita dentro del controlador.
 *
 * <p>LIMITACION QUE CONVIENE TENER PRESENTE: siendo un enlace a un servicio
 * externo, el aplicativo NO puede saber cuantos correos sin leer hay. RF-038
 * pide ese contador junto al del chat, y es la parte del requerimiento que no se
 * puede cumplir mientras D-13 no defina una integracion real.
 */
@Service
public class ServicioAccesoCorreo {

	private final String urlCorreo;

	public ServicioAccesoCorreo(@Value("${ikernell.correo.url:}") String urlCorreo) {
		this.urlCorreo = urlCorreo;
	}

	public AccesoCorreoResponse acceso() {
		return StringUtils.hasText(urlCorreo)
				? AccesoCorreoResponse.enlace(urlCorreo)
				: AccesoCorreoResponse.noDisponible();
	}

}

package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.nio.charset.Charset;
import java.nio.charset.IllegalCharsetNameException;
import java.nio.charset.UnsupportedCharsetException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * Parametros del reporte externo (RF-025, HU-19 C02).
 *
 * <p>El acuerdo con la empresa brasileña sigue pendiente (HU-19 T1). Todo lo
 * que ese acuerdo puede cambiar -formato, separador, codificacion, cabecera,
 * nombre del archivo, fin de linea, campos y anchos- vive aqui, de modo que
 * cerrarlo sea un cambio de configuracion y no de codigo.
 *
 * <p>Los valores se validan al arrancar, no al generar: una codificacion mal
 * escrita debe fallar cuando se despliega, no la primera vez que alguien pide
 * el reporte, que es justo cuando menos ayuda.
 */
@Component
@ConfigurationProperties(prefix = "ikernell.reporte-externo")
public class ConfiguracionReporteExterno {

	/**
	 * Campos que el sistema puede aportar hoy, en el orden por defecto.
	 *
	 * <p>Son datos del proyecto y de su ejecucion. Deliberadamente NO incluyen
	 * nombres, identificaciones, correos, documentos ni observaciones de los
	 * trabajadores: el reporte externo excluye los datos personales (D-43).
	 */
	public static final List<String> CAMPOS_POR_DEFECTO = List.of(
			"proyecto_id",
			"proyecto_nombre",
			"estado_habilitacion",
			"estado_operativo",
			"fecha_inicio_real",
			"fecha_fin_real",
			"etapas_registradas",
			"actividades_registradas",
			"ejecuciones_registradas",
			"ejecuciones_finalizadas",
			"errores_registrados",
			"interrupciones_registradas",
			"primera_ejecucion",
			"ultima_ejecucion");

	private FormatoReporteExterno formato = FormatoReporteExterno.DELIMITADO;

	private String separador = "|";

	private String codificacion = "UTF-8";

	private boolean incluirCabecera = true;

	private String nombreBase = "ikernell-reporte-externo";

	/** Fin de linea literal que se escribe despues de cada registro. */
	private String finDeLinea = "\n";

	private List<String> campos = new ArrayList<>(CAMPOS_POR_DEFECTO);

	/** Ancho de cada campo cuando el formato es ANCHO_FIJO. */
	private Map<String, Integer> anchos = new LinkedHashMap<>();

	@PostConstruct
	void validar() {
		if (separador == null || separador.isEmpty()) {
			throw new IllegalStateException(
					"El separador del reporte externo no puede estar vacio.");
		}
		if (campos == null || campos.isEmpty()) {
			throw new IllegalStateException(
					"El reporte externo debe declarar al menos un campo.");
		}
		// Fuerza la validacion de la codificacion al arrancar.
		charset();
	}

	/** Codificacion ya validada; un nombre invalido detiene el arranque. */
	public Charset charset() {
		try {
			return Charset.forName(codificacion);
		}
		catch (IllegalCharsetNameException | UnsupportedCharsetException ex) {
			throw new IllegalStateException(
					"La codificacion configurada para el reporte externo no existe: " + codificacion,
					ex);
		}
	}

	public FormatoReporteExterno getFormato() {
		return formato;
	}

	public void setFormato(FormatoReporteExterno formato) {
		this.formato = formato;
	}

	public String getSeparador() {
		return separador;
	}

	public void setSeparador(String separador) {
		this.separador = separador;
	}

	public String getCodificacion() {
		return codificacion;
	}

	public void setCodificacion(String codificacion) {
		this.codificacion = codificacion;
	}

	public boolean isIncluirCabecera() {
		return incluirCabecera;
	}

	public void setIncluirCabecera(boolean incluirCabecera) {
		this.incluirCabecera = incluirCabecera;
	}

	public String getNombreBase() {
		return nombreBase;
	}

	public void setNombreBase(String nombreBase) {
		this.nombreBase = nombreBase;
	}

	public String getFinDeLinea() {
		return finDeLinea;
	}

	public void setFinDeLinea(String finDeLinea) {
		this.finDeLinea = finDeLinea;
	}

	public List<String> getCampos() {
		return campos;
	}

	public void setCampos(List<String> campos) {
		this.campos = campos;
	}

	public Map<String, Integer> getAnchos() {
		return anchos;
	}

	public void setAnchos(Map<String, Integer> anchos) {
		this.anchos = anchos;
	}

}

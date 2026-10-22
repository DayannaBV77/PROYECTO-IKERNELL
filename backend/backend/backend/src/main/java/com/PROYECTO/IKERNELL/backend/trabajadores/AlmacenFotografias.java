package com.PROYECTO.IKERNELL.backend.trabajadores;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.PROYECTO.IKERNELL.backend.shared.error.ArchivoInvalidoException;

/**
 * Guarda las fotografias de perfil en disco y devuelve la ruta (RF-002).
 *
 * <p>Se eligio disco mas ruta en base de datos en lugar de un BLOB; es una
 * decision de diseno, no un requisito.
 *
 * <p>PROPUESTA pendiente de validacion (D-11): RF-002 habla de "un formato
 * permitido" y de "los limites tecnicos definidos para el aplicativo", pero
 * ningun documento dice cuales son. Los valores viven en configuracion
 * ({@code ikernell.fotografias.*}) para poder ajustarlos cuando la empresa los
 * defina, sin tocar codigo.
 */
@Component
public class AlmacenFotografias {

	/** Firmas de archivo de los formatos admitidos, en el mismo orden que TIPOS_SOPORTADOS. */
	private static final byte[] FIRMA_JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF };
	private static final byte[] FIRMA_PNG = { (byte) 0x89, 0x50, 0x4E, 0x47 };

	private final Path directorio;
	private final long tamanoMaximoBytes;
	private final List<String> tiposPermitidos;

	public AlmacenFotografias(
			@Value("${ikernell.fotografias.directorio}") String directorio,
			@Value("${ikernell.fotografias.tamano-maximo-bytes}") long tamanoMaximoBytes,
			@Value("${ikernell.fotografias.tipos-permitidos}") List<String> tiposPermitidos) {
		this.directorio = Paths.get(directorio);
		this.tamanoMaximoBytes = tamanoMaximoBytes;
		this.tiposPermitidos = tiposPermitidos;
	}

	/**
	 * Valida y almacena la fotografia.
	 *
	 * <p>Cada rechazo explica el motivo concreto, porque HU-04 C05 exige que el
	 * sistema "explique el motivo" y permita elegir otra imagen.
	 *
	 * @return ruta relativa del archivo guardado
	 */
	public String guardar(Long trabajadorId, MultipartFile archivo) {
		if (archivo == null || archivo.isEmpty()) {
			throw new ArchivoInvalidoException("Debe seleccionar un archivo de imagen.");
		}
		if (archivo.getSize() > tamanoMaximoBytes) {
			throw new ArchivoInvalidoException(
					"La fotografia supera el tamano maximo permitido de " + tamanoMaximoBytes + " bytes.");
		}
		String tipo = archivo.getContentType();
		if (tipo == null || !tiposPermitidos.contains(tipo)) {
			throw new ArchivoInvalidoException(
					"El formato del archivo no esta permitido. Formatos admitidos: " + tiposPermitidos + ".");
		}
		// El tipo declarado por el cliente se puede falsear, asi que se comprueba
		// tambien el contenido real del archivo.
		if (!contenidoCoincideConTipo(archivo, tipo)) {
			throw new ArchivoInvalidoException("El contenido del archivo no corresponde a una imagen " + tipo + ".");
		}

		try {
			Files.createDirectories(directorio);
			String nombreArchivo = trabajadorId + "-" + UUID.randomUUID() + extensionPara(tipo);
			Path destino = directorio.resolve(nombreArchivo);
			try (InputStream entrada = archivo.getInputStream()) {
				Files.copy(entrada, destino, StandardCopyOption.REPLACE_EXISTING);
			}
			return destino.toString();
		}
		catch (IOException ex) {
			throw new ArchivoInvalidoException("No se pudo guardar la fotografia. Intente de nuevo.");
		}
	}

	private boolean contenidoCoincideConTipo(MultipartFile archivo, String tipo) {
		byte[] firmaEsperada = "image/png".equals(tipo) ? FIRMA_PNG : FIRMA_JPEG;
		try (InputStream entrada = archivo.getInputStream()) {
			byte[] cabecera = entrada.readNBytes(firmaEsperada.length);
			return Arrays.equals(cabecera, firmaEsperada);
		}
		catch (IOException ex) {
			return false;
		}
	}

	private String extensionPara(String tipo) {
		return "image/png".equals(tipo) ? ".png" : ".jpg";
	}

}

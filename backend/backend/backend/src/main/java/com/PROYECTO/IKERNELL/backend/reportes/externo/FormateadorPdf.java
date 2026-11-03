package com.PROYECTO.IKERNELL.backend.reportes.externo;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Propuesta adicional para la empresa brasilena: salida PDF, con cifrado opcional
 * y acceso controlado por contraseña. El archivo plano sigue siendo el formato
 * principal mientras la empresa no apruebe este formato.
 */
@Component
public class FormateadorPdf implements FormateadorReporteExterno {

	@Override
	public FormatoReporteExterno formato() {
		return FormatoReporteExterno.PDF;
	}

	@Override
	public String extension() {
		return ".pdf";
	}

	@Override
	public String formatear(List<String> cabecera, List<List<String>> filas,
			ConfiguracionReporteExterno config) {
		throw new UnsupportedOperationException(
				"La generacion PDF se entrega en bytes y no como texto plano. Use generarPdf().");
	}

	public byte[] generarPdf(List<String> cabecera, List<List<String>> filas,
			ConfiguracionReporteExterno config) {
		if (filas == null || filas.isEmpty()) {
			throw new IllegalStateException("No se puede generar un PDF sin filas de reporte.");
		}
		if (config.isPdfProtegido() && !StringUtils.hasText(config.getPdfContrasena())) {
			throw new IllegalStateException(
					"La contraseña del PDF protege el documento, pero no hay valor configurado para abrirlo.");
		}

		try (PDDocument documento = new PDDocument()) {
			PDPage pagina = new PDPage(PDRectangle.A4);
			documento.addPage(pagina);

			PDType1Font fuenteTitulo = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
			PDType1Font fuenteNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
			try (PDPageContentStream flujo = new PDPageContentStream(documento, pagina)) {
				flujo.beginText();
				flujo.setFont(fuenteTitulo, 14);
				flujo.newLineAtOffset(50, 790);
				flujo.showText("IKernell - Reporte externo para la empresa brasileña");
				flujo.endText();

				float y = 760f;
				String[] cabeceraActual = cabecera.toArray(String[]::new);
				for (int indice = 0; indice < cabeceraActual.length; indice++) {
					String texto = cabeceraActual[indice];
					agregarTexto(flujo, 50 + (indice * 110), y, texto, 9, true, fuenteTitulo, fuenteNormal);
				}
				y -= 20;

				for (List<String> fila : filas) {
					String[] valores = fila.toArray(String[]::new);
					for (int indice = 0; indice < valores.length; indice++) {
						String texto = valores[indice] == null ? "" : valores[indice];
						agregarTexto(flujo, 50 + (indice * 110), y, texto, 8, false, fuenteTitulo, fuenteNormal);
					}
					y -= 16;
					if (y < 60) {
						break;
					}
				}
			}

			if (config.isPdfProtegido()) {
				AccessPermission permisos = new AccessPermission();
				StandardProtectionPolicy politica = new StandardProtectionPolicy(
						config.getPdfContrasena(), config.getPdfContrasena(), permisos);
				politica.setEncryptionKeyLength(128);
				documento.protect(politica);
			}

			ByteArrayOutputStream salida = new ByteArrayOutputStream();
			documento.save(salida);
			return salida.toByteArray();
		}
		catch (IOException ex) {
			throw new IllegalStateException("No se pudo generar el PDF del reporte externo.", ex);
		}
	}

	private void agregarTexto(PDPageContentStream flujo, float x, float y, String texto, int tamano,
			boolean negrita, PDType1Font fuenteTitulo, PDType1Font fuenteNormal) throws IOException {
		flujo.beginText();
		flujo.setFont(negrita ? fuenteTitulo : fuenteNormal, tamano);
		flujo.newLineAtOffset(x, y);
		String valor = texto == null ? "" : texto.replace("\n", " ").replace("\r", " ");
		if (valor.length() > 60) {
			valor = valor.substring(0, 57) + "...";
		}
		flujo.showText(valor);
		flujo.endText();
	}
}

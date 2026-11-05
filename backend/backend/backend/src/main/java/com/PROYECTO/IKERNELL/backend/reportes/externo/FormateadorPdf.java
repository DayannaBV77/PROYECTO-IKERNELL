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
			// Usamos orientación horizontal (Landscape) para presentar limpiamente todas las columnas
			PDPage pagina = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
			documento.addPage(pagina);

			PDType1Font fuenteTitulo = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
			PDType1Font fuenteNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
			try (PDPageContentStream flujo = new PDPageContentStream(documento, pagina)) {
				// Encabezado principal del reporte
				flujo.beginText();
				flujo.setFont(fuenteTitulo, 16);
				flujo.newLineAtOffset(40, 550);
				flujo.showText("IKernell · Reporte Ejecutivo para la Empresa Aliada");
				flujo.endText();

				flujo.beginText();
				flujo.setFont(fuenteNormal, 10);
				flujo.newLineAtOffset(40, 534);
				flujo.showText("Resumen consolidado de proyectos autorizados y estado de ejecución operacional");
				flujo.endText();

				// Línea divisoria decorativa
				flujo.setLineWidth(1f);
				flujo.moveTo(40, 522);
				flujo.lineTo(802, 522);
				flujo.stroke();

				// Cabecera de columnas con fondo/espaciado proporcional
				float y = 505f;
				float inicioX = 40f;
				float anchoCol = 54f; // 14 columnas x 54 = ~756px

				String[] cabeceraActual = cabecera.toArray(String[]::new);
				for (int indice = 0; indice < cabeceraActual.length; indice++) {
					String texto = cabeceraActual[indice];
					// Formatear nombre de columna más legible si contiene guiones bajos
					String tituloCol = texto.replace('_', ' ');
					agregarTexto(flujo, inicioX + (indice * anchoCol), y, tituloCol, 7, true, fuenteTitulo, fuenteNormal);
				}

				y -= 18;

				for (List<String> fila : filas) {
					String[] valores = fila.toArray(String[]::new);
					for (int indice = 0; indice < valores.length && indice < cabeceraActual.length; indice++) {
						String texto = valores[indice] == null ? "" : valores[indice];
						agregarTexto(flujo, inicioX + (indice * anchoCol), y, texto, 7, false, fuenteTitulo, fuenteNormal);
					}
					y -= 14;
					if (y < 40) {
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

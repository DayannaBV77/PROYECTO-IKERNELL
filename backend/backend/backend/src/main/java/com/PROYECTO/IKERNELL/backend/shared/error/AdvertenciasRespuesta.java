package com.PROYECTO.IKERNELL.backend.shared.error;

import java.util.List;

/** Cuerpo de respuesta cuando una operacion requiere confirmacion (HU-09 C05). */
public record AdvertenciasRespuesta(String mensaje, List<String> advertencias) {
}

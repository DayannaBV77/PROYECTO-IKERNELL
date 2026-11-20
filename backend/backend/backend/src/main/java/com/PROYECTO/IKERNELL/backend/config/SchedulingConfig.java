package com.PROYECTO.IKERNELL.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita la ejecucion de tareas programadas (p.ej. depuracion automatica de
 * mensajes expirados del chat corporativo).
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {

}

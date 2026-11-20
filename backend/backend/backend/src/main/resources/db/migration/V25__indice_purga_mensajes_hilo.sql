-- =============================================================================
-- Indice por fecha de envio en mensaje_hilo para depuracion automatica (TTL 30d)
--
-- El indice compuesto existente ix_mensaje_hilo (hilo_id, enviado_en) optimiza
-- las lecturas dentro de un hilo, pero no evita un full table scan cuando el
-- planificador ejecuta la purga global por antiguedad (WHERE enviado_en < ...).
-- =============================================================================
CREATE INDEX IF NOT EXISTS ix_mensaje_hilo_enviado_en ON mensaje_hilo (enviado_en);

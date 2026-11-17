-- =============================================================================
-- IKernell Soluciones Software - V24
-- Unicidad de identificacion por tipo de documento (CC, CE)
-- =============================================================================

ALTER TABLE trabajador DROP CONSTRAINT IF EXISTS uk_trabajador_identificacion;

ALTER TABLE trabajador
    ADD CONSTRAINT uk_trabajador_tipo_identificacion_identificacion
    UNIQUE (tipo_identificacion, identificacion);

-- =============================================================================
-- IKernell Soluciones Software - V26
-- Ampliacion del catalogo oficial de tipos de documento de identificacion
-- =============================================================================

ALTER TABLE trabajador
    DROP CONSTRAINT IF EXISTS ck_trabajador_tipo_identificacion;

ALTER TABLE trabajador
    ADD CONSTRAINT ck_trabajador_tipo_identificacion
    CHECK (tipo_identificacion IN (
        'CEDULA_CIUDADANIA',
        'TARJETA_IDENTIDAD',
        'CEDULA_EXTRANJERIA',
        'PASAPORTE',
        'PPT'
    ));

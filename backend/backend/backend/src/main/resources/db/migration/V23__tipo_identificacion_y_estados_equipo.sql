-- =============================================================================
-- IKernell Soluciones Software - V23
-- Tipo de identificacion en trabajador y gestion de estado de liderazgo en proyecto/equipo
-- =============================================================================

-- 1. Tipo de identificacion en trabajador (CEDULA_CIUDADANIA, CEDULA_EXTRANJERIA)
ALTER TABLE trabajador
    ADD COLUMN tipo_identificacion VARCHAR(30) NOT NULL DEFAULT 'CEDULA_CIUDADANIA';

ALTER TABLE trabajador
    ADD CONSTRAINT ck_trabajador_tipo_identificacion
    CHECK (tipo_identificacion IN ('CEDULA_CIUDADANIA', 'CEDULA_EXTRANJERIA'));

-- 2. Estado de liderazgo en proyecto (ACTIVO, PAUSADO)
ALTER TABLE proyecto
    ADD COLUMN estado_liderazgo VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE proyecto
    ADD CONSTRAINT ck_proyecto_estado_liderazgo
    CHECK (estado_liderazgo IN ('ACTIVO', 'PAUSADO'));

-- 3. Estado de liderazgo en rol_trabajador para la asignacion del lider
ALTER TABLE rol_trabajador
    ADD COLUMN estado_liderazgo VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE rol_trabajador
    ADD CONSTRAINT ck_rol_trabajador_estado_liderazgo
    CHECK (estado_liderazgo IN ('ACTIVO', 'PAUSADO'));

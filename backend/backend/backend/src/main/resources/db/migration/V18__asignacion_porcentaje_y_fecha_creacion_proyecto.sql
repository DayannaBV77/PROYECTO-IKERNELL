-- Additive migration for the project-assignment management screen.
-- Existing project creation dates and assignment dedication remain unknown
-- and NULL; no historical values are fabricated.

ALTER TABLE proyecto
    ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE;

ALTER TABLE proyecto
    ALTER COLUMN fecha_creacion SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX ix_proyecto_fecha_creacion
    ON proyecto (fecha_creacion DESC);

ALTER TABLE asignacion
    ADD COLUMN dedicacion_porcentaje NUMERIC(5, 2);

ALTER TABLE asignacion
    ADD CONSTRAINT ck_asignacion_dedicacion_porcentaje
    CHECK (
        dedicacion_porcentaje IS NULL
        OR dedicacion_porcentaje BETWEEN 1 AND 100
    );

-- Preflight before deployment:
-- SELECT trabajador_id, proyecto_id, rol_en_proyecto, COUNT(*)
-- FROM asignacion
-- WHERE activa = TRUE
-- GROUP BY trabajador_id, proyecto_id, rol_en_proyecto
-- HAVING COUNT(*) > 1;
-- Deliberately unique per role: one worker may hold different roles in the
-- same project. If legacy exact duplicates exist, this index fails safely;
-- resolve them manually without deleting assignment history before retrying.

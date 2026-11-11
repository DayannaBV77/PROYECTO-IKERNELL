-- Exact active duplicates must be reviewed before deployment. This index
-- deliberately permits different roles for the same worker/project pair.
CREATE UNIQUE INDEX IF NOT EXISTS uq_asignacion_trabajador_proyecto_rol_activa
    ON asignacion (trabajador_id, proyecto_id, rol_en_proyecto)
    WHERE activa = TRUE;

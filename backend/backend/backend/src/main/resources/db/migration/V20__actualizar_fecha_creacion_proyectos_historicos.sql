-- =============================================================================
-- V20: Actualizar fecha_creacion en proyectos históricos que quedaron en NULL
-- tras la migración aditiva V18.
-- =============================================================================

UPDATE proyecto
SET fecha_creacion = COALESCE(
    fecha_creacion,
    (SELECT MIN(a.fecha_asignacion)::timestamp with time zone FROM asignacion a WHERE a.proyecto_id = proyecto.id),
    CURRENT_TIMESTAMP
)
WHERE fecha_creacion IS NULL;

CREATE UNIQUE INDEX uq_rol_trabajador_activo
    ON rol_trabajador (trabajador_id, proyecto_id, rol_id)
    WHERE activa = TRUE;

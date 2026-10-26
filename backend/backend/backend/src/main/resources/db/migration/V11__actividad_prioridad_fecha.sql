-- =============================================================================
-- Etapa 3: prioridad y fecha planificada de una actividad
--
-- Cubre: habilita RF-038, el panel «Mi Dia».
--
-- POR QUE SE ANADEN. RF-019 (registrar actividades) solo exige proyecto, etapa,
-- desarrollador y descripcion, y eso es lo que V4 creo. Pero RF-038 enumera
-- entre sus ENTRADAS "las actividades asignadas y sus fechas, estados y
-- prioridades registradas", y exige mostrar "las actividades pendientes
-- asignadas al desarrollador para el dia actual, ORDENADAS POR PRIORIDAD".
--
-- Es decir: RF-038 da por registrado un dato que RF-019 no recoge. La
-- contradiccion se resuelve del unico modo que no inventa alcance -anadir los
-- dos campos que RF-038 nombra- y queda ANOTADA para el catalogo: RF-019 y
-- HU-13 deberian mencionarlos, porque es el lider quien los diligencia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- prioridad
--
-- PENDIENTE D-29: ningun documento enumera las prioridades. La PROPUESTA del
-- enum PrioridadActividad es ALTA / MEDIA / BAJA, el minimo que permite un
-- orden, pero la columna va SIN CHECK para no fijar en el esquema un dominio
-- que la empresa no ha definido. Mismo criterio que actividad.estado (D-04) y
-- proyecto.estado_operativo (D-03).
--
-- NULLABLE: las actividades ya registradas no tienen prioridad y no se les
-- puede inventar una. El panel las trata aparte en lugar de suponerlas MEDIA.
-- -----------------------------------------------------------------------------
ALTER TABLE actividad ADD COLUMN prioridad VARCHAR(10);

-- -----------------------------------------------------------------------------
-- fecha_planificada
--
-- El dia para el que el lider planifica la actividad. Es lo que permite
-- responder "las del dia actual" de RF-038.
--
-- DECISION D-30: el panel muestra las de fecha MENOR O IGUAL a hoy, no solo las
-- de hoy exacto, y marca las atrasadas. Con la lectura estricta una actividad
-- vencida desaparece del panel justo el dia en que mas importa. La decision vive
-- en la consulta, no en el esquema.
--
-- NULLABLE por el mismo motivo que la prioridad. Una actividad sin fecha no
-- aparece en el panel del dia, y el panel lo dice en lugar de ocultarla sin mas.
-- -----------------------------------------------------------------------------
ALTER TABLE actividad ADD COLUMN fecha_planificada DATE;

-- Sirve a la consulta del panel: las actividades de un desarrollador hasta una
-- fecha. El orden por prioridad no se indexa: el dominio sigue sin definir y
-- VARCHAR no ordena por severidad (ALTA < BAJA < MEDIA alfabeticamente), asi que
-- ordenar es tarea del codigo, no del indice.
CREATE INDEX ix_actividad_desarrollador_fecha ON actividad (desarrollador_id, fecha_planificada);

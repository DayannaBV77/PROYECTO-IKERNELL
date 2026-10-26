-- =============================================================================
-- Etapa 1-bis: la fase de una incidencia pasa a ser la etapa del proyecto
--
-- Afecta a: RF-023 (registrar errores), RF-024 (registrar interrupciones) y
-- RF-017 (reporte de interrupciones, que muestra la fase en cada fila).
--
-- DECISION D-36: la "fase del proyecto" SI es la "etapa del proyecto".
--
-- Esto REVIERTE la D-05 sobre la que se construyo V5, que declaraba lo
-- contrario y creo 'fase_proyecto' como catalogo transversal. La reversion la
-- respalda el propio catalogo de historias: HU-17 T1 y HU-18 T1 dejaban abierto
-- "y si las fases son las etapas de HU-11", de modo que la separacion nunca fue
-- una afirmacion de los documentos sino una decision de diseno, ahora resuelta
-- en el otro sentido.
--
-- Consecuencia que esta migracion NO puede expresar en el esquema: la etapa
-- pertenece a un proyecto concreto, asi que la etapa de una incidencia debe ser
-- una de las de SU proyecto. Una FK simple no alcanza para decirlo -haria falta
-- comparar dos columnas de tablas distintas- y por eso lo valida el servicio,
-- igual que ya hace 'actividad' con su etapa (ver V4).
--
-- Consecuencia en RN-08: a partir de ahora una etapa con errores o
-- interrupciones tampoco se puede eliminar. No se toca nada aqui: la regla vive
-- en el punto de extension VerificadorDependenciasEtapa, donde se registra un
-- verificador nuevo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Datos ya registrados (decision D-37)
--
-- Los 'fase_id' existentes apuntan al catalogo transversal y NO se pueden
-- remapear de forma mecanica: las etapas son distintas en cada proyecto y puede
-- que no exista ninguna equivalente. Emparejar por parecido de nombre seria
-- inventar una regla que no generaliza.
--
-- Por eso 'etapa_id' nace NULLABLE y se conserva el nombre del catalogo en
-- 'fase_historica'. Asi RNF-003 se cumple -el historial no se pierde ni se
-- falsea- y el reporte de RF-017 sigue teniendo un dato que mostrar en las
-- filas antiguas.
--
-- RN-10 (la fase es obligatoria) se mantiene en la forma que admite ambas
-- clases de fila: toda incidencia tiene o una etapa real o su fase historica.
-- Que las incidencias NUEVAS exijan etapa lo impone el DTO de registro con
-- @NotNull, no el esquema, que debe seguir aceptando las antiguas.
-- -----------------------------------------------------------------------------

-- error_proyecto ---------------------------------------------------------------
ALTER TABLE error_proyecto ADD COLUMN etapa_id       BIGINT;
ALTER TABLE error_proyecto ADD COLUMN fase_historica VARCHAR(80);

UPDATE error_proyecto e
   SET fase_historica = (SELECT f.nombre FROM fase_proyecto f WHERE f.id = e.fase_id);

ALTER TABLE error_proyecto DROP CONSTRAINT fk_error_fase;
ALTER TABLE error_proyecto DROP COLUMN fase_id;

ALTER TABLE error_proyecto
    ADD CONSTRAINT fk_error_etapa FOREIGN KEY (etapa_id) REFERENCES etapa (id);
ALTER TABLE error_proyecto
    ADD CONSTRAINT ck_error_fase_presente CHECK (etapa_id IS NOT NULL OR fase_historica IS NOT NULL);

CREATE INDEX ix_error_etapa ON error_proyecto (etapa_id);

-- interrupcion_proyecto --------------------------------------------------------
ALTER TABLE interrupcion_proyecto ADD COLUMN etapa_id       BIGINT;
ALTER TABLE interrupcion_proyecto ADD COLUMN fase_historica VARCHAR(80);

UPDATE interrupcion_proyecto i
   SET fase_historica = (SELECT f.nombre FROM fase_proyecto f WHERE f.id = i.fase_id);

ALTER TABLE interrupcion_proyecto DROP CONSTRAINT fk_interrupcion_fase;
ALTER TABLE interrupcion_proyecto DROP COLUMN fase_id;

ALTER TABLE interrupcion_proyecto
    ADD CONSTRAINT fk_interrupcion_etapa FOREIGN KEY (etapa_id) REFERENCES etapa (id);
ALTER TABLE interrupcion_proyecto
    ADD CONSTRAINT ck_interrupcion_fase_presente CHECK (etapa_id IS NOT NULL OR fase_historica IS NOT NULL);

CREATE INDEX ix_interrupcion_etapa ON interrupcion_proyecto (etapa_id);

-- -----------------------------------------------------------------------------
-- El catalogo transversal desaparece
--
-- Ya no lo referencia nada y mantenerlo invitaria a volver a usarlo. Sus seis
-- valores eran provisionales (D-25, "DEBEN confirmarse con la empresa") y
-- quedan preservados donde importa: en la fase_historica de las incidencias que
-- los usaron.
-- -----------------------------------------------------------------------------
DROP TABLE fase_proyecto;

# Registro de decisiones, reglas, ambigüedades y contradicciones

## Por qué existe este documento

El código de IKernell cita de forma sistemática identificadores como `D-04`,
`RN-05`, `A-02` o `C-06` para justificar por qué algo está implementado de una
manera y no de otra. Son más de 50 referencias repartidas entre el backend, el
frontend y las migraciones.

**Ninguno de esos identificadores estaba definido en un documento del
repositorio.** `git ls-files` sólo lista el PDF del caso de estudio, los tres
catálogos `.docx` y `backend/.../docs/base-de-datos.md`, y ninguno los enumera.
El resultado es que un comentario como «PENDIENTE D-27» señala correctamente que
hay algo sin decidir, pero no hay dónde comprobar qué es ni quién debe decidirlo.

Este documento cierra ese hueco. **El contenido de las entradas D-01 a D-28,
RN-01 a RN-16, A-01 a A-06 y C-03 a C-06 está reconstruido a partir de los
comentarios del propio código**, no de un original: donde el código no permite
reconstruir el enunciado, la entrada lo dice en lugar de suponerlo. Las entradas
**D-29 a D-37 son nuevas** y se tomaron durante la integración de «Mi Día» y del
chat contextual.

## Cómo leer los estados

| Estado | Significado |
|---|---|
| **CONFIRMADO** | Lo dice un requerimiento o una historia de usuario. No se discute. |
| **PROPUESTA** | Lo eligió el equipo porque los documentos no lo definen. Funciona, pero la empresa puede cambiarlo. |
| **PENDIENTE** | Falta que la empresa decida. El código deja el punto preparado y lo señala. |
| **RESUELTA** | Ya se decidió. Se indica cuándo y, si revirtió algo, qué. |

---

## Reglas de negocio (RN)

Reglas que el sistema hace cumplir. Casi todas son CONFIRMADAS: salen del
catálogo de requerimientos o de un criterio de aceptación.

| ID | Regla | Estado |
|---|---|---|
| RN-01 | La identificación de un trabajador no se puede duplicar. | CONFIRMADO (RF-001) |
| RN-02 | Nada se borra: se inhabilita o se despublica, para conservar el historial. La única excepción es eliminar una etapa, que RF-012 pide expresamente. | CONFIRMADO |
| RN-03 | El trabajador inhabilitado no inicia sesión ni recibe asignaciones nuevas. | CONFIRMADO (RF-007) |
| RN-04 | Un proyecto inhabilitado no recibe asignaciones de trabajadores. | CONFIRMADO (RF-003) |
| RN-05 | Un líder puede actuar como desarrollador en otro proyecto. El rol vive en la asignación, no en el tipo de trabajador. | CONFIRMADO (Caso de Estudio p.3) |
| RN-06 | Sólo el desarrollador asignado a una actividad puede ejecutarla. | CONFIRMADO (HU-16 C03) |
| RN-07 | Un desarrollador sólo ejecuta actividades que su líder registró antes. Se cumple por construcción: sólo el líder las crea. | CONFIRMADO |
| RN-08 | Una etapa con registros asociados no se elimina. Hoy la hacen cumplir cuatro tipos de registro: actividades, errores, interrupciones (desde D-36) e hilos de conversación. | CONFIRMADO (RF-012, HU-11 C05) |
| RN-09 | El identificador único del proyecto lo genera la base de datos. | CONFIRMADO (HU-08 C03) |
| RN-10 | Datos mínimos de una incidencia: tipo y fase para un error; tipo, fecha, duración y fase para una interrupción. | CONFIRMADO (HU-17, HU-18) |
| RN-11 | Credenciales inválidas y cuenta inhabilitada dan **el mismo** mensaje genérico, sin revelar cuál dato falló. | CONFIRMADO (HU-03 C03 y C04) |
| RN-13 | Un error de validación señala los campos faltantes **conservando lo ya diligenciado**. | CONFIRMADO (HU-02 C03, HU-04 C02, HU-08 C02, HU-11 C02, HU-13 C02) |
| RN-14 | Una consulta sin resultados devuelve un aviso explicativo, no una lista vacía. | CONFIRMADO (HU-05 C02, HU-09 C02, HU-13 C04, HU-16 C04) |
| RN-16 | Una asignación equivalente ya activa produce una advertencia con confirmación, no un bloqueo. | CONFIRMADO (HU-06 C04) |

**RN-12 y RN-15 no se citan en ninguna parte del código.** O no existieron o se
abandonaron; su enunciado no se puede reconstruir.

---

## Decisiones (D)

### Resueltas

| ID | Decisión | Nota |
|---|---|---|
| D-01 | La cuenta de acceso es una entidad separada del perfil del trabajador. | Distingue datos del perfil de mecanismos de autenticación. |
| D-05 | La «fase del proyecto» de las incidencias **NO** es la «etapa del proyecto». | **REVERTIDA por D-36.** Sobre ella se construyó V5; V9 la deshizo. |
| D-28 | El motor de base de datos es PostgreSQL 17; H2 queda para las pruebas. | Ver `docs/base-de-datos.md`. |
| D-36 | La «fase del proyecto» de errores e interrupciones **SÍ es la etapa del proyecto**. | Decidida el 2026-10-25. Revierte D-05. Implementada en V9. |

### Propuestas del equipo (los documentos no las definen)

| ID | Propuesta | Dónde vive |
|---|---|---|
| D-08 | Una asignación «equivalente» es la que coincide en trabajador, proyecto **y rol**, y sigue activa. | `AsignacionRepository` |
| D-11 | Formatos y límites de la fotografía de perfil: JPEG/PNG, 2 MB. | `application.properties` |
| D-21 | Los roles asignables son `LIDER` y `DESARROLLADOR`, apoyándose en que RF-003 asigna «trabajadores» y RF-009 «desarrolladores». | `RolEnProyecto` |
| D-22 | Se captura el líder responsable del proyecto aunque ningún RF lo declare, porque HU-10 habla de «su proyecto». **No se usa para autorizar** (ver A-02). | `Proyecto` |
| D-29 | Prioridades de una actividad: `ALTA / MEDIA / BAJA`. | `PrioridadActividad` |
| D-30 | «Del día» son las actividades de fecha **menor o igual** a hoy, marcando las atrasadas. Con la lectura estricta, una actividad vencida desaparecería del panel justo el día en que más importa. | `ServicioMiDia` |
| D-31 | «Pendiente» es sin ninguna ejecución finalizada. No se usa `actividad.estado` porque su dominio sigue sin definir (D-04). | `ServicioMiDia` |
| D-32 | Se implementan sólo los hilos contextuales de RF-037, no el chat libre de RF-028. RF-037 y HU-22 están especificados al detalle; RF-028 no (D-12). | `ServicioHilos`, V10 |
| D-33 | El acceso a un hilo lo da una **asignación activa en el proyecto, con cualquier rol**. Es lo que dice HU-22 literalmente. | `ServicioHilos` |
| D-34 | «Mi Día» es una sección de la pantalla de inicio (`/app`), no una ruta aparte, porque RF-038 lo pide «como parte de su pantalla de inicio». | `PaginaPanel.jsx` |
| D-35 | Del correo se informa el **estado del acceso**, no un contador de no leídos. Ver «Lo que no se puede cumplir». | `NotificacionesResponse` |
| D-37 | Las incidencias registradas antes de D-36 conservan su fase antigua en `fase_historica` y quedan con `etapa_id` nulo. No se remapean: las etapas son distintas en cada proyecto y emparejar por nombre sería inventar una regla. | V9 |
| D-38 | Se ofrece el catálogo de áreas y tecnologías solicitado para nuevas selecciones, con categorías independientes. Las selecciones se almacenan aparte y no se convierten ni sobrescriben los textos históricos de especialidad. | Decisión autorizada el 2026-10-27; V12 y gestión de trabajadores |
| D-39 | El estado operativo registra `EN_EJECUCION` al iniciar y `FINALIZADO` al cerrar. Las fechas reales se fijan en esas acciones; los proyectos existentes quedan sin fechas. Se permite finalizar después de seis años y se informa el exceso. Los líderes pueden ejecutar ambas acciones según el rol actual del módulo. | Decisión autorizada el 2026-10-27; V13 y ciclo de vida de proyectos |
| D-40 | Las tareas personales del checklist de «Mi Día» viven en `tarea_mi_dia`, separadas de `actividad`: no pertenecen a un proyecto ni a una etapa y sólo las administra su dueño. Marcar una actividad finaliza o reabre su ejecución real (D-31); una tarea personal usa su propia columna `completada`. | `ServicioTareasMiDia`, V16 |

### Pendientes de la empresa

Cada una está señalada en el código en el punto exacto donde habrá que aplicarla.

| ID | Qué falta decidir | Bloquea |
|---|---|---|
| D-02 | Qué campos del proyecto son modificables si la lista se amplía. | RF-014 |
| D-03 | Fórmula de avance (por actividades cerradas, por etapas, ponderada; si las etapas tienen peso). Los estados operativos se resolvieron en D-39. | RF-016, HU-12 |
| D-04 | **Los estados posibles de una actividad.** La columna existe pero ninguna operación la escribe. | RF-022, y de rebote D-09 y D-31 |
| D-06 | Los tipos de error. | RF-023 |
| D-07 | Los tipos de interrupción y la unidad de duración. Se guarda valor + unidad para no migrar datos cuando se decida. | RF-024, RF-017 |
| D-09 | Qué indicadores debe mostrar el reporte de desempeño. | RF-006, HU-07 |
| D-12 | **Qué funciones tendrá el chat corporativo y si vive dentro del aplicativo o fuera.** | RF-028 |
| D-13 | **Cómo se integra el correo corporativo.** Hoy es un enlace configurable. | RF-031, y el contador de «Mi Día» |
| D-17 | Si profesión y el campo histórico de especialidad son texto libre o catálogos cerrados. El catálogo nuevo de áreas y tecnologías se gestiona aparte por D-38. | RF-001 |
| D-18 | Cómo se aprovisiona la primera cuenta de coordinador y con qué contraseña inicial. | RF-027 |
| D-19 | Si el correo de acceso es el mismo del servicio de correo de RF-031. | RF-027, RF-031 |
| D-23 | Cómo deja de estar activa una asignación. Hoy sólo se crean activas. | RF-003 |
| D-24 | Si asignar una actividad a alguien sin asignación en el proyecto debe bloquearse o sólo advertirse. Hoy advierte y pide confirmación. | RF-019 |
| D-25 | *(Obsoleta por D-36.)* Eran los valores del catálogo de fases, retirado en V9. | — |
| D-26 | Quién administra la biblioteca y los tutoriales. Hoy el coordinador. | RF-029, RF-030 |
| D-27 | Qué permisos tiene cada trabajador sobre la biblioteca. Hoy todo lo publicado es visible para cualquier autenticado. | RF-029 |

**D-10, D-14, D-15, D-16 y D-20 no se citan en ninguna parte del código.** Su
enunciado no se puede reconstruir.

---

## Ambigüedades (A)

Puntos donde los documentos admiten más de una lectura y el código eligió una.

| ID | Ambigüedad | Qué se hizo |
|---|---|---|
| A-01 | Si el coordinador puede consultar el módulo de proyectos completo. | Se le da sólo la lista resumida que necesita para asignar, sin abrir el módulo. |
| A-02 | **Si un líder puede intervenir en proyectos de otro líder.** | Sin resolver. El dato del líder responsable se captura (D-22) pero **no se usa para autorizar**. Consecuencia: un líder sin asignación queda fuera de los hilos de su propio proyecto (ver D-33). |
| A-03 | Si el líder puede consultar el registro completo de trabajadores. | Se le dan sólo los candidatos a su equipo, no el registro. |
| A-04 | Si «ejecutar una actividad» es un estado o un historial. | Entidad propia `EjecucionActividad`: HU-16 pide «dejar registrado el trabajo» y HU-07 necesitará ese historial. |
| A-06 | Cómo representar un flujo de confirmación en dos pasos en una API sin estado. | La operación se repite con `confirmado=true`. |

**A-05 no se cita en ninguna parte del código.**

---

## Contradicciones (C)

| ID | Contradicción | Resolución |
|---|---|---|
| C-03 | RF-005 lista los campos editables de un trabajador, y la identificación no está entre ellos aunque RF-001 la pida al registrar. | La identificación **no es editable**: el cliente no tiene forma de enviarla. |
| C-04 | «Estado del proyecto» designa dos cosas distintas en los documentos. | Se separan: `estadoHabilitacion` (dominio cerrado) y `estadoOperativo` (ciclo de ejecución resuelto en D-39). |
| C-06 | HU-17 C05 y HU-18 C05 dicen que «sólo el desarrollador» registra incidencias, pero el Caso de Estudio permite que un líder sea desarrollador de otro proyecto. | Se comprueba la **asignación** y no el tipo global: el coordinador y el líder quedan fuera, pero el líder asignado como desarrollador sí puede registrar allí. |

**C-01, C-02 y C-05 no se citan en ninguna parte del código.**

---

## Lo que RF-038 pide y no se puede cumplir

**El contador de correos sin leer del panel «Mi Día».** RF-031 resuelve el correo
corporativo como un enlace autorizado a un servicio externo, y D-13 deja la
integración técnica por confirmar: el aplicativo no tiene acceso al buzón, de
modo que no puede saber cuántos mensajes sin leer hay.

El panel entrega el estado del acceso y un aviso que lo explica (D-35), **no un
cero**, que el usuario leería como «no tiene correos nuevos». Para cumplir esta
parte del requerimiento hace falta resolver D-13 con una integración que exponga
el buzón.

El chat, en cambio, sí se entrega completo: el panel lista las conversaciones
con mensajes ajenos posteriores a la última lectura y muestra el total como
indicador. Se calcula sobre los hilos a los que el trabajador tiene acceso, con
la tabla `lectura_hilo` de V10.

---

## Inconsistencias detectadas en los catálogos

Hallazgos del análisis de los documentos. **No se corrigieron**: los catálogos
son entregables y su modificación corresponde al equipo que los mantiene.

| # | Hallazgo | Severidad |
|---|---|---|
| I-1 | RF-038 depende de dos requerimientos abiertos: pide no leídos de chat y correo, pero RF-028 está «por definir» (D-12) y RF-031 es un enlace externo con integración «por confirmar» (D-13). | Alta |
| I-2 | RF-038 vincula HU-05 y HU-14, y **ambas son incorrectas**. HU-05 es búsqueda y modificación de perfiles por el *coordinador*; HU-14 es el reporte de actividades del *líder*. Las que sostienen el panel son HU-16, HU-18, HU-20 y HU-03 C02. | Alta |
| I-3 | **No existe historia de usuario para «Mi Día».** HU-22 cubre el chat contextual; el panel se queda sin HU propia. | Alta |
| I-4 | HU-22 cita «RF29 – Ofrecer biblioteca de programas» y «RF30 – Publicar tutoriales», que no tienen relación con hilos; debería citar RF-037 y RF-028. Sus tareas 2 y 7 son copia-pega de HU-21, y su «HU Relacionada: HU-05» debería ser HU-03/HU-20. | Media |
| I-5 | **Numeración de RF desfasada entre documentos.** HU-03 cita «RF28 – Permitir inicio de sesión» (que en el catálogo es **RF-027**) y HU-20 cita «RF28 – Proporcionar chat corporativo» (que sí es RF-028). El mismo identificador designa dos requerimientos distintos. | Media |
| I-6 | El encabezado de la tabla de RF-038 dice «Gestionar hilos de conversación por proyecto y etapa»; su campo `Nombre` dice «Visualizar panel personalizado Mi Día». Copia-pega del RF anterior. | Baja |
| I-7 | `RolEnProyecto` sólo admite `LIDER` y `DESARROLLADOR`, pero RF-003 dice que los roles asignables incluyen coordinador y RF-037 lista al coordinador como actor del chat. **En el modelo actual un coordinador no puede tener relación con un proyecto**, así que no hay dato con el que autorizarlo en un hilo. | Media |
| I-8 | RF-037 y RF-038 tienen prioridad *Media*, pero RF-028 —del que depende el chat— es *Alta* y está sin implementar. | Media |
| I-9 | **RF-019 no pide prioridad ni fecha al registrar una actividad, pero RF-038 las enumera entre sus entradas** y exige ordenar por prioridad. RF-019 y HU-13 deberían mencionarlas, porque es el líder quien las diligencia. Los RNF tampoco se actualizaron: RNF-001 no lista HU-22, y RNF-002 dice «HU-01 a HU-2» (truncado). | Media |

---

## Cómo mantener este documento

Los identificadores se citan desde el código, de modo que la lista completa de
referencias se obtiene así:

```bash
grep -rnoE '\b(D|RN|A|C)-[0-9]{2}\b' \
  backend/backend/backend/src frontend/src \
  backend/backend/backend/docs | sort -u
```

Al tomar una decisión nueva, se añade aquí **antes** de citarla en un comentario,
para que no vuelva a haber identificadores sin definición. Al cerrar una
pendiente, se mueve a «Resueltas» indicando la fecha y, si revierte otra, cuál.

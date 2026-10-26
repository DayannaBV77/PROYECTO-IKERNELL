# Base de datos

## Motor

PostgreSQL 17. Reemplaza al H2 en archivo que se usaba antes en desarrollo.

El cambio se hizo para poder administrar el esquema con **pgAdmin 4**: con H2
embebido las tablas, restricciones y datos solo eran visibles desde la consola
de la propia aplicacion, lo que dificultaba revisar el modelo relacional que el
Caso de Estudio ADSI 2017 pide documentar.

H2 sigue en el proyecto, pero con `scope` de pruebas: la suite arranca un
esquema en memoria y por tanto **no necesita que el servidor este arriba**.

| Entorno     | Motor            | Esquema                      |
|-------------|------------------|------------------------------|
| desarrollo  | PostgreSQL local | persistente, en un volumen   |
| pruebas     | H2 en memoria    | se crea y destruye por corrida |

El ESQUEMA sigue sin ser definitivo. Flyway es la unica fuente de verdad
(`src/main/resources/db/migration`) e Hibernate solo valida que las entidades
coincidan: `spring.jpa.hibernate.ddl-auto=validate` nunca genera ni altera
tablas.

## Datos de conexion

| Dato       | Valor       |
|------------|-------------|
| Host       | `localhost` |
| Puerto     | `5432`      |
| Base       | `ikernell`  |
| Usuario    | `ikernell`  |
| Contrasena | `senafactory*` |

Son credenciales **de desarrollo**; no deben usarse fuera de la maquina local.
El puerto se publica solo en `127.0.0.1`, de modo que el servidor no queda
expuesto a la red.

### De donde las lee la aplicacion: el archivo `.env`

Ninguna credencial vive en los `.properties`. Salen de `.env`, que **no se
versiona**; lo versionado es la plantilla `.env.example`.

```bash
cp .env.example .env     # y poner la contrasena real
```

Spring Boot no lee `.env` por su cuenta. Se carga con el mecanismo nativo
`spring.config.import`, sin librerias de terceros:

```properties
spring.config.import=optional:file:./.env[.properties]
```

- `optional:` deja arrancar aunque no exista, que es lo que necesita la suite
  de pruebas (usa H2 y no pide credenciales).
- `[.properties]` es **obligatorio**: sin el, Spring no sabe interpretar un
  archivo con extension `.env` y falla al arrancar.

`.env` es un archivo de **propiedades**, no un script de shell: sin `export` y
sin comillas alrededor del valor (quedarian dentro de la contrasena).

`IKERNELL_DB_PASSWORD` no tiene valor por omision a proposito: ponerlo
significaria que, al faltar `.env`, la aplicacion se conectaria igual con una
clave de ejemplo y el error apareceria mucho despues.

Sin `.env` el arranque aborta en el acto -gracias a
`hikari.initialization-fail-timeout`- pero con este mensaje:

```
FATAL: password authentication failed for user "ikernell"
```

Apunta a la clave, no al archivo que falta. **Si ve ese error, lo primero que
hay que revisar es que exista `.env`.**

## Pool de conexiones (HikariCP)

| Propiedad | Valor | Por que |
|---|---|---|
| `maximum-pool-size` | 10 | PostgreSQL reserva memoria por conexion y la cuenta contra `max_connections` (100 por omision). Un pool pequeno y estable rinde mas que uno grande: el cuello de botella son los nucleos y los discos, no las conexiones abiertas. |
| `minimum-idle` | 2 | Evita pagar el coste de abrir conexion en cada rafaga. |
| `connection-timeout` | 30 s | Lo que espera una peticion por una conexion libre antes de fallar. |
| `max-lifetime` | 30 min | Por debajo de cualquier tiempo de corte de red intermedio. |
| `leak-detection-threshold` | 20 s | Avisa en el log si una conexion no vuelve al pool: el sintoma de una transaccion que quedo abierta. |
| `initialization-fail-timeout` | 10 s | Falla al arrancar si la base no responde, en vez de aceptar peticiones que reventarian una por una. |

El tamano se ajusta desde `.env` con `IKERNELL_DB_POOL_MAXIMO` y
`IKERNELL_DB_POOL_MINIMO`.

El estado del pool en vivo se consulta en
`GET /api/diagnostico/base-de-datos`.

## Zona horaria

El contenedor corre en `America/Bogota`, **no** en UTC.

No es un detalle cosmetico. El esquema guarda `TIMESTAMP WITHOUT TIME ZONE` y
las entidades usan `LocalDateTime`: es decir, hora de pared de la aplicacion.
Con el contenedor en UTC, todo lo que la base de datos resuelve por su cuenta
quedaba 5 horas adelantado respecto a lo que escribe la aplicacion. Afectaba a
`asignacion.fecha_asignacion`, que tiene `DEFAULT CURRENT_DATE` y despues de
las 19:00 habria registrado la fecha del dia siguiente, y a cualquier reporte
por periodo.

Se configura en la unidad Quadlet con `TZ` y `PGTZ`.

## El servidor

Corre en un contenedor de podman sin privilegios de root, administrado por
systemd de usuario con una unidad Quadlet:

- Unidad: `~/.config/containers/systemd/ikernell-postgres.container`
- Volumen de datos: `ikernell-pgdata`

Los datos viven en el volumen, no en el contenedor: **recrear el contenedor no
borra la base de datos**.

```bash
systemctl --user status ikernell-postgres   # ver estado
systemctl --user start ikernell-postgres    # arrancar
systemctl --user stop ikernell-postgres     # detener
systemctl --user restart ikernell-postgres  # reiniciar
```

Arranca solo al iniciar sesion. Con `loginctl enable-linger senafactory` -ya
aplicado- tambien arranca al encender el equipo sin necesidad de iniciar
sesion grafica.

Si se edita la unidad hay que recargar los generadores:

```bash
systemctl --user daemon-reload
systemctl --user restart ikernell-postgres
```

## Conectar pgAdmin 4

1. Abrir pgAdmin 4.
2. Clic derecho en *Servers* > *Register* > *Server...*
3. Pestana **General**: en *Name* poner `IKernell (desarrollo)`.
4. Pestana **Connection**:
   - *Host name/address*: `localhost`
   - *Port*: `5432`
   - *Maintenance database*: `ikernell`
   - *Username*: `ikernell`
   - *Password*: `ikernell` (marcar *Save password* para no repetirla)
5. *Save*.

Las tablas quedan en
`IKernell (desarrollo) > Databases > ikernell > Schemas > public > Tables`.

> pgAdmin 4 esta instalado como flatpak. Comparte la red del equipo
> (`shared=network`), asi que `localhost` dentro de pgAdmin es el mismo
> `localhost` del servidor.

## Consola psql

```bash
podman exec -it ikernell-postgres psql -U ikernell -d ikernell
```

Ordenes utiles: `\dt` lista las tablas, `\d trabajador` describe una tabla,
`\q` sale.

## Esquema actual

Once migraciones aplicadas, dieciseis tablas mas el historial de Flyway:

| Migracion | Tablas                                            |
|-----------|---------------------------------------------------|
| V1        | `trabajador`, `cuenta_acceso`                     |
| V2        | `proyecto`, `etapa`                               |
| V3        | `asignacion`                                      |
| V4        | `actividad`, `ejecucion_actividad`                |
| V5        | `fase_proyecto`, `error_proyecto`, `interrupcion_proyecto` |
| V6        | `contenido_publico`, `consulta_publica`           |
| V7        | `recurso_interno`                                 |
| V8        | `registro_operacion`                              |
| V9        | retira `fase_proyecto`; `etapa_id` en las dos de incidencias |
| V10       | `hilo_conversacion`, `mensaje_hilo`, `lectura_hilo` |
| V11       | columnas `prioridad` y `fecha_planificada` en `actividad` |

Las migraciones estaban escritas en SQL portable (`GENERATED BY DEFAULT AS
IDENTITY`, `BOOLEAN`, `NUMERIC`, `TIMESTAMP`), de modo que el cambio de motor no
exigio reescribir ninguna.

### V9: la fase de una incidencia es la etapa del proyecto (D-36)

V5 se construyo sobre la **D-05**, que declaraba que la "fase del proyecto" NO
era la "etapa del proyecto" y creaba `fase_proyecto` como catalogo transversal
con seis valores provisionales. La **D-36 revierte esa decision**: la fase SI es
la etapa, de modo que `error_proyecto` e `interrupcion_proyecto` apuntan ahora a
`etapa` y el catalogo desaparece.

Dos consecuencias que no se ven en el diagrama:

- **La etapa debe pertenecer al proyecto de la incidencia.** Son dos columnas de
  tablas distintas, asi que ninguna restriccion del esquema puede expresarlo: lo
  valida `ServicioIncidencias` reutilizando `ServicioEtapas.obtener(proyectoId,
  etapaId)`, igual que `actividad` con su etapa.
- **Ya no se puede registrar una incidencia en un proyecto sin etapas**, porque
  la etapa es el dato que RN-10 declara obligatorio.

**Registros anteriores (D-37):** sus `fase_id` apuntaban al catalogo y no se
pueden remapear mecanicamente -las etapas son distintas en cada proyecto-, asi
que `etapa_id` es NULLABLE y V9 copia el nombre de la fase a `fase_historica`.
Un CHECK exige que toda incidencia tenga uno de los dos. Las incidencias nuevas
exigen etapa por el `@NotNull` del DTO de registro, no por el esquema, que debe
seguir aceptando las antiguas.

### V10: hilos de conversacion por proyecto y etapa (RF-037)

`hilo_conversacion` tiene `proyecto_id` obligatorio y `etapa_id` opcional,
porque HU-22 contempla las dos formas: hilos del proyecto (C01) y hilos de una
etapa (C03). Aqui SI conviven las dos columnas, a diferencia de `actividad`: un
hilo de proyecto no tiene etapa de la que derivar el proyecto. Que la etapa,
cuando existe, sea de ese proyecto lo valida el servicio.

`lectura_hilo` guarda hasta que instante ha leido cada trabajador en cada hilo,
y es lo que hace computable el "no leido" que RF-038 pide mostrar en el panel
del desarrollador. Se guarda un instante y no una marca por mensaje: basta para
saber que hay despues de lo ya visto y no crece con el numero de mensajes.

**Precision de las marcas de tiempo.** Las fechas del modulo se truncan a
MICROSEGUNDOS antes de guardarse. `LocalDateTime.now()` tiene precision de
nanosegundos, pero una columna `TIMESTAMP` almacena microsegundos -tanto en
PostgreSQL como en H2- y **redondea** al guardar. Sin truncar, el valor que
vuelve de la base puede ser mayor que el que se comparo, y un mensaje que acaba
de darse por leido seguiria contando como no leido.

Estas tres tablas NO cubren RF-028 (chat corporativo libre: conversaciones
individuales, grupos, disponibilidad), que sigue bloqueado por D-12.

### V11: prioridad y dia planificado de una actividad (habilita RF-038)

RF-019 solo exige proyecto, etapa, desarrollador y descripcion, y eso es lo que
V4 creo. Pero **RF-038 enumera entre sus entradas "las actividades asignadas y
sus fechas, estados y prioridades registradas"** y exige mostrar las del dia
"ordenadas por prioridad". Es decir, RF-038 da por registrado un dato que RF-019
no recoge; la contradiccion se resuelve anadiendo los dos campos que RF-038
nombra, y queda anotada para el catalogo (RF-019 y HU-13 deberian mencionarlos,
porque es el lider quien los diligencia).

Las dos columnas son **NULLABLE y sin CHECK**:

- Nullable porque las actividades ya registradas no las tienen y no se les puede
  inventar un valor. El panel del dia las trata aparte en lugar de suponerlas.
- Sin CHECK porque **D-29 sigue abierta**: ningun documento enumera las
  prioridades. `ALTA / MEDIA / BAJA` es la PROPUESTA del enum
  `PrioridadActividad`, no un dominio acordado. Mismo criterio que
  `actividad.estado` (D-04) y `proyecto.estado_operativo` (D-03).

El orden por prioridad **no se indexa**: `VARCHAR` ordena alfabeticamente
(`ALTA < BAJA < MEDIA`), que no es la severidad, asi que ordenar es tarea del
codigo. El indice que si existe, `ix_actividad_desarrollador_fecha`, sirve a la
consulta del panel: las actividades de un desarrollador hasta una fecha.

**Decision D-30:** el panel muestra las actividades de fecha MENOR O IGUAL a
hoy, no solo las de hoy exacto, y marca las atrasadas. Con la lectura estricta
una actividad vencida desapareceria del panel justo el dia en que mas importa.
La decision vive en la consulta, no en el esquema.

## Partir de cero

Borra TODOS los datos. Flyway vuelve a crear el esquema al arrancar la
aplicacion, y el perfil `dev` siembra de nuevo el coordinador inicial:

```bash
systemctl --user stop ikernell-postgres
podman volume rm ikernell-pgdata
systemctl --user start ikernell-postgres
```

## Verificar que todo funciona

```bash
./scripts/verificar-base-de-datos.sh
```

Son dos partes, porque fallan por motivos distintos:

1. **La base de datos, sin la aplicacion.** Contenedor arriba, autenticacion,
   migraciones aplicadas, ninguna fallida, y una escritura real. Si esto falla,
   el problema es el servidor o las credenciales, no el backend.
2. **El backend de punta a punta.** Inicia sesion, consulta el diagnostico,
   inserta un trabajador por la API, **comprueba en SQL que la fila existe**,
   verifica que la operacion quedo en la bitacora y borra el dato de prueba.

La parte 2 se salta sola si el backend no esta arriba, para que el script siga
sirviendo antes de arrancarlo.

### Endpoints de diagnostico

Reservados al **COORDINADOR**. No estan bajo `/api/publico` a proposito: lo que
devuelven -servidor, usuario, nombres de tablas, version del esquema- describe
la instalacion, y eso no debe quedar al alcance de un visitante anonimo
(HU-01 C05).

| Endpoint | Para que |
|---|---|
| `GET /api/diagnostico/base-de-datos` | Motor, URL, usuario, hora del servidor, version del esquema, tablas y estado del pool. Abre una conexion real y consulta: un pool creado no demuestra que la base responda. |
| `GET /api/diagnostico/operaciones?cuantas=20&soloFallos=true` | Ultimas operaciones de la bitacora. |

## Registro de operaciones (bitacora)

Dos destinos, con propositos distintos:

- **Consola**: el detalle para depurar. En el perfil `dev` se imprimen el SQL,
  **los parametros reales** y los limites de cada transaccion, que es lo que
  permite comprobar que se inserto exactamente lo que se esperaba.
- **Tabla `registro_operacion`**: la trazabilidad que sobrevive al reinicio
  (RNF-003).

### Que se registra

| | Consola | Tabla |
|---|---|---|
| Escrituras (POST, PUT, PATCH, DELETE) | si | si |
| Peticiones fallidas (>= 400) | si, con el mensaje | si, con el mensaje |
| Consultas de solo lectura | si (el SQL) | **no** |
| SQL y parametros de Hibernate | si (solo en `dev`) | no |

Las consultas de lectura no se anotan en la tabla: son la mayoria del trafico y
guardarlas la haria crecer mas rapido que los propios datos del negocio, sin
aportar trazabilidad.

**No se guarda el cuerpo de la peticion.** Lleva contrasenas en el login y datos
personales en RF-001, y una bitacora no debe volverse una segunda copia sin
proteger de esos datos. Se guarda el *que* (metodo, ruta, resultado, quien,
duracion), no el contenido.

### Dos decisiones que no son obvias

**El registro usa `Propagation.REQUIRES_NEW`.** Sin eso, anotar un error seria
inutil: el registro se uniria a la transaccion del negocio, y esa transaccion
es precisamente la que se deshace cuando algo falla, asi que el rastro del
fallo desapareceria junto con el fallo.

**El filtro va el PRIMERO de la cadena** (`HIGHEST_PRECEDENCE`), envolviendo a
Spring Security, para ver el codigo HTTP definitivo. Situado al final quedaba
*dentro* de la cadena de seguridad y un 403 de `@PreAuthorize` se anotaba como
"200 exitosa": la bitacora daba por buenas operaciones que el sistema habia
rechazado. El precio es que el contexto de seguridad ya esta limpio al volver,
por lo que el autor de la operacion se lee de la sesion HTTP.

### Consultar la bitacora

```sql
-- Ultimas operaciones
SELECT ocurrida_en, metodo, ruta, codigo_http, correo, duracion_ms
FROM registro_operacion ORDER BY ocurrida_en DESC LIMIT 20;

-- Solo lo que fallo
SELECT ocurrida_en, metodo, ruta, codigo_http, detalle_error
FROM registro_operacion WHERE NOT exitosa ORDER BY ocurrida_en DESC;

-- Las rutas mas lentas
SELECT ruta, COUNT(*), ROUND(AVG(duracion_ms)) AS ms_promedio
FROM registro_operacion GROUP BY ruta ORDER BY ms_promedio DESC;
```

En consola, para seguir solo la bitacora:

```bash
JAVA_HOME=/usr/lib/jvm/java-25 ./mvnw spring-boot:run | grep ikernell.auditoria
```

### Manejo de errores

| Situacion | Respuesta | Consola |
|---|---|---|
| Fallo de base de datos (`DataAccessException`) | 503, mensaje generico | traza completa, avisando que **no quedo persistido** |
| Excepcion inesperada | 500, mensaje generico | traza completa |
| Sin sesion / sin permiso | 401 / 403 | linea de la bitacora |

Las excepciones de Spring Security se **relanzan** desde el manejador
catch-all: atraparlas las convertiria todas en 500 y anularia de hecho el
control de acceso de RNF-001.

## Arrancar el backend

```bash
cd backend/backend/backend
JAVA_HOME=/usr/lib/jvm/java-25 ./mvnw spring-boot:run
```

Requiere JDK 21 o superior; el JDK 17 que el sistema trae por omision no sirve.

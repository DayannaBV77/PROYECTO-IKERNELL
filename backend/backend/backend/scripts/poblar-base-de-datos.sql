-- =============================================================================
-- IKernell Soluciones Software - Semilla completa de datos de prueba
--
-- Puebla la base de datos con un conjunto coherente, rico y realista de datos
-- para todos los módulos del sistema (Caso de Estudio ADSI 2017).
--
-- Todas las contraseñas de las cuentas de acceso son: Dev12345
-- Hash BCrypt: $2a$10$ly2TODJJzkXm2yLTKvZF2.Un6zQ5zgEXfiNHfuJ99wS167vj5iZ3W
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. TRABAJADORES (RF-001)
-- -----------------------------------------------------------------------------
-- El coordinador inicial (id 1, 1000000001) ya existe si Spring Boot arrancó en dev.
-- Se insertan los demás trabajadores si no existen aún.

INSERT INTO trabajador (id, identificacion, nombre, apellido, fecha_nacimiento, direccion, profesion, especialidad_desarrollo, tipo_trabajador, estado)
VALUES
  (1, '1000000001', 'Coordinador', 'Inicial', '1990-01-01', 'Sede principal IKernell', 'Ingeniería de Sistemas', 'Gestión de Proyectos', 'COORDINADOR', 'HABILITADO')
ON CONFLICT (identificacion) DO UPDATE
SET nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido,
    profesion = EXCLUDED.profesion,
    especialidad_desarrollo = EXCLUDED.especialidad_desarrollo;

INSERT INTO trabajador (identificacion, nombre, apellido, fecha_nacimiento, direccion, profesion, especialidad_desarrollo, tipo_trabajador, estado)
VALUES
  ('1010101010', 'Dayanna', 'Boada', '1993-05-14', 'Carrera 15 # 85-32, Bogotá', 'Ingeniería de Software', 'Dirección de Proyectos y Calidad', 'COORDINADOR', 'HABILITADO'),
  ('1000000002', 'Carlos', 'Mendoza', '1988-08-22', 'Calle 127 # 45-10, Bogotá', 'Ingeniería de Software', 'Arquitectura de Software y Metodologías Ágiles', 'LIDER', 'HABILITADO'),
  ('1000000003', 'Laura', 'Gómez', '1991-11-03', 'Carrera 7 # 72-15, Bogotá', 'Ingeniería Telemática', 'DevOps, CI/CD y Cloud Computing', 'LIDER', 'HABILITADO'),
  ('1000000004', 'Diego', 'Salazar', '1989-04-19', 'Avenida 68 # 26-40, Bogotá', 'Ingeniería de Sistemas', 'Analítica de Datos y Gestión de Proyectos', 'LIDER', 'HABILITADO'),
  ('1000000005', 'Andrés', 'Rojas', '1995-02-17', 'Transversal 38 # 55-20, Bogotá', 'Tecnología en Desarrollo de Software', 'Backend con Spring Boot, JPA y PostgreSQL', 'DESARROLLADOR', 'HABILITADO'),
  ('1000000006', 'Sofía', 'Martínez', '1996-07-29', 'Calle 53 # 21-08, Bogotá', 'Diseño y Programación Web', 'Frontend con React, TypeScript y Accesibilidad', 'DESARROLLADOR', 'HABILITADO'),
  ('1000000007', 'Mateo', 'Vargas', '1994-09-12', 'Carrera 50 # 100-15, Bogotá', 'Ingeniería de Sistemas', 'Microservicios, Docker y APIs REST', 'DESARROLLADOR', 'HABILITADO'),
  ('1000000008', 'Valentina', 'Castro', '1997-03-25', 'Calle 80 # 68B-12, Bogotá', 'Tecnología en Análisis y Desarrollo', 'Aplicaciones Móviles y Pruebas QA', 'DESARROLLADOR', 'HABILITADO'),
  ('1000000009', 'Camilo', 'Herrera', '1998-10-05', 'Diagonal 45 # 16-30, Bogotá', 'Tecnología en Informática', 'Bases de Datos Relacionales y Backend', 'DESARROLLADOR', 'HABILITADO'),
  ('1000000010', 'Mariana', 'Ortiz', '1996-12-01', 'Calle 134 # 19-45, Bogotá', 'Ingeniería de Software', 'Interfaces Web y Experiencia de Usuario (UI/UX)', 'DESARROLLADOR', 'HABILITADO'),
  ('1000000011', 'Felipe', 'Navarro', '1992-06-18', 'Carrera 30 # 45-00, Bogotá', 'Tecnología en Sistemas', 'Desarrollo Web en Python y Django', 'DESARROLLADOR', 'INHABILITADO')
ON CONFLICT (identificacion) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. CUENTAS DE ACCESO (RF-007, RNF-001)
-- Clave para todas las cuentas: Dev12345
-- -----------------------------------------------------------------------------
INSERT INTO cuenta_acceso (trabajador_id, correo_corporativo, password_hash, ultimo_acceso_en)
SELECT t.id, c.correo, '$2a$10$ly2TODJJzkXm2yLTKvZF2.Un6zQ5zgEXfiNHfuJ99wS167vj5iZ3W', c.ultimo_acceso
FROM (
  VALUES
    ('1000000001', 'coordinador@ikernell.com', CURRENT_TIMESTAMP),
    ('1010101010', 'dayanna.boada@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('1000000002', 'carlos.mendoza@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('1000000003', 'laura.gomez@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('1000000004', 'diego.salazar@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
    ('1000000005', 'andres.rojas@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
    ('1000000006', 'sofia.martinez@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
    ('1000000007', 'mateo.vargas@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
    ('1000000008', 'valentina.castro@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
    ('1000000009', 'camilo.herrera@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('1000000010', 'mariana.ortiz@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('1000000011', 'felipe.navarro@ikernell.com', CURRENT_TIMESTAMP - INTERVAL '15 days')
) AS c(ident, correo, ultimo_acceso)
JOIN trabajador t ON t.identificacion = c.ident
ON CONFLICT (correo_corporativo) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. PROYECTOS (RF-008, RF-015, RF-016)
-- -----------------------------------------------------------------------------
INSERT INTO proyecto (nombre, descripcion, estado_habilitacion, estado_operativo, lider_responsable_id)
SELECT p.nombre, p.descripcion, p.estado_hab, p.estado_op, t.id
FROM (
  VALUES
    ('Portal de Gestión Empresarial ERP', 'Sistema integral de recursos empresariales para automatizar contabilidad, inventario, talento humano y facturación electrónica.', 'HABILITADO', 'EN_PROCESO', '1000000002'),
    ('Plataforma Web de Comercio Electrónico', 'Solución de e-commerce omnicanal de alto rendimiento con pasarelas de pago PSE/Stripe, catálogo dinámico y notificaciones en tiempo real.', 'HABILITADO', 'EN_DESARROLLO', '1000000003'),
    ('App Móvil de Gestión de Incidentes', 'Aplicación móvil para reporte y seguimiento de fallos operativos en campo, soporte offline y geolocalización de eventos.', 'HABILITADO', 'EN_PRUEBAS', '1000000004'),
    ('Tablero Ejecutivo y Analítica BI', 'Plataforma de visualización de indicadores clave (KPIs), reportes de desempeño y métricas operativas automatizadas.', 'HABILITADO', 'PLANIFICADO', '1000000003'),
    ('Migración de Infraestructura y Servicios Legados', 'Modernización de microservicios e infraestructura interna hacia contenedores y cloud privado.', 'INHABILITADO', 'CANCELADO', '1000000002')
) AS p(nombre, descripcion, estado_hab, estado_op, lider_ident)
JOIN trabajador t ON t.identificacion = p.lider_ident
WHERE NOT EXISTS (SELECT 1 FROM proyecto WHERE proyecto.nombre = p.nombre);

-- -----------------------------------------------------------------------------
-- 4. ETAPAS (RF-010, RF-011, RF-012)
-- -----------------------------------------------------------------------------
INSERT INTO etapa (proyecto_id, nombre, descripcion, orden)
SELECT p.id, e.nombre, e.descripcion, e.orden
FROM proyecto p
CROSS JOIN LATERAL (
  VALUES
    -- Etapas Proyecto ERP
    ('Portal de Gestión Empresarial ERP', 'Levantamiento de Requerimientos y Casos de Uso', 'Especificación y validación de historias de usuario y catálogo de requerimientos funcionales y no funcionales.', 1),
    ('Portal de Gestión Empresarial ERP', 'Diseño de Base de Datos y Arquitectura de Software', 'Definición del modelo relacional, migraciones Flyway y estructura de componentes en Spring Boot.', 2),
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', 'Codificación de servicios de negocio, repositorios y validaciones transaccionales.', 3),
    ('Portal de Gestión Empresarial ERP', 'Pruebas de Integración y Aceptación de Usuario', 'Ejecución de pruebas unitarias, de integración con PostgreSQL y validación funcional.', 4),
    ('Portal de Gestión Empresarial ERP', 'Despliegue y Capacitación a Usuarios', 'Puesta en producción del aplicativo y sesiones de capacitación técnica al cliente.', 5),

    -- Etapas E-Commerce
    ('Plataforma Web de Comercio Electrónico', 'Especificación Funcional y Mockups UI/UX', 'Diseño de wireframes, guías de estilo y definición de flujos de compra del usuario.', 1),
    ('Plataforma Web de Comercio Electrónico', 'Desarrollo de API de Catálogo y Carrito', 'Implementación de controladores REST para productos, inventario en tiempo real y carrito persistente.', 2),
    ('Plataforma Web de Comercio Electrónico', 'Integración de Pasarelas de Pago y Seguridad', 'Conexión con pasarelas de pago seguras bajo estándares PCI-DSS y notificaciones webhooks.', 3),
    ('Plataforma Web de Comercio Electrónico', 'Pruebas de Carga y Rendimiento', 'Simulación de alta concurrencia y optimización del pool de conexiones HikariCP.', 4),

    -- Etapas App Móvil
    ('App Móvil de Gestión de Incidentes', 'Diseño de Interfaces y Experiencia de Usuario', 'Prototipos de navegación y diseño responsivo adaptado a dispositivos móviles.', 1),
    ('App Móvil de Gestión de Incidentes', 'Construcción de Vistas Móviles y Almacenamiento Offline', 'Desarrollo de la interfaz y sincronización de base de datos local SQLite para trabajo sin conexión.', 2),
    ('App Móvil de Gestión de Incidentes', 'Integración con Backend de Notificaciones', 'Conexión con servicios REST para sincronización remota y alertas push inmediatas.', 3),

    -- Etapas Analítica BI
    ('Tablero Ejecutivo y Analítica BI', 'Definición de Indicadores y Fuentes de Datos', 'Selección de métricas de negocio, fórmulas de cálculo y estructuración de fuentes de origen.', 1),
    ('Tablero Ejecutivo y Analítica BI', 'Modelado Dimensional y Pipelines ETL', 'Diseño del esquema de base de datos analítica y extracción automatizada de datos operativos.', 2)
) AS e(proy_nombre, nombre, descripcion, orden)
WHERE p.nombre = e.proy_nombre
ON CONFLICT (proyecto_id, nombre) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. ASIGNACIONES (RF-003, RF-009, RN-05)
-- RN-05: Carlos Mendoza es LÍDER en ERP y DESARROLLADOR en E-Commerce
-- -----------------------------------------------------------------------------
INSERT INTO asignacion (trabajador_id, proyecto_id, rol_en_proyecto, activa, asignada_por_id, fecha_asignacion)
SELECT tw.id, p.id, a.rol, a.activa, coord.id, a.fecha
FROM (
  VALUES
    -- Proyecto ERP
    ('Portal de Gestión Empresarial ERP', '1000000002', 'LIDER', true, CURRENT_DATE - INTERVAL '30 days'),
    ('Portal de Gestión Empresarial ERP', '1000000005', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '25 days'),
    ('Portal de Gestión Empresarial ERP', '1000000006', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '25 days'),
    ('Portal de Gestión Empresarial ERP', '1000000007', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '20 days'),
    ('Portal de Gestión Empresarial ERP', '1000000009', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '15 days'),

    -- Proyecto E-Commerce
    ('Plataforma Web de Comercio Electrónico', '1000000003', 'LIDER', true, CURRENT_DATE - INTERVAL '28 days'),
    ('Plataforma Web de Comercio Electrónico', '1000000002', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '22 days'), -- RN-05: Líder actúa como Desarrollador
    ('Plataforma Web de Comercio Electrónico', '1000000006', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '20 days'),
    ('Plataforma Web de Comercio Electrónico', '1000000008', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '18 days'),

    -- Proyecto App Móvil
    ('App Móvil de Gestión de Incidentes', '1000000004', 'LIDER', true, CURRENT_DATE - INTERVAL '20 days'),
    ('App Móvil de Gestión de Incidentes', '1000000008', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '18 days'),
    ('App Móvil de Gestión de Incidentes', '1000000007', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '16 days'),
    ('App Móvil de Gestión de Incidentes', '1000000010', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '15 days'),

    -- Proyecto Analítica BI
    ('Tablero Ejecutivo y Analítica BI', '1000000003', 'LIDER', true, CURRENT_DATE - INTERVAL '10 days'),
    ('Tablero Ejecutivo y Analítica BI', '1000000005', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '8 days'),
    ('Tablero Ejecutivo y Analítica BI', '1000000010', 'DESARROLLADOR', true, CURRENT_DATE - INTERVAL '8 days')
) AS a(proy_nombre, trab_ident, rol, activa, fecha)
JOIN proyecto p ON p.nombre = a.proy_nombre
JOIN trabajador tw ON tw.identificacion = a.trab_ident
JOIN trabajador coord ON coord.identificacion = '1000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM asignacion
  WHERE asignacion.proyecto_id = p.id
    AND asignacion.trabajador_id = tw.id
    AND asignacion.rol_en_proyecto = a.rol
);

-- -----------------------------------------------------------------------------
-- 6. ACTIVIDADES (RF-019, RF-038, V11)
-- Incluye actividades para hoy, atrasadas y futuras ordenadas por prioridad
-- -----------------------------------------------------------------------------
INSERT INTO actividad (etapa_id, desarrollador_id, descripcion, estado, prioridad, fecha_planificada)
SELECT e.id, dev.id, act.descripcion, act.estado, act.prioridad, act.fecha
FROM (
  VALUES
    -- Actividades para Andrés Rojas (1000000005) en ERP
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000005', 'Implementar autenticación JWT y refresh tokens con Spring Security', 'EN_PROCESO', 'ALTA', CURRENT_DATE),
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000005', 'Construir migraciones Flyway para auditoría y bitácora de transacciones', 'PENDIENTE', 'MEDIA', CURRENT_DATE),
    ('Portal de Gestión Empresarial ERP', 'Diseño de Base de Datos y Arquitectura de Software', '1000000005', 'Validar índices y optimización de planes de consulta en PostgreSQL', 'PENDIENTE', 'ALTA', CURRENT_DATE - INTERVAL '1 day'), -- Atrasada
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000005', 'Configurar pool de conexiones HikariCP con métricas en Micrometer', 'PENDIENTE', 'BAJA', CURRENT_DATE + INTERVAL '2 days'),
    ('Portal de Gestión Empresarial ERP', 'Levantamiento de Requerimientos y Casos de Uso', '1000000005', 'Revisar matriz de trazabilidad de requerimientos con el equipo de análisis', 'FINALIZADA', 'MEDIA', CURRENT_DATE - INTERVAL '10 days'),

    -- Actividades para Sofía Martínez (1000000006) en ERP y E-Commerce
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000006', 'Desarrollar vistas del panel «Mi Día» y consumo de API corporativa', 'EN_PROCESO', 'ALTA', CURRENT_DATE),
    ('Plataforma Web de Comercio Electrónico', 'Desarrollo de API de Catálogo y Carrito', '1000000006', 'Maquetar carrito de compras interactivo con Tailwind y tokens CSS', 'PENDIENTE', 'MEDIA', CURRENT_DATE),
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000006', 'Implementar modal accesible para registro de incidencias y reportes', 'PENDIENTE', 'BAJA', CURRENT_DATE - INTERVAL '2 days'), -- Atrasada

    -- Actividades para Mateo Vargas (1000000007)
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000007', 'Crear contenedor Docker y orquestación de servicios locales con Podman', 'FINALIZADA', 'MEDIA', CURRENT_DATE - INTERVAL '1 day'),
    ('App Móvil de Gestión de Incidentes', 'Construcción de Vistas Móviles y Almacenamiento Offline', '1000000007', 'Configurar sincronización en segundo plano para app móvil', 'PENDIENTE', 'ALTA', CURRENT_DATE + INTERVAL '1 day'),

    -- Actividades para Valentina Castro (1000000008)
    ('Plataforma Web de Comercio Electrónico', 'Integración de Pasarelas de Pago y Seguridad', '1000000008', 'Integrar SDK de pagos bancarios y validación de firmas digitales', 'PENDIENTE', 'ALTA', CURRENT_DATE),
    ('App Móvil de Gestión de Incidentes', 'Construcción de Vistas Móviles y Almacenamiento Offline', '1000000008', 'Construir pantallas de captura de incidencias y carga de evidencias fotográficas', 'PENDIENTE', 'MEDIA', CURRENT_DATE + INTERVAL '2 days'),

    -- Actividades para Carlos Mendoza (1000000002 como desarrollador en E-Commerce)
    ('Plataforma Web de Comercio Electrónico', 'Desarrollo de API de Catálogo y Carrito', '1000000002', 'Diseñar modelo relacional para órdenes de compra y cálculo de impuestos', 'FINALIZADA', 'ALTA', CURRENT_DATE - INTERVAL '3 days'),

    -- Actividades para Camilo Herrera (1000000009) y Mariana Ortiz (1000000010)
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', '1000000009', 'Construir endpoints REST para el módulo de cuentas por cobrar', 'PENDIENTE', 'MEDIA', CURRENT_DATE + INTERVAL '1 day'),
    ('Tablero Ejecutivo y Analítica BI', 'Modelado Dimensional y Pipelines ETL', '1000000010', 'Diseñar componentes visuales de gráficas y KPIs con Chart.js', 'PENDIENTE', 'ALTA', CURRENT_DATE + INTERVAL '3 days')
) AS act(proy_nombre, etapa_nombre, dev_ident, descripcion, estado, prioridad, fecha)
JOIN proyecto p ON p.nombre = act.proy_nombre
JOIN etapa e ON e.proyecto_id = p.id AND e.nombre = act.etapa_nombre
JOIN trabajador dev ON dev.identificacion = act.dev_ident
WHERE NOT EXISTS (
  SELECT 1 FROM actividad
  WHERE actividad.etapa_id = e.id
    AND actividad.desarrollador_id = dev.id
    AND actividad.descripcion = act.descripcion
);

-- -----------------------------------------------------------------------------
-- 7. EJECUCIÓN DE ACTIVIDADES (RF-022, HU-16)
-- -----------------------------------------------------------------------------
INSERT INTO ejecucion_actividad (actividad_id, ejecutada_por_id, iniciada_en, finalizada_en, observaciones)
SELECT ac.id, ac.desarrollador_id, ej.iniciada, ej.finalizada, ej.observaciones
FROM (
  VALUES
    ('Revisar matriz de trazabilidad de requerimientos con el equipo de análisis', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '4 hours', 'Se completó la verificación con el cliente y se cerraron 15 requerimientos funcionales.'),
    ('Crear contenedor Docker y orquestación de servicios locales con Podman', CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Contenedor PostgreSQL 17 verificado y configurado con Quadlet en systemd.'),
    ('Diseñar modelo relacional para órdenes de compra y cálculo de impuestos', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '5 hours', 'Esquema validado en 3ra forma normal con soporte de transacciones multi-moneda.'),
    ('Implementar autenticación JWT y refresh tokens con Spring Security', CURRENT_TIMESTAMP - INTERVAL '3 hours', NULL, 'Filtro de seguridad implementado, avanzando en manejo de expiración de tokens.'),
    ('Desarrollar vistas del panel «Mi Día» y consumo de API corporativa', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL, 'Diseño responsivo completado en React, enlazando endpoints de actividades e hilos.')
) AS ej(act_desc, iniciada, finalizada, observaciones)
JOIN actividad ac ON ac.descripcion = ej.act_desc
WHERE NOT EXISTS (
  SELECT 1 FROM ejecucion_actividad WHERE ejecucion_actividad.actividad_id = ac.id
);

-- -----------------------------------------------------------------------------
-- 8. INCIDENCIAS: ERRORES E INTERRUPCIONES (RF-017, RF-023, RF-024, D-36)
-- -----------------------------------------------------------------------------
INSERT INTO error_proyecto (proyecto_id, etapa_id, tipo_error, descripcion, fecha, registrado_por_id)
SELECT p.id, e.id, err.tipo, err.descripcion, err.fecha, reg.id
FROM (
  VALUES
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', 'ERROR_LOGICA', 'Desalineación en el redondeo del cálculo de IVA en facturación electrónica multi-item.', CURRENT_DATE - INTERVAL '4 days', '1000000005'),
    ('Portal de Gestión Empresarial ERP', 'Diseño de Base de Datos y Arquitectura de Software', 'ERROR_CONCURRENCIA', 'Bloqueo mutuo (deadlock) detectado al actualizar simultáneamente inventario y órdenes.', CURRENT_DATE - INTERVAL '8 days', '1000000002'),
    ('Plataforma Web de Comercio Electrónico', 'Desarrollo de API de Catálogo y Carrito', 'ERROR_SINTAXIS', 'Error en deserialización de payload JSON al procesar webhooks asíncronos de la pasarela.', CURRENT_DATE - INTERVAL '2 days', '1000000003'),
    ('App Móvil de Gestión de Incidentes', 'Construcción de Vistas Móviles y Almacenamiento Offline', 'DESBORDAMIENTO_MEMORIA', 'Consumo excesivo de memoria al renderizar listas de más de 500 registros con fotografías.', CURRENT_DATE - INTERVAL '1 day', '1000000008')
) AS err(proy_nombre, etapa_nombre, tipo, descripcion, fecha, reg_ident)
JOIN proyecto p ON p.nombre = err.proy_nombre
JOIN etapa e ON e.proyecto_id = p.id AND e.nombre = err.etapa_nombre
JOIN trabajador reg ON reg.identificacion = err.reg_ident
WHERE NOT EXISTS (
  SELECT 1 FROM error_proyecto
  WHERE error_proyecto.proyecto_id = p.id
    AND error_proyecto.tipo_error = err.tipo
    AND error_proyecto.fecha = err.fecha
);

INSERT INTO interrupcion_proyecto (proyecto_id, etapa_id, tipo_interrupcion, fecha, duracion_valor, duracion_unidad, registrado_por_id)
SELECT p.id, e.id, inter.tipo, inter.fecha, inter.duracion, inter.unidad, reg.id
FROM (
  VALUES
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', 'CORTE_ENERGIA', CURRENT_DATE - INTERVAL '3 days', 3.50, 'HORAS', '1000000005'),
    ('Portal de Gestión Empresarial ERP', 'Levantamiento de Requerimientos y Casos de Uso', 'FALLA_CONEXION_INTERNET', CURRENT_DATE - INTERVAL '12 days', 1.00, 'DIAS', '1000000002'),
    ('Plataforma Web de Comercio Electrónico', 'Integración de Pasarelas de Pago y Seguridad', 'MANTENIMIENTO_INFRAESTRUCTURA', CURRENT_DATE - INTERVAL '2 days', 2.00, 'HORAS', '1000000003'),
    ('App Móvil de Gestión de Incidentes', 'Diseño de Interfaces y Experiencia de Usuario', 'REUNION_EXTERNA_URGENTE', CURRENT_DATE - INTERVAL '5 days', 4.00, 'HORAS', '1000000004')
) AS inter(proy_nombre, etapa_nombre, tipo, fecha, duracion, unidad, reg_ident)
JOIN proyecto p ON p.nombre = inter.proy_nombre
JOIN etapa e ON e.proyecto_id = p.id AND e.nombre = inter.etapa_nombre
JOIN trabajador reg ON reg.identificacion = inter.reg_ident
WHERE NOT EXISTS (
  SELECT 1 FROM interrupcion_proyecto
  WHERE interrupcion_proyecto.proyecto_id = p.id
    AND interrupcion_proyecto.tipo_interrupcion = inter.tipo
    AND interrupcion_proyecto.fecha = inter.fecha
);

-- -----------------------------------------------------------------------------
-- 9. HILOS DE CONVERSACIÓN, MENSAJES Y LECTURAS (RF-037, RF-038, V10)
-- -----------------------------------------------------------------------------
INSERT INTO hilo_conversacion (proyecto_id, etapa_id, titulo, creado_por_id, creado_en)
SELECT p.id, e.id, h.titulo, autor.id, h.creado_en
FROM (
  VALUES
    ('Portal de Gestión Empresarial ERP', 'Implementación de Módulos Core (Contabilidad y Facturación)', 'Arquitectura de Autenticación y Manejo de Tokens', '1000000002', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('Portal de Gestión Empresarial ERP', NULL, 'Seguimiento Semanal de Entregables de Sprint', '1000000002', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('Plataforma Web de Comercio Electrónico', 'Integración de Pasarelas de Pago y Seguridad', 'Requisitos de Seguridad y Cifrado para Pagos PSE', '1000000003', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('App Móvil de Gestión de Incidentes', 'Construcción de Vistas Móviles y Almacenamiento Offline', 'Estrategia de Caché y Persistencia en SQLite Local', '1000000004', CURRENT_TIMESTAMP - INTERVAL '18 hours')
) AS h(proy_nombre, etapa_nombre, titulo, autor_ident, creado_en)
JOIN proyecto p ON p.nombre = h.proy_nombre
LEFT JOIN etapa e ON e.proyecto_id = p.id AND e.nombre = h.etapa_nombre
JOIN trabajador autor ON autor.identificacion = h.autor_ident
WHERE NOT EXISTS (
  SELECT 1 FROM hilo_conversacion
  WHERE hilo_conversacion.proyecto_id = p.id AND hilo_conversacion.titulo = h.titulo
);

-- Mensajes de los hilos
INSERT INTO mensaje_hilo (hilo_id, autor_id, cuerpo, enviado_en)
SELECT h.id, autor.id, m.cuerpo, m.enviado_en
FROM (
  VALUES
    -- Hilo 1: Arquitectura de Autenticación
    ('Arquitectura de Autenticación y Manejo de Tokens', '1000000002', 'Buenas tardes equipo. Definimos que los tokens JWT tendrán expiración de 60 minutos con refresh token seguro en cookie HttpOnly.', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    ('Arquitectura de Autenticación y Manejo de Tokens', '1000000005', 'Recibido Carlos. Ya implementé la validación de filtros en SeguridadConfig y el esquema de auditoría en la base de datos.', CURRENT_TIMESTAMP - INTERVAL '2 days' - INTERVAL '18 hours'),
    ('Arquitectura de Autenticación y Manejo de Tokens', '1000000006', 'Desde el frontend de React ya interceptamos el código 401 para solicitar la renovación transparente del token.', CURRENT_TIMESTAMP - INTERVAL '1 day'),

    -- Hilo 2: Seguimiento Semanal
    ('Seguimiento Semanal de Entregables de Sprint', '1000000002', 'Recordatorio: la reunión de revisión de sprint se realizará este viernes a las 10:00 AM vía Google Meet.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    ('Seguimiento Semanal de Entregables de Sprint', '1000000007', 'Contenedores y pipelines de prueba listos para la demostración con los coordinadores.', CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '4 hours'),

    -- Hilo 3: Pasarelas de Pago
    ('Requisitos de Seguridad y Cifrado para Pagos PSE', '1000000003', 'Por favor asegurarse de validar la firma HMAC de los webhooks que envíe la pasarela antes de procesar órdenes.', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    ('Requisitos de Seguridad y Cifrado para Pagos PSE', '1000000008', 'Entendido Laura, configuré la verificación de certificados SSL y pruebas con mock de pasarela.', CURRENT_TIMESTAMP - INTERVAL '12 hours'),

    -- Hilo 4: SQLite Local (Mensaje reciente para notificación no leída)
    ('Estrategia de Caché y Persistencia en SQLite Local', '1000000004', 'Revisemos que la sincronización en segundo plano no bloquee el hilo de UI en dispositivos de gama media.', CURRENT_TIMESTAMP - INTERVAL '2 hours')
) AS m(hilo_titulo, autor_ident, cuerpo, enviado_en)
JOIN hilo_conversacion h ON h.titulo = m.hilo_titulo
JOIN trabajador autor ON autor.identificacion = m.autor_ident
WHERE NOT EXISTS (
  SELECT 1 FROM mensaje_hilo
  WHERE mensaje_hilo.hilo_id = h.id
    AND mensaje_hilo.autor_id = autor.id
    AND mensaje_hilo.cuerpo = m.cuerpo
);

-- Lecturas de hilos (para habilitar notificaciones leídas y no leídas de RF-038)
INSERT INTO lectura_hilo (hilo_id, trabajador_id, leido_hasta)
SELECT h.id, tw.id, l.leido
FROM (
  VALUES
    -- Andrés Rojas ha leído casi todo el hilo 1
    ('Arquitectura de Autenticación y Manejo de Tokens', '1000000005', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
    -- Andrés Rojas no ha leído el último mensaje del hilo 2
    ('Seguimiento Semanal de Entregables de Sprint', '1000000005', CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '6 hours'),
    -- Sofía Martínez ha leído el hilo 1
    ('Arquitectura de Autenticación y Manejo de Tokens', '1000000006', CURRENT_TIMESTAMP - INTERVAL '10 hours'),
    -- Carlos Mendoza ha leído el hilo 1 y 2
    ('Arquitectura de Autenticación y Manejo de Tokens', '1000000002', CURRENT_TIMESTAMP),
    ('Seguimiento Semanal de Entregables de Sprint', '1000000002', CURRENT_TIMESTAMP)
) AS l(hilo_titulo, trab_ident, leido)
JOIN hilo_conversacion h ON h.titulo = l.hilo_titulo
JOIN trabajador tw ON tw.identificacion = l.trab_ident
ON CONFLICT (hilo_id, trabajador_id) DO UPDATE SET leido_hasta = EXCLUDED.leido_hasta;

-- -----------------------------------------------------------------------------
-- 10. CONTENIDO PÚBLICO INFORMATIVO (RF-026, RF-032 a RF-036)
-- -----------------------------------------------------------------------------
INSERT INTO contenido_publico (tipo, titulo, cuerpo, enlace, fecha, orden, publicada)
VALUES
  -- LINEAMIENTOS
  ('LINEAMIENTO', 'Misión Institucional', 'Desarrollar soluciones de software innovadoras, seguras y escalables que impulsen la transformación digital de las organizaciones, optimicen sus procesos de negocio y garanticen la integridad de su información mediante ingeniería de alta calidad.', NULL, CURRENT_DATE, 1, true),
  ('LINEAMIENTO', 'Visión Corporativa', 'Consolidarse como la empresa líder de desarrollo de software y consultoría tecnológica reconocida a nivel nacional e internacional por la excelencia técnica, metodologías ágiles de vanguardia y confiabilidad operativa.', NULL, CURRENT_DATE, 2, true),
  ('LINEAMIENTO', 'Valores Corporativos', 'Compromiso y Responsabilidad: Cuidamos la información y cumplimos los acuerdos pactados con rigor.\nInnovación Continua: Adoptamos soluciones modernas y eficientes.\nCalidad y Excelencia: Software mantenible, probado y documentado.\nTrabajo en Equipo: Comunicación asertiva y respeto mutuo.\nTransparencia: Ética e integridad en cada línea de código.', NULL, CURRENT_DATE, 3, true),
  ('LINEAMIENTO', 'Política de Seguridad de la Información', 'IKernell Soluciones Software implementa controles basados en estándares internacionales para salvaguardar la confidencialidad, integridad y disponibilidad de los activos de información de la compañía y de nuestros clientes.', NULL, CURRENT_DATE, 4, true),

  -- PORTAFOLIO DE SERVICIOS
  ('PORTAFOLIO_SERVICIO', 'Desarrollo de Software a la Medida', 'Diseño, construcción e implementación de aplicaciones web y empresariales ajustadas con precisión milimétrica a los requerimientos y modelos de negocio de cada organización.', NULL, CURRENT_DATE, 1, true),
  ('PORTAFOLIO_SERVICIO', 'Arquitectura Cloud y Microservicios', 'Modernización de plataformas mediante infraestructura elástica, orquestación en contenedores y despliegues continuos de alta disponibilidad.', NULL, CURRENT_DATE, 2, true),
  ('PORTAFOLIO_SERVICIO', 'Soluciones de Inteligencia Artificial y Automatización', 'Integración de modelos inteligentes, procesamiento automatizado de datos y optimización de flujos operativos repetitivos.', NULL, CURRENT_DATE, 3, true),
  ('PORTAFOLIO_SERVICIO', 'Ciberseguridad y Aseguramiento de Calidad', 'Auditoría de código estático y dinámico, pruebas de penetración, análisis de vulnerabilidades y pruebas automatizadas de software.', NULL, CURRENT_DATE, 4, true),
  ('PORTAFOLIO_SERVICIO', 'Consultoría y Acompañamiento Tecnológico', 'Diagnóstico de arquitectura de TI, selección de stacks tecnológicos y orientación técnica para proyectos de alto impacto.', NULL, CURRENT_DATE, 5, true),
  ('PORTAFOLIO_SERVICIO', 'Mantenimiento Evolutivo y Soporte 24/7', 'Monitoreo preventivo, optimización de rendimiento y actualización funcional continua de plataformas productivas.', NULL, CURRENT_DATE, 6, true),

  -- NOTICIAS
  ('NOTICIA', 'IKernell Culmina con Éxito la Fase 1 del Proyecto ERP Empresarial', 'El equipo de ingeniería de IKernell completó satisfactoriamente el despliegue del módulo de finanzas y facturación electrónica, logrando tiempos de respuesta inferiores a 120 ms bajo carga concurrente.', NULL, CURRENT_DATE - INTERVAL '3 days', 1, true),
  ('NOTICIA', 'Adopción de Nuevos Estándares en Arquitecturas Cloud Nativas', 'La compañía consolidó su stack tecnológico con Spring Boot 3, PostgreSQL 17 y React 19, reforzando la seguridad y optimización del uso de recursos en la nube.', NULL, CURRENT_DATE - INTERVAL '10 days', 2, true),
  ('NOTICIA', 'Apertura de Convocatoria para Aprendices SENA en Desarrollo de Software', 'En alianza con el SENA, IKernell da inicio al programa de formación y vinculación para tecnólogos en Análisis y Desarrollo de Software (ADSO).', NULL, CURRENT_DATE - INTERVAL '18 days', 3, true),

  -- PREGUNTAS FRECUENTES
  ('PREGUNTA_FRECUENTE', '¿Cómo solicitar una propuesta o cotización de software?', 'Puede remitir su requerimiento a través de nuestro formulario de contacto público en este portal o escribir a contacto@ikernell.com. Uno de nuestros líderes técnicos se comunicará en menos de 24 horas para agendar una sesión de diagnóstico sin costo.', NULL, CURRENT_DATE, 1, true),
  ('PREGUNTA_FRECUENTE', '¿Qué metodologías de desarrollo emplea IKernell?', 'Trabajamos con metodologías ágiles (Scrum y Kanban), con sprints quincenales, entregables funcionales incrementales y trazabilidad completa de historias de usuario y control de versiones.', NULL, CURRENT_DATE, 2, true),
  ('PREGUNTA_FRECUENTE', '¿Cómo se garantiza la seguridad y confidencialidad del proyecto?', 'Todos los proyectos se rigen bajo Acuerdos de Confidencialidad (NDA). Nuestro código sigue lineamientos OWASP Top 10 y cifrado robusto para datos en reposo y en tránsito.', NULL, CURRENT_DATE, 3, true),
  ('PREGUNTA_FRECUENTE', '¿Se entrega el código fuente y la documentación técnica?', 'Sí. Al cierre del proyecto y cumplimiento de los hitos de aceptación, se entrega el repositorio completo, diagramas de arquitectura, manual de despliegue y documentación de APIs.', NULL, CURRENT_DATE, 4, true),

  -- ENLACES DE INTERÉS
  ('ENLACE_INTERES', 'Servicio Nacional de Aprendizaje - SENA', NULL, 'https://www.sena.edu.co', CURRENT_DATE, 1, true),
  ('ENLACE_INTERES', 'Documentación Oficial Spring Framework', NULL, 'https://spring.io/projects/spring-boot', CURRENT_DATE, 2, true),
  ('ENLACE_INTERES', 'Portal Oficial PostgreSQL', NULL, 'https://www.postgresql.org', CURRENT_DATE, 3, true),
  ('ENLACE_INTERES', 'Documentación de React.js', NULL, 'https://react.dev', CURRENT_DATE, 4, true),

  -- INFORMACIÓN DE CONTACTO
  ('INFORMACION_CONTACTO', 'Sede Principal', 'Calle 52 # 13-65, Chapinero, Bogotá D.C., Colombia', NULL, CURRENT_DATE, 1, true),
  ('INFORMACION_CONTACTO', 'Línea de Atención Telefónica', 'PBX: (+57) 601 555-0199 / WhatsApp: (+57) 310 555-0100', NULL, CURRENT_DATE, 2, true),
  ('INFORMACION_CONTACTO', 'Correo Electrónico Corporativo', 'contacto@ikernell.com / soporte@ikernell.com', NULL, CURRENT_DATE, 3, true),
  ('INFORMACION_CONTACTO', 'Horario de Atención', 'Lunes a Viernes de 8:00 AM a 5:00 PM (Jornada Continua)', NULL, CURRENT_DATE, 4, true)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 11. CONSULTAS PÚBLICAS (RF-035, HU-02)
-- -----------------------------------------------------------------------------
INSERT INTO consulta_publica (pregunta, nombre_contacto, correo_contacto, telefono_contacto, recibida_en, atendida, atendida_por_id)
SELECT c.pregunta, c.nombre, c.correo, c.telefono, c.recibida_en, c.atendida, coord.id
FROM (
  VALUES
    ('¿Cuentan con experiencia en integración de facturación electrónica con la DIAN para empresas del sector retail?', 'Mariana López', 'mariana.lopez@inversiones.com.co', '3105551234', CURRENT_TIMESTAMP - INTERVAL '3 days', true),
    ('¿Cuál es el proceso y tiempos estimados para realizar una auditoría de código y pruebas de penetración sobre nuestra API?', 'Carlos Eduardo Patiño', 'carlos.patino@finanzasdigitales.com', '3209876543', CURRENT_TIMESTAMP - INTERVAL '1 day', false),
    ('Buenas tardes, somos una cooperativa de ahorro y requerimos un portal de autogestión para asociados con autenticación biométrica.', 'Ana María Beltrán', 'ambeltran@cooperativa.org', '3154448899', CURRENT_TIMESTAMP - INTERVAL '5 hours', false)
) AS c(pregunta, nombre, correo, telefono, recibida_en, atendida)
JOIN trabajador coord ON coord.identificacion = '1000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM consulta_publica WHERE consulta_publica.pregunta = c.pregunta
);

-- -----------------------------------------------------------------------------
-- 12. RECURSOS INTERNOS (RF-029, RF-030)
-- -----------------------------------------------------------------------------
INSERT INTO recurso_interno (tipo, titulo, descripcion, categoria, version, contenido, enlace, orden, publicada)
VALUES
  -- PROGRAMAS
  ('PROGRAMA', 'Plantilla Starter Spring Boot 3 con Arquitectura Limpia', 'Proyecto base preconfigurado con Spring Security, PostgreSQL, HikariCP, Flyway, validaciones transaccionales y contenedor Podman listo para arrancar.', 'Backend', 'v2.4.0', 'Plantilla corporativa oficial para inicializar microservicios y módulos backend respetando los estándares de IKernell.', 'https://github.com/ikernell/starter-springboot', 1, true),
  ('PROGRAMA', 'Biblioteca de Componentes UI React y Tokens de Diseño', 'Kit de componentes React (botones, formularios, modales, tablas accesibles) configurado con CSS Modules y temas corporativos.', 'Frontend', 'v1.3.2', 'Paquete de componentes reusables que garantiza consistencia visual y cumplimiento de accesibilidad WCAG 2.1.', 'https://github.com/ikernell/react-ui-kit', 2, true),
  ('PROGRAMA', 'Script de Automatización y Pruebas con Podman y Quadlet', 'Scripts bash para despliegue y reinicio automático de contenedores locales sin permisos de root en Fedora / RHEL.', 'DevOps', 'v1.0.1', 'Configuración de unidades Quadlet y verificación automática de estado de bases de datos.', 'https://github.com/ikernell/devops-scripts', 3, true),

  -- TUTORIALES
  ('TUTORIAL', 'Guía de Buenas Prácticas en Git Flow y Conventional Commits', 'Estándar para nombrar ramas, estructurar commits atómicos (feat, fix, docs, refactor) y flujo de Pull Requests con revisión por pares.', 'Metodología', 'v2.0', E'# Buenas Prácticas en Git\n\n1. Commits atómicos y descriptivos.\n2. Usar formato: `feat: descripción`, `fix: descripción`, `docs: descripción`.\n3. Ramas por funcionalidad: `feature/nombre-funcionalidad`.\n4. Nunca hacer commit directo a `main` sin validación.', NULL, 1, true),
  ('TUTORIAL', 'Manual de Pruebas Unitarias e Integración con JUnit 5', 'Pautas para escribir pruebas desacopladas, uso de H2 en pruebas de repositorio y mock de capas de servicio con Mockito.', 'Calidad de Software', 'v1.5', E'# Pruebas en Spring Boot\n\n- Repositorios: `@DataJpaTest` con base en memoria.\n- Servicios: Pruebas unitarias con mocks (`@ExtendWith(MockitoExtension.class)`).\n- Controladores: `@WebMvcTest` con simulación de sesión y CSRF.', NULL, 2, true),
  ('TUTORIAL', 'Gestión de Migraciones Relacionales con Flyway', 'Instrucciones paso a paso para crear scripts SQL portables con control de versiones en db/migration.', 'Bases de Datos', 'v1.2', E'# Migraciones con Flyway\n\n1. Archivos `V<numero>__descripcion.sql` en `src/main/resources/db/migration`.\n2. Usar tipos estándar SQL ANSI.\n3. Probar reversión y verificación en limpio antes de enviar a git.', NULL, 3, true)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 13. ACTUALIZAR SECUENCIAS DE CLAVES PRIMARIAS (IDENTITY)
-- -----------------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('trabajador', 'id'), COALESCE((SELECT MAX(id) FROM trabajador), 1));
SELECT setval(pg_get_serial_sequence('cuenta_acceso', 'id'), COALESCE((SELECT MAX(id) FROM cuenta_acceso), 1));
SELECT setval(pg_get_serial_sequence('proyecto', 'id'), COALESCE((SELECT MAX(id) FROM proyecto), 1));
SELECT setval(pg_get_serial_sequence('etapa', 'id'), COALESCE((SELECT MAX(id) FROM etapa), 1));
SELECT setval(pg_get_serial_sequence('asignacion', 'id'), COALESCE((SELECT MAX(id) FROM asignacion), 1));
SELECT setval(pg_get_serial_sequence('actividad', 'id'), COALESCE((SELECT MAX(id) FROM actividad), 1));
SELECT setval(pg_get_serial_sequence('ejecucion_actividad', 'id'), COALESCE((SELECT MAX(id) FROM ejecucion_actividad), 1));
SELECT setval(pg_get_serial_sequence('error_proyecto', 'id'), COALESCE((SELECT MAX(id) FROM error_proyecto), 1));
SELECT setval(pg_get_serial_sequence('interrupcion_proyecto', 'id'), COALESCE((SELECT MAX(id) FROM interrupcion_proyecto), 1));
SELECT setval(pg_get_serial_sequence('hilo_conversacion', 'id'), COALESCE((SELECT MAX(id) FROM hilo_conversacion), 1));
SELECT setval(pg_get_serial_sequence('mensaje_hilo', 'id'), COALESCE((SELECT MAX(id) FROM mensaje_hilo), 1));
SELECT setval(pg_get_serial_sequence('lectura_hilo', 'id'), COALESCE((SELECT MAX(id) FROM lectura_hilo), 1));
SELECT setval(pg_get_serial_sequence('contenido_publico', 'id'), COALESCE((SELECT MAX(id) FROM contenido_publico), 1));
SELECT setval(pg_get_serial_sequence('consulta_publica', 'id'), COALESCE((SELECT MAX(id) FROM consulta_publica), 1));
SELECT setval(pg_get_serial_sequence('recurso_interno', 'id'), COALESCE((SELECT MAX(id) FROM recurso_interno), 1));

COMMIT;

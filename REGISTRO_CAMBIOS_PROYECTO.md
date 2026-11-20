# Registro de Cambios y Mejoras del Proyecto IKERNELL

Este documento recopila, en un lenguaje claro y accesible para todo el equipo y clientes, las mejoras aplicadas en la plataforma IKERNELL, los problemas detectados previamente, las soluciones implementadas y los beneficios concretos en la operación diaria.

---

## 1. Lanzador Dinámico del Chat Corporativo (Registro Retroactivo)

- **Ruta de la pantalla o archivo afectado:**
  - Barra de navegación y esquina inferior derecha de la zona privada (`LayoutPrincipal.jsx`, `DockChat.jsx`)
  - Panel principal — sección *Servicios Internos* (`/app` — `PaginaPanel.jsx`)
  - Pantalla de conversaciones (`/app/chat` — `PaginaChat.jsx`)
- **¿Qué problema se detectó?**
  - El acceso al chat dentro de *Servicios Internos* era una tarjeta plana y genérica igual al resto de los servicios, sin indicador visual de disponibilidad y sin un acceso rápido flotante disponible desde otras pantallas de trabajo.
  - Dentro de la ventana del chat no existía un aviso visible sobre la política de retención temporal de los mensajes.
- **¿Qué mejora se aplicó?**
  - Se reemplazó el botón plano por un **lanzador interactivo con estética acrílica** en *Servicios Internos* y un **Dock flotante no obstructivo** en la esquina inferior derecha.
  - Ambos accesos incorporan un ícono vectorial de líneas limpias, un indicador discreto de estado activo y una animación fluida que expande la etiqueta *"Chat de Proyectos"* al pasar el cursor, sin tapar tablas ni botones principales.
  - En la cabecera de cada conversación abierta se agregó un aviso sobrio informando: *"Historial efímero: los mensajes se depuran automáticamente tras 30 días"*.
- **¿Cómo beneficia al usuario en el día a día?**
  - Permite ingresar a las conversaciones del proyecto desde cualquier pantalla con un solo clic, sin perder el contexto ni interrumpir la lectura, y brinda claridad total sobre la vigencia de los mensajes.

---

## 2. Limpieza Automática de Mensajes en Base de Datos a 30 Días (Registro Retroactivo)

- **Ruta de la pantalla o archivo afectado:**
  - Base de datos PostgreSQL (tabla `mensaje_hilo`, migración `V25__indice_purga_mensajes_hilo.sql`)
  - Servicio automático de mantenimiento en el servidor (`ServicioDepuracionMensajes.java`)
- **¿Qué problema se detectó?**
  - Todos los mensajes enviados en los hilos de proyecto se acumulaban indefinidamente en la base de datos. Con el tiempo, esto podía ralentizar las consultas y consumir almacenamiento innecesario con conversaciones obsoletas.
  - Además, la tabla no contaba con un índice dedicado por fecha de envío para ejecutar limpiezas globales sin afectar el rendimiento del sistema.
- **¿Qué mejora se aplicó?**
  - Se creó un índice especializado por fecha de envío (`ix_mensaje_hilo_enviado_en`) para que las tareas de mantenimiento operen de forma instantánea sin bloquear la tabla.
  - Se configuró una tarea automática diaria en el servidor que elimina de forma permanente cualquier mensaje con más de 30 días de antigüedad, conservando intactos todos los mensajes recientes.
- **¿Cómo beneficia al usuario en el día a día?**
  - Mantiene el chat ágil y rápido a largo plazo, evita el crecimiento descontrolado de la base de datos y garantiza que el historial activo se mantenga limpio y relevante.

---

---

## 3. Estandarización de Paginación Avanzada en Todas las Tablas

- **Ruta de la pantalla o archivo afectado:**
  - Componente global de paginación (`PaginacionTabla.jsx` y `PaginacionTabla.module.css`)
  - Hook de paginación y persistencia (`usePaginacionLocal.js`)
  - Gestión de Trabajadores (`/app/trabajadores` — `PaginaTrabajadores.jsx`)
  - Gestión de Proyectos (`/app/proyectos` — `PaginaProyectos.jsx`)
  - Gestión de Actividades (`/app/actividades` — `PaginaActividades.jsx`)
  - Administración de Contenido (`/app/contenido` — `PaginaContenidoAdmin.jsx`)
  - Etapas y Equipo del Proyecto (`EtapasProyecto.jsx`, `EquipoProyecto.jsx`)
  - Reporte de Desempeño (`/app/reportes/desempeno` — `PaginaReporteDesempeno.jsx`)
  - Reportes del Proyecto (`/app/reportes/proyecto` — `PaginaReportesProyecto.jsx`)
- **¿Qué problema se detectó?**
  - Varias tablas del sistema (Contenido, Etapas, Equipo, Reporte de Desempeño y Reportes del Proyecto) no tenían paginación o mostraban solo los primeros 5 registros fijos sin poder navegar al resto.
  - El paginador existente no tenía botones numéricos de página ni selector estandarizado de `10, 25, 50, 100` registros, y al volver de ver un detalle se perdía la página seleccionada.
- **¿Qué mejora se aplicó?**
  - Se estandarizó el componente `PaginacionTabla` con selector de filas por página (`10, 25, 50, 100`), indicador numérico claro (*"Mostrando registros del X al Y de Z"*), botones rápidos (Primera, Anterior, Números de página, Siguiente, Última) con estados deshabilitados claros y persistencia de página en sesión (`useEstadoPaginacion` y `usePaginacionLocal`).
  - Se conectó este mismo componente en todas las tablas de todos los roles.
- **¿Cómo beneficia al usuario en el día a día?**
  - Ningún registro queda oculto, la navegación entre grandes listados es rápida y consistente en toda la aplicación, y al consultar un detalle y regresar no se pierde el lugar en la tabla.

---

## 4. Compactación de Filtros y Micro-animaciones en Tablas

- **Ruta de la pantalla o archivo afectado:**
  - Hoja de estilos compartida de gestión (`gestion.module.css`)
  - Hojas de estilos de reportes (`PaginaReporteDesempeno.module.css`, `PaginaReportesProyecto.module.css`)
- **¿Qué problema se detectó?**
  - Las barras de búsqueda y filtros ocupaban demasiado espacio vertical, desplazando las tablas hacia abajo en pantallas de escritorio y portátiles.
  - Al pasar el cursor por las filas, la transición era plana y en el Reporte de Desempeño el contraste del resaltado en modo oscuro dificultaba la lectura del texto de la fila.
- **¿Qué mejora se aplicó?**
  - Se compactaron los márgenes, paddings y separación de criterios en las barras de filtros para formar una barra horizontal ergonómica.
  - Se ajustó el espaciado interior de las celdas para una lectura ejecutiva más limpia y se incorporaron micro-animaciones suaves (`0.2s`) al pasar el cursor: elevación sutil del fondo, línea indicadora lateral izquierda sin desplazar columnas y resalte de los botones de acción de la fila.
  - Se corrigió el color de resaltado en hover de las tablas de reportes (`#eaf7fa`) para garantizar contraste nítido en cualquier tema.
- **¿Cómo beneficia al usuario en el día a día?**
  - Se visualizan más registros útiles sin necesidad de hacer scroll constante, y la lectura e interacción sobre cada fila resulta mucho más cómoda, precisa y fluida.

---

## 5. Refactorización del Flujo de Chat y Dependencia de Etapas por Proyecto

- **Pantalla o Módulo:**
  - Conversaciones del proyecto (`/app/chat` — `PaginaChat.jsx`)
- **Situación detectada:**
  - El botón `+ NUEVA CONVERSACIÓN` se encontraba aislado dentro de la barra de filtros superiores, generando confusión visual respecto a los selectores de proyecto y etapa.
  - Al cambiar de proyecto, el selector de etapas no garantizaba un reinicio limpio ni mostraba un estado claro cuando un proyecto no tenía etapas configuradas, además de incluir textos explicativos redundantes.
  - El área de redacción de mensajes requería ajuste para expandirse suavemente con textos largos y mantener un estado visual claro al habilitar o deshabilitar el envío.
- **Solución aplicada:**
  - Se reubicó y renombró la acción principal a **"Iniciar Hilo de Discusión"** dentro de la cabecera de la columna de hilos, deshabilitándose con un aviso claro si el proyecto está inhabilitado.
  - Se vinculó estrictamente el selector de etapas al proyecto activo: al cambiar de proyecto se reinicia la etapa, se cargan únicamente sus etapas reales y, si no tiene etapas configuradas, muestra *"Sin etapas específicas (Canal General)"* deshabilitando el combo secundario.
  - Se compactó la barra superior eliminando textos redundantes y se habilitó la auto-expansión vertical fluida del cuadro de mensaje (`Enter` para enviar, `Shift + Enter` para salto de línea, limpieza y auto-scroll inmediato).
- **Beneficio directo:**
  - El usuario entiende de inmediato dónde iniciar un tema de discusión, solo ve las etapas que realmente pertenecen al proyecto seleccionado y redacta mensajes con mayor comodidad y fluidez.

---

## 6. Botón Global de "Regresar" en Todas las Vistas

- **Pantalla o Módulo:**
  - Todas las vistas de gestión, detalle y consulta de la zona privada (`BotonRegresar.jsx`, `Seccion.jsx`, `PaginaReportesProyecto.jsx`)
- **Situación detectada:**
  - Varias pantallas internas y de detalle carecían de un control explícito para volver a la vista anterior, obligando al usuario a usar los botones del navegador o navegar de nuevo desde el menú principal.
- **Solución aplicada:**
  - Se implementó un botón sobrio y reutilizable **"Regresar"** en la parte superior izquierda de todas las vistas internas principales y de detalle, con navegación inteligente hacia la pantalla anterior (o a la ruta padre correspondiente si se accedió directamente).
- **Beneficio directo:**
  - Evita que el usuario quede atrapado en una pantalla de detalle o reporte y agiliza el recorrido entre listados y fichas sin recargar la aplicación.

---

## 7. Remodelación Integral del Espacio de Trabajo (Bento Grid y Estados Elegantes)

- **Pantalla o Módulo:**
  - Espacio de Trabajo principal (`/app` — `PaginaPanel.jsx`, `PaginaPanel.module.css`)
  - Estados vacíos y de carga globales (`EstadoVacio.jsx`, `EstadoCarga.jsx`, `Estados.module.css`)
- **Situación detectada:**
  - El Espacio de Trabajo se percibía como una cuadrícula uniforme de cuadros planos con bordes gruesos, sin jerarquía visual entre módulos principales y secundarios ni retroalimentación dinámica al interactuar.
  - Los estados vacíos y de carga mostraban textos o indicadores planos poco integrados con la estética corporativa.
- **Solución aplicada:**
  - Se rediseñó el panel bajo una arquitectura **Bento Grid adaptativa** con superficies de elevación compuesta (bordes ultrafinos, sombras ambientales escalonadas y resalte periférico al pasar el cursor), cabeceras con categorías en mayúsculas sutiles y contadores tipo cápsula.
  - Se renovaron los estados vacíos con anillos vectoriales limpios y los estados de carga con esqueletos *shimmer* sobrios que evitan saltos de contenido.
- **Beneficio directo:**
  - La información se comprende a primer golpe de vista, la navegación es más rápida e intuitiva y la plataforma ofrece una experiencia visual moderna, limpia y libre de distracciones.

---

## 8. Confirmación Asistida para Correo y Enlaces Externos en el Encabezado

- **Ubicación:**
  - Encabezado principal del sistema (`Encabezado.jsx`, `ConfirmacionEnlaceExterno.jsx`)
- **Problema encontrado:**
  - Al hacer clic en el botón de **Correo** en el encabezado, el sistema abría inmediatamente una pestaña externa sin advertir al usuario, generando desorientación o sensación de salida inesperada de la plataforma.
- **Mejora realizada:**
  - Se incorporó un ícono sutil de enlace externo junto al botón de **Correo** para anticipar su comportamiento y se bloqueó la apertura automática directa.
  - Ahora se despliega una ventana de confirmación corporativa (*"Acceso a Correo Corporativo"*) que explica de forma transparente que el correo se abrirá en una nueva pestaña mientras la sesión actual permanece activa, con opciones **"Continuar y abrir"**, **"Cancelar"** y la casilla opcional *"No volver a advertirme durante esta sesión"*.
- **Beneficio directo:**
  - Mayor seguridad, control y confianza para el usuario al navegar hacia servicios externos sin perder el contexto de su trabajo.

---

## 9. Protección de Cambios no Guardados y Rediseño del Perfil de Trabajador

- **Pantalla intervenida:**
  - Perfil de Trabajador (`/app/trabajadores/:id` — `PaginaPerfilTrabajador.jsx`)
- **Problema encontrado:**
  - Si se editaba la información del trabajador y se daba clic en *"Regresar"* o en otro enlace del menú, el sistema salía sin avisar y borraba todo lo digitado.
  - Además, había dos botones repetidos para volver (*"Regresar"* y *"Volver a la búsqueda"*) y la columna de datos protegidos se veía como texto plano estático.
- **Mejora aplicada:**
  - Se activó un detector de cambios pendientes en tiempo real: el botón *"Guardar cambios"* indica cuando no hay modificaciones pendientes y se activa al editar cualquier campo.
  - Si hay cambios sin guardar e intenta salir (mediante *"Regresar"*, enlaces del menú o recarga de página), aparece una ventana de advertencia (*"Cambios sin guardar"*) con tres opciones: **"Salir sin guardar"**, **"Guardar y salir"** y **"Continuar editando"**.
  - Se eliminó el botón duplicado *"Volver a la búsqueda"* y se rediseñó la ficha de datos protegidos con tarjetas ejecutivas de solo lectura e insignia *"Dato protegido por auditoría"*.
- **Beneficio directo:**
  - El usuario no volverá a perder trabajo por accidente, comprende de inmediato qué datos están protegidos por auditoría y disfruta de una pantalla más limpia y ordenada.

---

## 10. Estandarización de Direcciones Colombianas y Ampliación de Tipos de Documento

- **Pantalla o Módulo:**
  - Registro de Trabajadores (`/app/trabajadores/nuevo` — `PaginaRegistroTrabajador.jsx`)
  - Perfil de Trabajador (`/app/trabajadores/:id` — `PaginaPerfilTrabajador.jsx`)
  - Validaciones compartidas (`validaciones.js`) y reglas del servidor (`TipoIdentificacion.java`, `IdentificacionValidaValidator.java`, `DireccionColombianaValidator.java`, migración `V26`)
- **Situación previa:**
  - El sistema admitía únicamente Cédula de Ciudadanía y Cédula de Extranjería con longitudes restringidas.
  - Varias nomenclaturas válidas en Colombia (como *Avenida Carrera 68*, *Avenida Calle*, complementos de torre/apartamento o cruces sin guion) eran rechazadas o carecían de una guía visual amigable al diligenciarlas.
- **Mejora realizada:**
  - Se amplió el catálogo oficial de documentos a **Cédula de Ciudadanía (CC)**, **Tarjeta de Identidad (TI)**, **Cédula de Extranjería (CE)**, **Pasaporte (PA)** y **Permiso por Protección Temporal (PPT)**, con bloqueo inteligente de caracteres, ejemplos dinámicos y validación exacta tanto en pantalla como en el servidor.
  - Se robusteció el validador de direcciones urbanas y rurales y se integró un **Asistente Dinámico de Dirección** con vista previa estandarizada en tiempo real y constructor paso a paso opcional.
- **Beneficio para el usuario:**
  - Registro más rápido, sin rechazos injustos y con datos de identificación y ubicación 100% exactos y confiables.

---

## 11. Sistema de Guía Dinámica y Prevención Activa de Duplicados

- **Funcionalidad intervenida:**
  - Componente base de entrada (`Campo.jsx`), asistente progresivo de direcciones (`AsistenteDireccion.jsx`, `validaciones.js`) y registro de trabajadores (`PaginaRegistroTrabajador.jsx`).
- **Problema previo:**
  - Las personas no sabían cómo llenar campos complejos como las direcciones colombianas y solo recibían errores al final del formulario.
  - Tampoco sabían si un número de documento ya estaba repetido hasta que fallaba el guardado o finalizaban todo el formulario.
- **Mejora aplicada:**
  - Ahora el sistema acompaña al usuario mientras escribe, indicándole paso a paso qué elemento falta (por ejemplo, el número de cruce `#` o la placa `-`), ofreciendo atajos rápidos (*Calle, Carrera, Avenida, Diagonal, Transversal, Vereda*) y normalizando automáticamente espacios y símbolos como `No.` o `N°`.
  - Se integró verificación en tiempo real con estado visual claro en el campo (*comprobando disponibilidad*, *disponible* con icono de verificación o *duplicado* bloqueando el envío anticipadamente).
- **Beneficio para el usuario:**
  - Llenado de formularios mucho más rápido, cero frustración por rechazos repetitivos y datos siempre limpios y exactos.

---

## 12. Reestructuración de Gestión de Proyectos (Detalle Dedicado, Filtros Multicriterio y Paginación Escalable)

- **Módulo intervenido:**
  - Gestión de Proyectos (`/app/asignaciones` y `/app/asignaciones/:id` — `PaginaAsignaciones.jsx`, `AppRouter.jsx`)
- **Problema encontrado:**
  - El panel de *"Detalle del proyecto"* aparecía pegado debajo de las tarjetas, obligando a hacer scroll extenso para consultar un proyecto.
  - Faltaban filtros útiles (por proyectos con o sin equipo asignado y ordenamiento ampliado) y la paginación no permitía elegir cuántos proyectos ver por página.
- **Mejora aplicada:**
  - Se separó el detalle de cada proyecto en su propia pantalla dedicada (`/app/asignaciones/:id`) con botón **"Regresar"** que conserva exactamente la página y los filtros aplicados al volver.
  - Se compactó la barra de herramientas con búsqueda en tiempo real (`250ms`), filtro de estado, filtro por equipo asignado, ordenamiento ampliado y botón *"Limpiar filtros"* reactivo.
  - Se renovaron las tarjetas para que sean totalmente clicables con micro-interacciones suaves y se incorporó paginación escalable de `6, 12, 24, 48` proyectos por página.
- **Beneficio para el usuario:**
  - Búsqueda instantánea, pantalla mucho más limpia y organizada, y acceso directo al detalle sin enredos ni desplazamientos innecesarios.

---

## 13. Estabilidad Visual de Formularios (Cero Saltos de Diseño) y Validación de Extranjería

- **Aspecto corregido:**
  - Estabilidad visual de los formularios (`Campo.jsx`, `Campo.module.css`, `gestion.module.css`) y validación de documentos extranjeros (`TrabajadorController.java`, `validaciones.js`).
- **Problema previo:**
  - Cada vez que aparecía un mensaje de error, éxito o una pista debajo de un campo, las casillas inferiores se desplazaban hacia abajo y descuadraban la alineación con las columnas vecinas.
  - Además, al ingresar una Cédula de Extranjería con letras (por ejemplo `CE524102`), el sistema mostraba un aviso indicando que solo aceptaba números.
- **Mejora aplicada:**
  - Se reservó un espacio fijo estabilizado para los mensajes debajo de cada campo y se igualó la altura de cajas de texto y listas desplegables (`42px`), garantizando que ninguna fila ni columna se mueva un solo píxel al aparecer o desaparecer avisos.
  - Se unificó la validación para aceptar correctamente caracteres alfanuméricos en Cédulas de Extranjería (`CE`), Pasaportes (`PA`) y `PPT`.
- **Beneficio para el usuario:**
  - Escritura mucho más cómoda, pantalla siempre ordenada y alineada sin saltos visuales, y validaciones exactas sin bloqueos injustificados.

---

## 14. Rediseño del Módulo de Desempeño y Fuerza de Trabajo

- **Módulo remodelado:**
  - Reporte de Desempeño y Fuerza de Trabajo (`/app/reportes/desempeno` — `PaginaReporteDesempeno.jsx`, `PaginaReporteDesempeno.module.css`)
- **Problema previo:**
  - La pantalla mezclaba una lista de trabajadores con un generador de reportes poco claro, requería clics confusos para ver el detalle y los filtros no guiaban al usuario ni se adaptaban al proyecto elegido.
- **Mejora aplicada:**
  - Se organizó la vista con un propósito claro y **4 indicadores ejecutivos** en la parte superior (desarrolladores asignados, actividades del período, horas de esfuerzo registradas y nivel de cumplimiento).
  - Se implementaron **filtros progresivos paso a paso**: al elegir un proyecto se habilitan sus etapas reales, al elegir un desarrollador se muestra su especialidad, y el período temporal ofrece atajos rápidos (*"Este mes"*, *"Últimos 3 meses"*, *"Personalizado"*).
  - La tabla ahora muestra directamente el avance con barras de progreso lineal, columnas ordenables, paginación (`10, 25, 50`) y un **desglose expansible** en cada fila para consultar actividades y ejecuciones con un solo clic.
- **Beneficio para el usuario:**
  - Comprensión instantánea del rendimiento y carga del equipo, filtros fáciles de usar y consulta directa de actividades sin perder contexto.

---

## 15. Blindaje de Seguridad, Protección de Sesión y Sincronización al Retomar Foco
- **Aspecto reforzado:**
  - Seguridad general, protección de cabeceras y cookies, cierre de sesión absoluto, sincronización reactiva con la base de datos y control de rutas/errores (`SeguridadConfig.java`, `FiltroVigenciaCuenta.java`, `ProveedorSesion.jsx`, `RutaProtegida.jsx`, `usePeticion.js`, `ErrorBoundary.jsx`, `PaginaNoEncontrada.jsx`).
- **Problema previo:**
  - Al cerrar sesión o navegar rápido con las flechas del navegador existía el riesgo de que se mostrara información anterior en caché o quedaran peticiones en vuelo. Además, si se cambiaba un dato o se inhabilitaba una cuenta en la base de datos, la página no se enteraba hasta recargar manualmente.
- **Mejora aplicada:**
  - Se blindaron las cabeceras HTTP (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Cache-Control: no-store`) y las cookies de sesión (`HttpOnly`, `SameSite=Lax`).
  - Se reforzó el cierre de sesión para borrar todo rastro local, invalidar la sesión en el servidor, reemplazar el historial y bloquear el botón "Atrás" tras salir.
  - Se añadió verificación inmediata de vigencia de cuenta en el servidor y **sincronización silenciosa al volver a la pestaña** (`focus` / `visibilitychange`) para reflejar cambios reales de la base de datos sin recargar con F5.
  - Se activó un interceptor global de errores (`ErrorBoundary`) y una pantalla corporativa **404** para cualquier ruta desconocida sin romper la barra de navegación ni exponer detalles técnicos.
- **Beneficio para el usuario:**
  - Navegación segura, rápida, estable y datos siempre sincronizados y protegidos.

---

## 16. Rediseño del Módulo de Gestión de Consultas Web (Inbox CRM)
- **Módulo remodelado:**
  - Gestión de Consultas Web (`/app/consultas` — `PaginaConsultas.jsx`, `PaginaConsultas.module.css`)
- **Problema previo:**
  - La pantalla mostraba muchas palabras y botones repetidos, los avisos ocupaban demasiado espacio y responder una consulta empujaba toda la lista hacia abajo de forma incómoda.
- **Mejora aplicada:**
  - Se rediseñó el módulo estilo bandeja de correo moderna en dos columnas (bandeja con contadores y buscador a la izquierda; lector, ficha de contacto y redactor a la derecha).
  - Se eliminaron avisos duplicados usando únicamente notificaciones toast globales, se ocultó el botón de reintento cuando no hay error de envío y se añadieron **plantillas de respuesta rápida** con un clic y paginación (`10, 25, 50`).
- **Beneficio para el usuario:**
  - Atención a clientes el doble de rápida, pantalla ordenada y profesional, y cero enredos visuales.

---

## 17. Barrido Global y Alineación Milimétrica de Barras de Filtros
- **Aspecto corregido:**
  - Barrido general de diseño y alineación de barras de búsqueda y filtros en toda la aplicación (`Campo.jsx`, `gestion.module.css`, `PaginaAsignaciones.jsx`, `PaginaProyectos.jsx`, `PaginaTrabajadores.jsx`, `PaginaActividades.jsx`, `PaginaConsultas.jsx`).
- **Problema previo:**
  - La barra de filtros se veía desalineada: el buscador quedaba más abajo que los desplegables, el botón de limpiar filtros flotaba a otra altura y los textos de los combos salían cortados como *"Todos los estad..."*.
- **Mejora aplicada:**
  - Se añadió el modo compacto (`compacto`) en `Campo.jsx` para barras de herramientas sin mensajes de validación inferiores, unificando la altura (`42px`) y la línea base inferior (`align-items: flex-end`) de buscadores, selectores y botones de limpieza.
  - Se ampliaron los anchos mínimos de los desplegables y se incorporó etiqueta superior en el buscador de asignaciones para que ningún texto se recorte.
- **Beneficio para el usuario:**
  - Apariencia visual impecable, organizada y mucho más fácil de leer y usar en cualquier pantalla.

---

## 18. Tarjetas KPI Interactivas (Drill-Down y Auto-Filtro) en Desempeño
- **Elemento intervenido:**
  - Tarjetas de métricas del panel de Desempeño (`/app/reportes/desempeno` — `PaginaReporteDesempeno.jsx`, `PaginaReporteDesempeno.module.css`)
- **Problema previo:**
  - Las 4 tarjetas de números (desarrolladores, actividades, horas y cumplimiento) se veían bien pero no hacían nada al hacerles clic; eran cuadros estáticos.
- **Mejora aplicada:**
  - Se convirtieron en tarjetas interactivas inteligentes con estado activo (`Filtro activo`) y elevación al pasar el cursor:
    * **Desarrolladores Asignados:** filtra asignaciones activas y despliega los desarrolladores con acceso directo a su detalle.
    * **Actividades del Período:** abre atajos rápidos sincronizados para ver finalizadas, en curso o pendientes.
    * **Horas de Esfuerzo:** ordena automáticamente la tabla de mayor a menor esfuerzo horario.
    * **Nivel de Cumplimiento:** filtra y prioriza registros con actividades pendientes o en curso que requieren atención.
  - Al volver a hacer clic en la tarjeta activa, el filtro se desactiva suavemente.
- **Beneficio para el usuario:**
  - Análisis inmediato a un solo clic sin tener que configurar filtros manuales.

---

## 19. Homologación del Panel de Desarrollador, Gestión de Incidencias y Mis Actividades
- **Módulos intervenidos:**
  - Gestión de Incidencias (`/app/incidencias` — `PaginaIncidencias.jsx`, `FormularioDeInterrupcion.jsx`, `IncidenciaController.java`)
  - Mis Actividades (`/app/mis-actividades` — `PaginaMisActividades.jsx`, `PaginaMisActividades.module.css`)
- **Problema previo:**
  - El módulo de incidencias mezclaba en una sola vista formularios largos de errores e interrupciones, no mostraba qué se había registrado previamente y carecía de historial. En Mis Actividades faltaba paginación escalable y unificación de altura en su barra de filtros.
- **Mejora aplicada:**
  - Se reorganizó Incidencias en dos pestañas claras: **Errores de Software (RF-023)** (con selector de proyecto, etapas dependientes, severidad y descripción) e **Interrupciones (RF-024)**, con notificaciones toast globales.
  - Se añadió una **Tabla Resumen de Mis Incidencias Recientes** conectada a los nuevos endpoints `/api/incidencias/mis-errores` y `/api/incidencias/mis-interrupciones` con paginación compacta.
  - En Mis Actividades se estandarizó la barra de filtros (`42px`, cero textos recortados), se hicieron interactivas las tarjetas KPI superiores y se integró el paginador escalable (`10, 25, 50`).
- **Beneficio para el usuario:**
  - Registro de incidentes tres veces más rápido, visibilidad inmediata de lo guardado y una experiencia homogénea y fluida para el desarrollador.

---

## 20. Homologación del Panel de Líder de Proyectos y Pruebas de Estrés
- **Rol intervenido:**
  - Líder de Proyectos (`/app/proyectos`, `/app/proyectos/nuevo`, `/app/actividades`, `/app/actividades/nueva`, `/app/reportes/proyecto`, `/app/reportes/archivo-plano`)
- **Fallas encontradas y provocadas:**
  - Riesgo de doble envío en formularios ante clics rápidos, ausencia de alerta preventiva por nombre duplicado al registrar proyectos, salida accidental de ventana sin confirmar cambios no guardados y posibilidad de solicitar exportación de archivo plano en proyectos sin datos de ejecución.
- **Mejoras aplicadas:**
  - Se blindó el registro de proyectos (`PaginaRegistroProyecto.jsx`) con validación preventiva de nombres duplicados en tiempo real y protección contra cierre accidental (`beforeunload`).
  - Se reforzó el registro de actividades (`PaginaRegistroActividad.jsx`) con bloqueo estricto contra doble envío (`useRef` + `disabled`), reinicio inmediato de etapa y desarrolladores al cambiar proyecto, protección `beforeunload` y cero saltos visuales (`Campo.jsx`).
  - Se validó la existencia de datos exportables antes de generar el archivo plano (`PaginaArchivoPlano.jsx`) mostrando un aviso claro si no existen ejecuciones registradas.
- **Beneficio para el usuario:**
  - Cero errores ni duplicados al planificar proyectos y actividades, interfaz estable sin saltos y reportes descargables confiables.

---

## 21. Verificación del Circuito Cruzado Multi-Rol (Coordinador → Líder → Desarrollador)
- **Flujo comprobado:**
  - Circuito integral de asignación de equipo, planificación de actividades, ejecución/incidencias y reflejo inmediato en reportes entre Coordinador, Líder y Desarrollador.
- **Fallas encontradas durante la prueba:**
  - En Reportes del Proyecto (`PaginaReportesProyecto.jsx`), el panel consultaba un endpoint de equipo reservado al coordinador (`403`) y leía las propiedades `.actividades` / `.interrupciones` en lugar de `.contenido`, mostrando contadores en `0` aunque el servidor respondía los datos reales.
- **Solución implementada:**
  - Se corrigió el endpoint de equipo a `obtenerEquipo` (`/api/proyectos/{id}/equipo`) y la lectura de `.contenido` en `PaginaReportesProyecto.jsx`.
  - Se verificó de punta a punta que al asignar un desarrollador como Coordinador, el Líder lo visualiza y le asigna tareas, el Desarrollador las ejecuta y reporta incidencias, y tanto Coordinador como Líder ven el impacto en sus reportes en tiempo real, con bloqueo estricto de rutas no autorizadas (`403` / `PaginaSinPermiso`).
- **Beneficio para el usuario:**
  - Un sistema conectado de punta a punta entre los tres roles, sin pérdidas ni desfase de información.











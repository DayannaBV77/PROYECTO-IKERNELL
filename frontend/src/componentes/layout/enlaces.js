/**
 * Entradas de navegacion del sitio publico.
 *
 * Corresponden a las secciones que el backend publica realmente. "Recursos"
 * apunta a los enlaces de interes (RF-036): la biblioteca de programas y los
 * tutoriales exigen sesion iniciada (RF-029, RF-030, HU-21) y por eso no
 * cuelgan del menu publico.
 *
 * Vive en su propio modulo para que el archivo del layout exporte unicamente
 * componentes.
 */
const CORREO_CORPORATIVO_URL = 'https://correo.ikernell.com';

export const ENLACES_PUBLICOS = [
  { a: '/', texto: 'Inicio', exacto: true },
  { a: '/lineamientos', texto: 'Nosotros' },
  { a: '/servicios', texto: 'Portafolio' },
  { a: '/noticias', texto: 'Noticias' },
  { a: '/preguntas-frecuentes', texto: 'Preguntas frecuentes' },
  { a: '/recursos', texto: 'Recursos' },
  { a: '/contacto', texto: 'Contacto' },
];

/**
 * Servicios internos del trabajador autenticado (HU-03 C02).
 *
 * Figuran la biblioteca de programas (RF-029), los tutoriales (RF-030) y las
 * conversaciones por proyecto y etapa (RF-037). El correo corporativo (RF-031)
 * no es una pagina sino un enlace autorizado, y se ofrece desde el panel; el
 * chat corporativo LIBRE de RF-028 -conversaciones individuales, grupos,
 * disponibilidad- sigue sin implementar porque D-12 lo deja sin definir.
 *
 * `tipos` restringe la entrada a unos tipos de trabajador; sin el, la ve
 * cualquiera con la sesion iniciada. Igual que en el menu publico, no se crean
 * entradas para completar visualmente el menu: cada una corresponde a una
 * pantalla que existe.
 */
export const ENLACES_PRIVADOS = [
  { a: '/app', texto: 'Panel', exacto: true },
  // Gestion de trabajadores: el backend la reserva al coordinador (RNF-001).
  { a: '/app/trabajadores', texto: 'Trabajadores', tipos: ['COORDINADOR'] },
  // Asignacion de trabajadores a proyectos (RF-003, HU-06).
  { a: '/app/asignaciones', texto: 'Asignaciones', tipos: ['COORDINADOR'] },
  // Reporte de desempeno de un desarrollador (RF-006, HU-07).
  { a: '/app/reportes/desempeno', texto: 'Desempeno', tipos: ['COORDINADOR'] },
  // Administracion de la pagina publica y de las consultas recibidas. Es una
  // PROPUESTA: RF-032 deja el proceso de actualizacion por definir (D-26).
  { a: '/app/contenido', texto: 'Contenido', tipos: ['COORDINADOR'] },
  { a: '/app/consultas', texto: 'Consultas', tipos: ['COORDINADOR'] },
  // Gestion de proyectos: reservada al lider (HU-08 C05 lo dice expresamente,
  // "ni ver esa opcion").
  { a: '/app/proyectos', texto: 'Proyectos', tipos: ['LIDER'] },
  // Planificacion de actividades: del lider (RF-019 a RF-021).
  { a: '/app/actividades', texto: 'Actividades', tipos: ['LIDER'] },
  // Reportes de actividades e interrupciones (RF-017, RF-018; HU-14, HU-15).
  { a: '/app/reportes/proyecto', texto: 'Reportes', tipos: ['LIDER'] },
  // Archivo plano para la empresa aliada (RF-025, HU-19 C05: solo el lider).
  { a: '/app/reportes/archivo-plano', texto: 'Archivo plano', tipos: ['LIDER'] },
  // Las actividades propias las ve cualquiera que tenga alguna asignada; se
  // ofrece a desarrolladores y lideres porque HU-16 C05 incluye al lider al
  // que asignaron como desarrollador en otro proyecto (RN-05).
  { a: '/app/mis-actividades', texto: 'Mis actividades', tipos: ['DESARROLLADOR', 'LIDER'] },
  // Errores e interrupciones: los registra quien esta asignado como
  // desarrollador al proyecto, sea cual sea su tipo global (RN-05).
  { a: '/app/incidencias', texto: 'Incidencias', tipos: ['DESARROLLADOR', 'LIDER'] },
  // Conversaciones por proyecto y etapa (RF-037, HU-22). Sin `tipos`: el
  // permiso es la asignacion en el proyecto, no el tipo de trabajador.
  { a: '/app/chat', texto: 'Conversaciones' },
  { a: '/app/biblioteca', texto: 'Biblioteca' },
  { a: CORREO_CORPORATIVO_URL, texto: 'Correo corporativo', externo: true },
  { a: '/app/tutoriales', texto: 'Tutoriales' },
];

/*
 * El lider ve lo mismo que cualquier trabajador autenticado (servicios
 * comunes: biblioteca, tutoriales, conversaciones y correo) mas sus modulos
 * de gestion. Se deriva del catalogo unico para que las tres areas mantengan
 * exactamente las mismas entradas comunes y no se desincronicen.
 */
export const ENLACES_LIDER = ENLACES_PRIVADOS.filter(
  ({ tipos }) => !tipos || tipos.includes('LIDER'),
);

/**
 * Menu que corresponde a la sesion.
 *
 * El rol de LIDER DE PROYECTOS y los demas roles autenticados muestran
 * exclusivamente las opciones internas de su espacio de trabajo, eliminando
 * las entradas del menu publico (Inicio, Nosotros, Portafolio, etc.) para
 * mantener la navegacion limpia y enfocada.
 *
 * Sin sesion se retorna el catalogo publico.
 */
export function enlacesPara(sesion) {
  if (!sesion) {
    return ENLACES_PUBLICOS;
  }

  // Líder de Proyectos: únicamente sus módulos y herramientas de gestión
  if (sesion.tipoTrabajador === 'LIDER') {
    return ENLACES_LIDER;
  }

  // Coordinador de Proyectos: únicamente sus herramientas de gestión
  if (sesion.tipoTrabajador === 'COORDINADOR') {
    return ENLACES_PRIVADOS.filter(
      ({ tipos }) => !tipos || tipos.includes(sesion.tipoTrabajador),
    );
  }

  // Otros trabajadores autenticados (Desarrollador, etc.): solo sus servicios autorizados
  return ENLACES_PRIVADOS.filter(
    ({ tipos }) => !tipos || tipos.includes(sesion.tipoTrabajador),
  );
}

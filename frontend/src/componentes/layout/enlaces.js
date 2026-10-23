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
 * Solo figuran los que el backend atiende hoy: la biblioteca de programas
 * (RF-029) y los tutoriales (RF-030). El correo corporativo (RF-031) no es una
 * pagina sino un enlace autorizado, y se ofrece desde el panel; el chat
 * corporativo (RF-028) no esta implementado porque D-12 lo deja sin definir.
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
  // Gestion de proyectos: reservada al lider (HU-08 C05 lo dice expresamente,
  // "ni ver esa opcion").
  { a: '/app/proyectos', texto: 'Proyectos', tipos: ['LIDER'] },
  // Planificacion de actividades: del lider (RF-019 a RF-021).
  { a: '/app/actividades', texto: 'Actividades', tipos: ['LIDER'] },
  // Las actividades propias las ve cualquiera que tenga alguna asignada; se
  // ofrece a desarrolladores y lideres porque HU-16 C05 incluye al lider al
  // que asignaron como desarrollador en otro proyecto (RN-05).
  { a: '/app/mis-actividades', texto: 'Mis actividades', tipos: ['DESARROLLADOR', 'LIDER'] },
  // Errores e interrupciones: los registra quien esta asignado como
  // desarrollador al proyecto, sea cual sea su tipo global (RN-05).
  { a: '/app/incidencias', texto: 'Incidencias', tipos: ['DESARROLLADOR', 'LIDER'] },
  { a: '/app/biblioteca', texto: 'Biblioteca' },
  { a: '/app/tutoriales', texto: 'Tutoriales' },
];

/**
 * Menu que corresponde a la sesion.
 *
 * HU-03 C02: el trabajador autenticado "sigue viendo la informacion empresarial
 * publica y, ademas, ve los servicios internos". La sesion anade entradas, no
 * las sustituye, que es tambien lo que muestran los mockups.
 *
 * El mismo criterio pide mostrar las funciones de su tipo "y ninguna de las que
 * corresponden a otro tipo", de ahi el filtrado. Ocultar la entrada no es la
 * medida de seguridad: el servidor rechaza la operacion de todos modos.
 */
export function enlacesPara(sesion) {
  if (!sesion) {
    return ENLACES_PUBLICOS;
  }

  const propios = ENLACES_PRIVADOS.filter(
    ({ tipos }) => !tipos || tipos.includes(sesion.tipoTrabajador),
  );
  return [...ENLACES_PUBLICOS, ...propios];
}

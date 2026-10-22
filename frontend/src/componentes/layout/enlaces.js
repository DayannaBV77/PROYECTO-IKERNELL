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

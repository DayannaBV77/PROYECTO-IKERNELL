/**
 * Lista de palabras o términos no permitidos (groserías / lenguaje ofensivo común en español).
 */
const PALABRAS_OFENSIVAS = [
  'gonorrea',
  'malparido',
  'malparida',
  'hijueputa',
  'hdp',
  'hp',
  'puta',
  'puto',
  'mierda',
  'carechimba',
  'pirobo',
  'piroba',
  'careverga',
  'verga',
  'marica',
  'maricon',
  'maricón',
  'estupido',
  'estupida',
  'estúpido',
  'estúpida',
  'imbecil',
  'imbécil',
  'pendejo',
  'pendeja',
  'culiao',
  'culiado',
  'cabron',
  'cabrón',
  'cabrona',
  'perra',
  'perro hdp',
  'coño',
  'carajo',
  'tarado',
  'tarada',
  'idiota',
  'bobo hdp',
  'huevon',
  'huevón',
  'weon',
  'weona',
  'chucha',
  'caremonda',
  'caremondá',
  'sapo hdp',
  'zorra',
];

/**
 * Normaliza un texto eliminando acentos, caracteres especiales repetidos y convirtiéndolo a minúsculas.
 */
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Valida si un texto contiene lenguaje inapropiado o groserías.
 * Retorna true si contiene groserías, o false si está limpio.
 */
export function contieneGroserias(texto) {
  if (!texto || typeof texto !== 'string') return false;

  const normalizado = normalizarTexto(texto);

  // Verificamos por palabras exactas o límites de palabra
  for (const palabra of PALABRAS_OFENSIVAS) {
    const palabraNorm = normalizarTexto(palabra);
    // Regex que busca la palabra como término independiente
    const regex = new RegExp(`(^|[^a-z0-9])${palabraNorm}([^a-z0-9]|$)`, 'i');
    if (regex.test(normalizado)) {
      return true;
    }
  }

  return false;
}


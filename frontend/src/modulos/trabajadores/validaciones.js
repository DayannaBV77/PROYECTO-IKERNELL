import { aFechaIso } from '../../utilidades/formato.js';

const CARACTERES_DIRECCION_PERMITIDOS = /^[\p{L}\p{M}\d\s#.,/()º°'-]+$/u;

const NOMENCLATURA_URBANA =
  /\b(?:calle|cl\.?|carrera|cra\.?|carr\.?|avenida|av\.?|diagonal|diag\.?|dg\.?|transversal|transv\.?|tv\.?|circular|circ\.?|autopista|v[ií]a)\s+\d+[a-z]?(?:\s*(?:bis|sur|norte|este|oeste))?\s*(?:#|n(?:o|°|º|umero)?\.?)\s*\d+[a-z]?\s*[-–]\s*\d+[a-z]?\b/iu;

const REFERENCIA_RURAL =
  /\b(?:vereda|corregimiento|finca|hacienda|caser[ií]o|inspecci[oó]n|resguardo|km|kil[oó]metro)\s+[\p{L}\p{M}\d]/iu;

const TIPOS_TRABAJADOR_VALIDOS = new Set(['COORDINADOR', 'LIDER', 'DESARROLLADOR']);
export const FECHA_MAXIMA_NACIMIENTO = '2007-12-31';

export function esFormatoDireccionColombiana(direccion) {
  if (typeof direccion !== 'string' || !direccion.trim() || direccion.length > 200) {
    return true;
  }

  const candidata = direccion.trim();
  if (!CARACTERES_DIRECCION_PERMITIDOS.test(candidata)) {
    return false;
  }

  return NOMENCLATURA_URBANA.test(candidata) || REFERENCIA_RURAL.test(candidata);
}

function fechaNacimientoInvalida(valor) {
  const iso = aFechaIso(valor);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return true;
  }

  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return true;
  }

  const limite = new Date(Date.UTC(2007, 11, 31));
  return fecha > limite;
}

export function validarCampoTrabajador(nombre, valor) {
  const texto = typeof valor === 'string' ? valor : '';

  if (nombre === 'tipoTrabajador') {
    return TIPOS_TRABAJADOR_VALIDOS.has(texto)
      ? null
      : 'Debe indicar el tipo de trabajador.';
  }

  if (!texto.trim()) {
    const etiquetas = {
      identificacion: 'Debe indicar la identificacion.',
      nombre: 'Debe indicar el nombre.',
      apellido: 'Debe indicar el apellido.',
      fechaNacimiento: 'Debe indicar la fecha de nacimiento.',
      direccion: 'Debe indicar la direccion.',
      profesion: 'Debe indicar la profesion.',
      especialidadDesarrollo: 'Debe indicar la especialidad de desarrollo.',
    };
    return etiquetas[nombre] || null;
  }

  if (nombre === 'identificacion') {
    if (!/^[0-9]+$/.test(texto)) {
      return 'La identificacion solo puede contener digitos.';
    }
    if (texto.length > 10) {
      return 'La identificacion admite maximo 10 digitos.';
    }
    if (texto.length < 10) {
      return `Faltan ${10 - texto.length} digitos para completar la identificacion.`;
    }
  }

  const limites = {
    nombre: ['El nombre admite hasta 100 caracteres.', 100],
    apellido: ['El apellido admite hasta 100 caracteres.', 100],
    direccion: ['La direccion admite hasta 200 caracteres.', 200],
    profesion: ['La profesion admite hasta 100 caracteres.', 100],
    especialidadDesarrollo: ['La especialidad admite hasta 100 caracteres.', 100],
  };
  const limite = limites[nombre];
  if (limite && texto.length > limite[1]) {
    return limite[0];
  }

  if (nombre === 'fechaNacimiento' && fechaNacimientoInvalida(texto)) {
    return 'La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior';
  }

  if (nombre === 'direccion' && !esFormatoDireccionColombiana(texto)) {
    return 'Use nomenclatura urbana (ej.: Calle 45 # 12-30) o una referencia rural (vereda, finca, corregimiento o km).';
  }

  return null;
}

export function validarTrabajador(valores) {
  return Object.fromEntries(
    Object.entries(valores)
      .map(([nombre, valor]) => [nombre, validarCampoTrabajador(nombre, valor)])
      .filter(([, error]) => error),
  );
}

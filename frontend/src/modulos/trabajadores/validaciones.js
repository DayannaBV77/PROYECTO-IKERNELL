import { aFechaIso } from '../../utilidades/formato.js';

const CARACTERES_DIRECCION_PERMITIDOS = /^[\p{L}\p{M}\d\s#.,/()º°'-]+$/u;

const NOMENCLATURA_URBANA =
  /\b(?:avenida\s+calle|avenida\s+carrera|av\.?\s+calle|av\.?\s+carrera|calle|cll?\.?|carrera|cra\.?|carr\.?|diagonal|diag\.?|dg\.?|transversal|transv\.?|tv\.?|circular|circ\.?|autopista|autop\.?|avenida|av\.?|ac\.?|ak\.?|v[ií]a)\s+\d+[a-z]{0,2}(?:\s+(?:bis|[a-z]|sur|norte|este|oeste)){0,3}\s*(?:#|n(?:o|°|º|umero)?\.?)\s*\d+[a-z]{0,2}(?:\s+(?:bis|[a-z]|sur|norte|este|oeste)){0,2}(?:\s*[-–]\s*|\s+)\d+[a-z]?(?:\s*(?:sur|norte|este|oeste))?\b/iu;

const REFERENCIA_RURAL =
  /\b(?:vereda|corregimiento|finca|hacienda|caser[ií]o|inspecci[oó]n|resguardo|km|kil[oó]metro)\s+[\p{L}\p{M}\d]/iu;

const TIPOS_TRABAJADOR_VALIDOS = new Set(['COORDINADOR', 'LIDER', 'DESARROLLADOR']);
export const FECHA_MAXIMA_NACIMIENTO = '2007-12-31';

export const REGLAS_DOCUMENTO = {
  CEDULA_CIUDADANIA: {
    codigo: 'CC',
    etiqueta: 'Cédula de ciudadanía',
    soloNumeros: true,
    min: 7,
    max: 10,
    inputMode: 'numeric',
    placeholder: 'Ej. 1010101010',
    mensajeError: 'La cédula de ciudadanía debe contener entre 7 y 10 dígitos numéricos.',
  },
  TARJETA_IDENTIDAD: {
    codigo: 'TI',
    etiqueta: 'Tarjeta de identidad',
    soloNumeros: true,
    min: 10,
    max: 11,
    inputMode: 'numeric',
    placeholder: 'Ej. 1001234567',
    mensajeError: 'La tarjeta de identidad debe contener 10 u 11 dígitos numéricos.',
  },
  CEDULA_EXTRANJERIA: {
    codigo: 'CE',
    etiqueta: 'Cédula de extranjería',
    soloNumeros: false,
    min: 6,
    max: 12,
    inputMode: 'text',
    placeholder: 'Ej. 524102',
    mensajeError: 'La cédula de extranjería debe contener entre 6 y 12 caracteres alfanuméricos.',
  },
  PASAPORTE: {
    codigo: 'PA',
    etiqueta: 'Pasaporte',
    soloNumeros: false,
    min: 6,
    max: 16,
    inputMode: 'text',
    placeholder: 'Ej. AB123456',
    mensajeError: 'El pasaporte debe contener entre 6 y 16 caracteres alfanuméricos.',
  },
  PPT: {
    codigo: 'PPT',
    etiqueta: 'Permiso por protección temporal',
    soloNumeros: false,
    min: 7,
    max: 10,
    inputMode: 'text',
    placeholder: 'Ej. 12345678',
    mensajeError: 'El permiso por protección temporal (PPT) debe contener entre 7 y 10 caracteres.',
  },
};

export const TIPOS_IDENTIFICACION = Object.entries(REGLAS_DOCUMENTO).map(([valor, cfg]) => ({
  valor,
  texto: `${cfg.codigo} — ${cfg.etiqueta}`,
  codigo: cfg.codigo,
}));

export function normalizarTipoDocumento(tipo) {
  if (!tipo || typeof tipo !== 'string') return 'CEDULA_CIUDADANIA';
  const u = tipo.trim().toUpperCase();
  if (u === 'TI' || u.includes('TARJETA')) return 'TARJETA_IDENTIDAD';
  if (u === 'PA' || u.includes('PASAPORTE')) return 'PASAPORTE';
  if (u === 'PPT' || u.includes('PROTECCION') || u.includes('PROTECCIÓN')) return 'PPT';
  if (u === 'CE' || u.includes('EXTRANJER')) return 'CEDULA_EXTRANJERIA';
  return 'CEDULA_CIUDADANIA';
}

export function sanitizarDocumento(valor, tipo) {
  const texto = typeof valor === 'string' ? valor : '';
  const clave = normalizarTipoDocumento(tipo);
  const regla = REGLAS_DOCUMENTO[clave];
  const limpio = regla.soloNumeros
    ? texto.replace(/\D+/g, '')
    : texto.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return limpio.slice(0, regla.max);
}

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

export function formatearDireccionEstandar(direccion) {
  if (typeof direccion !== 'string' || !direccion.trim()) return '';
  return direccion
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bavenida\s+carrera\b/gi, 'AK')
    .replace(/\bavenida\s+calle\b/gi, 'AC')
    .replace(/\bcalle\b/gi, 'CLL')
    .replace(/\bcarrera\b/gi, 'CRA')
    .replace(/\bavenida\b/gi, 'AV')
    .replace(/\bdiagonal\b/gi, 'DG')
    .replace(/\btransversal\b/gi, 'TV')
    .replace(/\bapartamento\b/gi, 'APTO')
    .replace(/\binterior\b/gi, 'INT')
    .replace(/\bn[o°º]\.?\s*/gi, '# ')
    .toUpperCase();
}

export function normalizarEntradaDireccion(texto) {
  if (typeof texto !== 'string') return '';
  return texto
    .replace(/ {2,}/g, ' ')
    .replace(/\b(?:no\.?|n[°º]\.?)\s+(?=\d)/gi, '# ');
}

export function analizarProgresoDireccion(direccion) {
  if (typeof direccion !== 'string' || !direccion.trim()) {
    return null;
  }

  const texto = direccion.trim();
  if (!CARACTERES_DIRECCION_PERMITIDOS.test(texto)) {
    return { tipo: 'aviso', texto: 'Contiene caracteres no permitidos en nomenclatura colombiana.' };
  }

  if (REFERENCIA_RURAL.test(texto)) {
    return { tipo: 'exito', texto: 'Referencia rural válida.' };
  }

  if (/\b(?:vereda|corregimiento|finca|hacienda|caser[ií]o|inspecci[oó]n|resguardo|km|kil[oó]metro)\b/i.test(texto)) {
    return {
      tipo: 'guia',
      texto: 'Vereda/sector identificado. Añade el nombre del predio o sector (ej. Finca La Esperanza o Km 4).',
    };
  }

  if (NOMENCLATURA_URBANA.test(texto)) {
    return {
      tipo: 'exito',
      texto: 'Estructura válida. Puedes añadir torre, apartamento o interior si aplica.',
    };
  }

  const tieneVia =
    /\b(?:avenida\s+calle|avenida\s+carrera|av\.?\s+calle|av\.?\s+carrera|calle|cll?\.?|carrera|cra\.?|carr\.?|diagonal|diag\.?|dg\.?|transversal|transv\.?|tv\.?|circular|circ\.?|autopista|autop\.?|avenida|av\.?|ac\.?|ak\.?|v[ií]a)\b/i.test(
      texto,
    );

  if (!tieneVia) {
    return {
      tipo: 'guia',
      texto: 'Comienza con una vía principal (ej. Calle, Carrera, Avenida) o una referencia rural (Vereda).',
    };
  }

  const tieneViaYNumero =
    /\b(?:avenida\s+calle|avenida\s+carrera|av\.?\s+calle|av\.?\s+carrera|calle|cll?\.?|carrera|cra\.?|carr\.?|diagonal|diag\.?|dg\.?|transversal|transv\.?|tv\.?|circular|circ\.?|autopista|autop\.?|avenida|av\.?|ac\.?|ak\.?|v[ií]a)\s+\d+/i.test(
      texto,
    );

  if (!tieneViaYNumero) {
    return {
      tipo: 'guia',
      texto: 'Indica el número de la vía principal (ej. 45).',
    };
  }

  if (!/#|n(?:o|°|º|umero)?\.?/i.test(texto)) {
    return {
      tipo: 'guia',
      texto: 'Falta el número de cruce (ej. # 12).',
    };
  }

  return {
    tipo: 'guia',
    texto: 'Falta el número de placa (ej. - 30).',
  };
}

function validarFechaNacimiento(valor) {
  const iso = aFechaIso(valor);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return 'Debe indicar la fecha de nacimiento.';
  }

  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return 'La fecha de nacimiento no es válida.';
  }

  const limiteMenoria = new Date(Date.UTC(2007, 11, 31));
  const hoy = new Date();
  const fechaHoyUtc = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

  if (fecha > fechaHoyUtc || fecha > limiteMenoria) {
    return 'La fecha de nacimiento no es válida. Debe ser del 31/12/2007 o anterior';
  }

  let edad = hoy.getFullYear() - anio;
  const mesActual = hoy.getMonth();
  const diaActual = hoy.getDate();
  if (mesActual < mes - 1 || (mesActual === mes - 1 && diaActual < dia)) {
    edad--;
  }

  if (edad > 80) {
    return 'Ingrese una fecha de nacimiento válida (edad máxima permitida: 80 años)';
  }

  return null;
}

export function validarCampoTrabajador(nombre, valor, contexto = {}) {
  const texto = typeof valor === 'string' ? valor : '';
  const tipoIdentificacion =
    typeof contexto === 'string'
      ? contexto
      : contexto?.tipoIdentificacion || 'CEDULA_CIUDADANIA';

  if (nombre === 'tipoIdentificacion') {
    return texto.trim() ? null : 'Debe indicar el tipo de identificacion.';
  }

  if (nombre === 'tipoTrabajador') {
    return TIPOS_TRABAJADOR_VALIDOS.has(texto)
      ? null
      : 'Debe indicar el tipo de trabajador.';
  }

  if (!texto.trim()) {
    const etiquetas = {
      tipoIdentificacion: 'Debe indicar el tipo de identificacion.',
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
    const limpio = texto.trim();
    const clave = normalizarTipoDocumento(tipoIdentificacion);
    const regla = REGLAS_DOCUMENTO[clave];

    if (regla.soloNumeros && !/^[0-9]+$/.test(limpio)) {
      return `${regla.etiqueta} solo puede contener dígitos numéricos.`;
    }
    if (!regla.soloNumeros && !/^[A-Za-z0-9]+$/.test(limpio)) {
      return `${regla.etiqueta} solo admite caracteres alfanuméricos sin espacios ni símbolos.`;
    }
    if (limpio.length < regla.min || limpio.length > regla.max) {
      return regla.mensajeError;
    }
    return null;
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

  if (nombre === 'fechaNacimiento') {
    return validarFechaNacimiento(texto);
  }

  if (nombre === 'direccion' && !esFormatoDireccionColombiana(texto)) {
    return 'Formato sugerido: Calle/Carrera [Número] # [Cruce] - [Placa], Torre/Apto [Opcional] o Vereda/Finca [Nombre].';
  }

  return null;
}

export function validarTrabajador(valores) {
  return Object.fromEntries(
    Object.entries(valores)
      .map(([nombre, valor]) => [nombre, validarCampoTrabajador(nombre, valor, valores)])
      .filter(([, error]) => error),
  );
}

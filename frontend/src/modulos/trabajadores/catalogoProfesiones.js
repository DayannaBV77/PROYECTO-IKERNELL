export const PROFESIONES = [
  'Ingeniero de sistemas',
  'Ingeniero de software',
  'Tecnólogo en análisis y desarrollo de software',
  'Técnico en sistemas',
  'Desarrollador de software',
  'Analista de sistemas',
  'Administrador de bases de datos',
  'Diseñador UI/UX',
  'Ingeniero de datos',
  'Profesional en ciberseguridad',
  'Otra profesión',
];

export function listarProfesiones(valor) {
  if (Array.isArray(valor)) {
    return [...new Set(valor.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (typeof valor !== 'string') {
    return [];
  }

  return [...new Set(valor.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function serializarProfesiones(valor) {
  return listarProfesiones(valor).join(', ');
}

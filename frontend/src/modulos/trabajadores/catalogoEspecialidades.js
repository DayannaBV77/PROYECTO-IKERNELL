export const ESPECIALIDADES_DESARROLLO = [
  'Frontend',
  'Backend',
  'Full Stack',
  'Desarrollo móvil',
  'Desarrollo de software',
  'Inteligencia artificial',
  'Ciencia de datos',
  'Ciberseguridad',
  'DevOps',
  'Java',
  'JavaScript',
  'TypeScript',
  'PHP',
  'Python',
  'C#',
  'C++',
  'C',
  'Kotlin',
  'React',
  'Laravel',
  'Spring Boot',
  'Angular',
  'Django',
  'MySQL',
  'PostgreSQL',
  'SQL Server',
  'MongoDB',
];

export function listarEspecialidades(valor) {
  if (Array.isArray(valor)) {
    return [...new Set(valor.map((item) => String(item).trim()).filter(Boolean))];
  }

  if (typeof valor !== 'string') {
    return [];
  }

  return [...new Set(valor.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function serializarEspecialidades(valor) {
  return listarEspecialidades(valor).join(', ');
}

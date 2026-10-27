export const CATEGORIAS_HABILIDADES = [
  {
    valor: 'AREA',
    texto: 'Areas',
    opciones: ['Frontend', 'Backend', 'Full Stack', 'Desarrollo 1'],
  },
  {
    valor: 'LENGUAJE',
    texto: 'Lenguajes',
    opciones: ['Java', 'JavaScript', 'TypeScript', 'PHP', 'Python', 'C#', 'C++', 'C', 'Kotlin', 'Swift'],
  },
  {
    valor: 'FRAMEWORK',
    texto: 'Frameworks',
    opciones: ['React', 'Laravel', 'Spring Boot', 'Angular', 'Django'],
  },
  {
    valor: 'BASE_DATOS',
    texto: 'Bases de datos',
    opciones: ['MySQL', 'PostgreSQL', 'SQL Server', 'MongoDB'],
  },
];

export function claveHabilidad(habilidad) {
  return `${habilidad.categoria}:${habilidad.nombre}`;
}

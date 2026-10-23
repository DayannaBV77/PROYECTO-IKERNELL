/** Formatea una fecha ISO (AAAA-MM-DD) para mostrarla al usuario. */
export function formatearFecha(iso) {
  if (!iso) {
    return null;
  }
  const fecha = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
}

/**
 * Iniciales de un nombre completo, para el avatar de la sesion.
 *
 * Toma las dos primeras palabras: con los nombres compuestos que se usan aqui,
 * tomar mas llenaria el circulo de letras.
 */
export function iniciales(nombreCompleto) {
  return (nombreCompleto || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

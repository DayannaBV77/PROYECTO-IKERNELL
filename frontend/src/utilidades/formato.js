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

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

/** Una fecha ya en ISO: AAAA-MM-DD, que es lo que produce <input type="date">. */
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Lo que se escribe a mano cuando no hay selector: d/m/aaaa, con / - o . */
const CON_DIA_PRIMERO = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

/**
 * Normaliza a ISO (AAAA-MM-DD) el valor de un campo de fecha antes de enviarlo.
 *
 * `<input type="date">` ya entrega ISO, pero no todos los navegadores lo
 * soportan: donde no hay selector nativo el control degrada a texto y el
 * usuario escribe "12/07/1994". Ese valor llegaba al servidor tal cual y no se
 * podia convertir a una fecha, asi que el perfil no se guardaba.
 *
 * Se trabaja con la cadena, nunca con `Date`: construir un `Date` para volver a
 * formatearlo desplaza la fecha un dia en los husos al oeste de UTC, que es el
 * error clasico al mover fechas de nacimiento entre cliente y servidor. Aqui no
 * hay hora ni huso: solo se reordenan los numeros que el usuario escribio.
 *
 * Lo que no encaja en ninguno de los dos formatos se devuelve intacto: no
 * corresponde a esta funcion decidir si una fecha es valida -eso lo resuelve el
 * servidor, que responde senalando el campo-, sino evitar que un formato
 * conocido se pierda en el camino.
 *
 * @param {string} valor valor del campo
 * @returns {string|null} la fecha en ISO, o null si el campo esta vacio
 */
export function aFechaIso(valor) {
  const texto = (valor || '').trim();
  if (!texto) {
    return null;
  }
  if (ISO.test(texto)) {
    return texto;
  }

  const partes = CON_DIA_PRIMERO.exec(texto);
  if (!partes) {
    return texto;
  }

  const [, dia, mes, anio] = partes;
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
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

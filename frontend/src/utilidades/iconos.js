import {
  BrainCircuit,
  Cloud,
  Compass,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  Star,
  Telescope,
  Users,
  Wrench,
} from 'lucide-react';

/**
 * Iconos de las tarjetas de contenido publico.
 *
 * El backend guarda titulo, cuerpo, enlace, fecha y orden; no guarda ningun
 * icono, porque ningun requerimiento lo contempla. La eleccion es puramente de
 * presentacion y se resuelve aqui, por palabra clave del titulo, con un icono
 * neutro de respaldo. De este modo el contenido sigue siendo el del servidor y
 * el icono no inventa informacion: solo acompana.
 *
 * Si la empresa define mas adelante un icono por pieza de contenido, esta tabla
 * se sustituye por ese dato sin tocar los componentes.
 */
const POR_PALABRA = [
  [['mision'], Star],
  [['vision'], Telescope],
  [['valor'], Users],
  [['medida', 'desarrollo de software'], Wrench],
  [['nube', 'cloud'], Cloud],
  [['inteligencia artificial', 'automatiza'], BrainCircuit],
  [['seguridad', 'ciberseguridad'], ShieldCheck],
  [['consultoria', 'acompanamiento', 'asesor'], Lightbulb],
  [['mantenimiento', 'evolucion', 'soporte'], RefreshCw],
];

/** Quita acentos y pasa a minusculas para que la coincidencia no dependa de ellos. */
function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function iconoParaTitulo(titulo, respaldo = Compass) {
  const normalizado = normalizar(titulo);
  for (const [palabras, icono] of POR_PALABRA) {
    if (palabras.some((palabra) => normalizado.includes(palabra))) {
      return icono;
    }
  }
  return respaldo;
}

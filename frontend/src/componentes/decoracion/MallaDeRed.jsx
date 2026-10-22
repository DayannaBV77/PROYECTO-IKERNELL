/**
 * Malla de nodos y conexiones: el motivo tecnologico de fondo de los mockups.
 *
 * Se dibuja como SVG en linea y no como imagen porque pesa unos cientos de
 * bytes, escala sin perder nitidez y toma sus colores de las variables del
 * sistema de diseno, de modo que acompana cualquier fondo sin recortarse.
 *
 * Las coordenadas son fijas: una distribucion aleatoria cambiaria en cada
 * render y haria parpadear el fondo.
 */
const NODOS = [
  [12, 22], [38, 10], [64, 26], [88, 14], [22, 52], [50, 44], [78, 58],
  [8, 78], [34, 86], [60, 72], [92, 84], [46, 64], [70, 38], [26, 34],
];

const CONEXIONES = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 6], [4, 5], [5, 6],
  [4, 7], [7, 8], [8, 9], [9, 10], [5, 11], [11, 9], [2, 12], [12, 5],
  [0, 13], [13, 5], [13, 1], [6, 10], [8, 11], [3, 6],
];

export default function MallaDeRed({ opacidad = 0.5, color = 'currentColor', ...resto }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      style={{ opacity: opacidad, color }}
      {...resto}
    >
      <g stroke="currentColor" strokeWidth="0.18" opacity="0.55">
        {CONEXIONES.map(([desde, hasta]) => (
          <line
            key={`${desde}-${hasta}`}
            x1={NODOS[desde][0]}
            y1={NODOS[desde][1]}
            x2={NODOS[hasta][0]}
            y2={NODOS[hasta][1]}
          />
        ))}
      </g>
      <g fill="currentColor">
        {NODOS.map(([x, y], indice) => (
          <circle key={indice} cx={x} cy={y} r={indice % 3 === 0 ? 0.85 : 0.55} />
        ))}
      </g>
    </svg>
  );
}
